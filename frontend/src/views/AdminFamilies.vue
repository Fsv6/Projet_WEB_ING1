<template>
  <AppLayout>
    <div class="admin-families-container">
      <h1 class="page-title">Gestion des familles</h1>

      <div class="actions-bar">
        <div class="search-box">
          <input
              type="text"
              v-model="searchQuery"
              placeholder="Rechercher..."
              class="search-input"
          />
        </div>
        <button @click="openAddFamilleModal" class="add-famille-btn">
          <i class="fas fa-plus"></i> Ajouter une famille
        </button>
      </div>
      <div v-if="message" :class="{'success-msg': messageSuccess, 'error-msg': !messageSuccess}">
        {{ message }}
      </div>

      <div class="families-table">
        <table>
          <thead>
          <tr>
            <th>Code Famille</th>
            <th>Nom</th>
            <th>Description</th>
            <th>Membres</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="famille in filteredFamilies" :key="famille._id">
            <td><strong>{{ famille.codeFamille }}</strong></td>
            <td>{{ famille.nom || '-' }}</td>
            <td>{{ famille.description || '-' }}</td>
            <td>
              <span class="badge-members">{{ getMembresValidesCount(famille) }}</span>
            </td>
            <td class="actions-cell">
              <button @click="editFamille(famille)" class="action-btn edit" title="Modifier">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="viewMembers(famille)" class="action-btn view" title="Voir les membres">
                <i class="fas fa-users"></i>
              </button>
              <button @click="confirmDelete(famille)" class="action-btn delete" title="Supprimer">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal pour éditer/ajouter une famille -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>{{ editingFamille ? 'Modifier' : 'Ajouter' }} une famille</h2>
        <form @submit.prevent="saveFamille">
          <div class="form-row">
            <label>Code Famille :</label>
            <input v-model="form.codeFamille" type="text" required :disabled="editingFamille" />
          </div>
          <div class="form-row">
            <label>Nom de la famille :</label>
            <input v-model="form.nom" type="text" required placeholder="Ex: Famille Dupont" />
          </div>
          <div class="form-row">
            <label>Description :</label>
            <textarea v-model="form.description" placeholder="Description de la famille (optionnelle)"></textarea>
          </div>
          <div class="modal-actions">
            <button type="submit" class="save-btn">Enregistrer</button>
            <button type="button" @click="closeModal" class="cancel-btn">Annuler</button>
          </div>
        </form>
        <div v-if="formMessage" :class="{'success-msg': formSuccess, 'error-msg': !formSuccess}">{{ formMessage }}</div>
      </div>
    </div>

    <!-- Modal pour voir les membres -->
    <div v-if="showMembersModal" class="modal">
      <div class="modal-content members-modal">
        <div class="modal-header">
          <h2>Membres de la famille {{ selectedFamille?.nom || selectedFamille?.codeFamille }}</h2>
          <button type="button" @click="openAddMemberModal" class="add-member-btn">
            <i class="fas fa-user-plus"></i> Ajouter un membre
          </button>
        </div>

        <!-- Barre de recherche pour filtrer les membres -->
        <div class="members-search-bar">
          <div class="search-container">
            <input
                type="text"
                v-model="memberFilterQuery"
                placeholder="Rechercher un membre..."
                class="search-input"
            />
            <span class="search-icon">
              <i class="fas fa-search"></i>
            </span>
          </div>
        </div>

        <div v-if="selectedFamille">
          <div v-if="filteredFamilyMembers.length > 0">
            <table class="members-table">
              <thead>
              <tr>
                <th>Photo</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Login</th>
                <th>Niveau</th>
                <th>Rôle</th>
                <th>Actions</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="member in filteredFamilyMembers" :key="member._id">
                <td>
                  <div class="member-avatar">
                    <img :src="getPhotoUrl(member.photo, member._id)" class="member-avatar" alt="Avatar">
                  </div>
                </td>
                <td>{{ member.nom }}</td>
                <td>{{ member.prenom }}</td>
                <td>{{ member.login || '-' }}</td>
                <td>{{ member.niveau || '-' }}</td>
                <td>{{ member.role || '-' }}</td>
                <td>
                  <button @click="removeMember(member)" class="action-btn delete" title="Retirer de la famille">
                    <i class="fas fa-user-minus"></i>
                  </button>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="familyMembers.length > 0 && filteredFamilyMembers.length === 0" class="no-results">
            <i class="fas fa-search"></i>
            <p>Aucun membre ne correspond à votre recherche</p>
            <button @click="memberFilterQuery = ''" class="reset-search-btn">
              Réinitialiser la recherche
            </button>
          </div>
          <div v-else class="no-members">
            <i class="fas fa-users-slash"></i>
            <p>Aucun membre dans cette famille</p>
            <button @click="openAddMemberModal" class="add-member-btn-empty">
              <i class="fas fa-user-plus"></i> Ajouter un membre
            </button>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" @click="closeMembersModal" class="cancel-btn">Fermer</button>
        </div>
      </div>
    </div>

    <!-- Modal pour ajouter un membre à la famille -->
    <div v-if="showAddMemberModal" class="modal">
      <div class="modal-content">
        <h2>Ajouter un membre à la famille {{ selectedFamille?.codeFamille }}</h2>
        <form @submit.prevent="addMemberToFamily">
          <div class="form-row">
            <label>Rechercher un utilisateur existant :</label>
            <div class="search-container">
              <input
                  type="text"
                  v-model="memberSearchQuery"
                  placeholder="Rechercher par nom, prénom ou login..."
                  class="search-input"
              />
              <button type="button" @click="searchUsers" class="search-btn">
                <i class="fas fa-search"></i>
              </button>
            </div>
          </div>

          <div v-if="searchResults.length > 0" class="search-results">
            <h3>Résultats de recherche</h3>
            <div class="users-list">
              <div
                  v-for="user in searchResults"
                  :key="user._id"
                  class="user-item"
                  @click="selectUser(user)"
                  :class="{'selected': selectedUser && selectedUser._id === user._id}"
              >
                <div class="user-icon">
                  <i :class="getGenderIcon(user.genre)"></i>
                </div>
                <div class="user-info">
                  <div class="user-name">{{ user.nom }} {{ user.prenom }}</div>
                  <div class="user-login">{{ user.login }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-row" v-if="!selectedUser">
            <div class="separator">
              <span>ou créer une nouvelle personne</span>
            </div>
          </div>

          <div v-if="!selectedUser">
            <div class="form-row">
              <label>Nom :</label>
              <input v-model="newPersonForm.nom" type="text" required />
            </div>
            <div class="form-row">
              <label>Prénom :</label>
              <input v-model="newPersonForm.prenom" type="text" required />
            </div>
            <div class="form-row">
              <label>Genre :</label>
              <select v-model="newPersonForm.genre">
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
                <option value="Autres">Autres</option>
              </select>
            </div>
          </div>

          <div class="modal-actions">
            <button
                type="submit"
                class="save-btn"
                :disabled="!selectedUser && (!newPersonForm.nom || !newPersonForm.prenom)"
            >
              Ajouter à la famille
            </button>
            <button type="button" @click="closeAddMemberModal" class="cancel-btn">Annuler</button>
          </div>
        </form>
        <div v-if="memberMessage" :class="{'success-msg': memberSuccess, 'error-msg': !memberSuccess}">
          {{ memberMessage }}
        </div>
      </div>
    </div>

    <!-- Notification -->
    <div v-if="showNotification" class="notification" @click="showNotification = false">
      <div class="notification-content" :class="[`notification-${notificationType}`]" @click.stop>
        <div class="notification-icon">
          <i :class="getNotificationIcon()"></i>
        </div>
        <div class="notification-text">
          <p>{{ notificationMessage }}</p>
          <div v-if="notificationHtmlContent" v-html="notificationHtmlContent"></div>
        </div>
        <div v-if="notificationActions" class="notification-actions">
          <button v-for="(action, index) in notificationActions" :key="index"
                  :class="['notification-btn', action.type]"
                  @click="action.handler">
            {{ action.text }}
          </button>
        </div>
        <div v-else class="notification-actions">
          <button @click="showNotification = false" class="notification-close">Fermer</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import AppLayout from '@/layout/AppLayoutGlobal.vue';
import api from '@/services/api';
import { getPhotoUrl } from '@/utils/photo';

export default {
  name: 'AdminFamilies',
  components: {
    AppLayout
  },
  setup() {
    const families = ref([]);
    const searchQuery = ref('');
    const showModal = ref(false);
    const editingFamille = ref(null);
    const form = ref({
      codeFamille: '',
      nom: '',
      description: ''
    });
    const formMessage = ref('');
    const formSuccess = ref(false);
    const message = ref('');
    const messageSuccess = ref(false);
    const showMembersModal = ref(false);
    const selectedFamille = ref(null);
    const familyMembers = ref([]);

    // Compteur de membres valides par famille
    const membresValidesCount = ref({});

    // Nouveaux états pour l'ajout de membres
    const showAddMemberModal = ref(false);
    const memberSearchQuery = ref('');
    const searchResults = ref([]);
    const selectedUser = ref(null);
    const newPersonForm = ref({
      nom: '',
      prenom: '',
      genre: 'Homme'
    });
    const memberMessage = ref('');
    const memberSuccess = ref(false);

    // Recherche de membres dans la famille
    const memberFilterQuery = ref('');
    const filteredFamilyMembers = computed(() => {
      if (!memberFilterQuery.value.trim()) {
        return familyMembers.value;
      }

      const query = memberFilterQuery.value.toLowerCase().trim();
      return familyMembers.value.filter(member =>
          member.nom?.toLowerCase().includes(query) ||
          member.prenom?.toLowerCase().includes(query) ||
          member.login?.toLowerCase().includes(query) ||
          (member.role?.toLowerCase().includes(query)) ||
          (member.niveau?.toLowerCase().includes(query))
      );
    });

    // Notifications
    const showNotification = ref(false);
    const notificationMessage = ref('');
    const notificationType = ref('info'); // 'success', 'error', 'warning', 'info'
    const notificationDuration = ref(3000);
    const notificationHtmlContent = ref('');
    const notificationActions = ref([]);

    const displayNotification = (message, type = 'info', duration = 3000, htmlContent = '', actions = null) => {
      notificationMessage.value = message;
      notificationType.value = type;
      notificationDuration.value = duration;
      notificationHtmlContent.value = htmlContent;
      notificationActions.value = actions || [];
      showNotification.value = true;

      // Fermer automatiquement après la durée spécifiée
      if (duration > 0) {
        setTimeout(() => {
          showNotification.value = false;
        }, duration);
      }
    };

    const loadFamilies = async () => {
      try {
        const response = await api.get('/familles');
        families.value = response.data;

        // Charger les compteurs de membres valides
        await loadMembresValidesCount();
      } catch (error) {
        console.error('Erreur lors du chargement des familles:', error);
        message.value = 'Erreur lors du chargement des familles';
        messageSuccess.value = false;
      }
    };

    const loadMembresValidesCount = async () => {
      try {
        const response = await api.get('/familles/membres-count');
        membresValidesCount.value = response.data;
      } catch (error) {
        console.error('Erreur lors du chargement des compteurs de membres:', error);
      }
    };

    const filteredFamilies = computed(() => {
      if (!searchQuery.value) return families.value;
      const query = searchQuery.value.toLowerCase();
      return families.value.filter(famille =>
          famille.codeFamille?.toLowerCase().includes(query) ||
          famille.nom?.toLowerCase().includes(query) ||
          famille.description?.toLowerCase().includes(query)
      );
    });

    const formatDate = (dateString) => {
      if (!dateString) return 'Non renseignée';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Non renseignée';
      return date.toLocaleDateString('fr-FR');
    };

    const getGenderIcon = (genre) => {
      switch (genre) {
        case 'Homme':
          return 'fas fa-male';
        case 'Femme':
          return 'fas fa-female';
        default:
          return 'fas fa-user';
      }
    };

    const editFamille = (famille) => {
      editingFamille.value = famille;
      form.value = {
        codeFamille: famille.codeFamille,
        nom: famille.nom || '',
        description: famille.description || ''
      };
      formMessage.value = '';
      showModal.value = true;
    };

    const openAddFamilleModal = () => {
      editingFamille.value = null;
      showModal.value = true;
      form.value = {
        codeFamille: '',
        nom: '',
        description: ''
      };
      formMessage.value = '';
    };

    const closeModal = () => {
      showModal.value = false;
      editingFamille.value = null;
    };

    const saveFamille = async () => {
      try {
        formMessage.value = '';

        const familleData = {
          codeFamille: form.value.codeFamille.trim(),
          nom: form.value.nom.trim(),
          description: form.value.description?.trim() || ''
        };

        let response;
        if (editingFamille.value) {
          response = await api.put(`/familles/${editingFamille.value._id}`, familleData);
        } else {
          response = await api.post('/familles', familleData);
        }

        if (response.data) {
          formMessage.value = editingFamille.value ?
              'Famille modifiée avec succès !' :
              'Famille ajoutée avec succès !';
          formSuccess.value = true;
          await loadFamilies();
          setTimeout(() => closeModal(), 1500);
        }
      } catch (err) {
        let errorMessage = editingFamille.value ?
            'Erreur lors de la modification de la famille' :
            'Erreur lors de la création de la famille';

        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }

        formMessage.value = errorMessage;
        formSuccess.value = false;
      }
    };

    const confirmDelete = async (famille) => {
      // Actions pour les boutons
      const actions = [
        {
          text: 'Oui, supprimer',
          type: 'confirm',
          handler: async () => {
            showNotification.value = false;

            try {
              // D'abord vérifier si la famille a des membres
              const response = await api.get(`/familles/${famille._id}/membres`);
              const membres = response.data;

              // Choix de suppression selon les cas
              if (membres.length > 0) {
                // Proposer des options si la famille a des membres
                const optionsActions = [
                  {
                    text: 'Supprimer tout',
                    type: 'danger',
                    handler: async () => {
                      showNotification.value = false;
                      // Supprimer la famille ET les personnes
                      await deleteFamilleWithOptions(famille, true, false);
                    }
                  },
                  {
                    text: 'Conserver les personnes',
                    type: 'warning',
                    handler: async () => {
                      showNotification.value = false;
                      // Supprimer la famille mais conserver les personnes
                      await deleteFamilleWithOptions(famille, true, true);
                    }
                  },
                  {
                    text: 'Annuler',
                    type: 'cancel',
                    handler: () => {
                      showNotification.value = false;
                    }
                  }
                ];

                displayNotification(
                    `La famille ${famille.codeFamille} contient ${membres.length} membre(s). Souhaitez-vous supprimer également les personnes associées?`,
                    'warning',
                    0,
                    '',
                    optionsActions
                );
              } else {
                // Pas de membres, supprimer directement
                await deleteFamilleWithOptions(famille, false, true);
              }
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              if (error.response?.data?.hasUsers) {
                // Si la famille a des utilisateurs, proposer la suppression forcée
                const forceActions = [
                  {
                    text: 'Forcer la suppression',
                    type: 'warning',
                    handler: async () => {
                      showNotification.value = false;
                      // Suppression forcée
                      await deleteFamilleWithOptions(famille, true, true);
                    }
                  },
                  {
                    text: 'Annuler',
                    type: 'cancel',
                    handler: () => {
                      showNotification.value = false;
                    }
                  }
                ];

                displayNotification(
                    `La famille ne peut pas être supprimée car elle contient des utilisateurs associés (${error.response.data.count}). Voulez-vous tout de même forcer la suppression ? Les utilisateurs seront dissociés de cette famille.`,
                    'error',
                    0,
                    '',
                    forceActions
                );
              } else {
                displayNotification(
                    error.response?.data?.message || "Erreur lors de la suppression de la famille.",
                    'error',
                    3000
                );
              }
            }
          }
        },
        {
          text: 'Annuler',
          type: 'cancel',
          handler: () => {
            showNotification.value = false;
          }
        }
      ];

      // Affichage du choix de confirmation modal personnalisé
      displayNotification(
          `Êtes-vous sûr de vouloir supprimer la famille ${famille.codeFamille} ?`,
          'warning',
          0, // 0 = ne pas fermer automatiquement
          '',
          actions
      );
    };

    const deleteFamilleWithOptions = async (famille, forcerSuppression, conserverPersonnes) => {
      try {
        // Construire l'URL avec les paramètres
        let deleteUrl = `/familles/${famille._id}`;
        if (forcerSuppression) {
          deleteUrl += `?forcerSuppression=true&conserverPersonnes=${conserverPersonnes}`;
        }

        // Afficher un message de chargement
        displayNotification('Suppression en cours...', 'info', 0);

        // Appeler l'API de suppression
        const deleteResponse = await api.delete(deleteUrl);

        // Fermer la notification de chargement
        showNotification.value = false;

        // Traiter la réponse
        if (deleteResponse.data) {
          let successMessage = 'Famille supprimée avec succès !';

          // Ajouter des détails à la confirmation
          if (deleteResponse.data.membresCount > 0) {
            successMessage += deleteResponse.data.personnesConservees ?
                ' Les personnes ont été conservées.' :
                ` ${deleteResponse.data.membresCount} personne(s) ont également été supprimées.`;
          }

          // Afficher le message de succès
          displayNotification(successMessage, 'success', 3000);

          // Recharger la liste des familles
          await loadFamilies();
        }
      } catch (error) {
        console.error('Erreur lors de la suppression forcée:', error);
        displayNotification(
            error.response?.data?.message || "Erreur lors de la suppression de la famille.",
            'error',
            3000
        );
      }
    };

    const viewMembers = async (famille) => {
      selectedFamille.value = famille;
      showMembersModal.value = true;
      memberFilterQuery.value = '';
      await loadFamilyMembers();
    };

    const loadFamilyMembers = async () => {
      if (!selectedFamille.value) return;

      try {
        console.log(`Chargement des membres pour la famille: ${selectedFamille.value.codeFamille} (ID: ${selectedFamille.value._id})`);
        const response = await api.get(`/familles/${selectedFamille.value._id}/membres`);
        console.log('Réponse API membres:', response.data);
        familyMembers.value = response.data;
        console.log(`Nombre de membres chargés: ${familyMembers.value.length}`);
      } catch (error) {
        console.error('Erreur lors du chargement des membres:', error);
        familyMembers.value = [];
      }
    };

    const closeMembersModal = () => {
      showMembersModal.value = false;
      selectedFamille.value = null;
      familyMembers.value = [];
      memberFilterQuery.value = '';
    };

    // Nouveaux méthodes pour la gestion des membres
    const openAddMemberModal = () => {
      showAddMemberModal.value = true;
      memberSearchQuery.value = '';
      searchResults.value = [];
      selectedUser.value = null;
      newPersonForm.value = {
        nom: '',
        prenom: '',
        genre: 'Homme'
      };
      memberMessage.value = '';
    };

    const closeAddMemberModal = () => {
      showAddMemberModal.value = false;
      memberSearchQuery.value = '';
      searchResults.value = [];
      selectedUser.value = null;
    };

    const searchUsers = async () => {
      if (!memberSearchQuery.value.trim()) return;

      try {
        const response = await api.get(`/users/search?query=${memberSearchQuery.value}`);
        searchResults.value = response.data;
      } catch (error) {
        console.error('Erreur lors de la recherche d\'utilisateurs:', error);
        searchResults.value = [];
      }
    };

    const selectUser = (user) => {
      selectedUser.value = user;
    };

    const addMemberToFamily = async () => {
      if (!selectedFamille.value) return;

      try {
        memberMessage.value = '';

        let personneId;

        if (selectedUser.value) {
          // Ajouter un utilisateur existant
          personneId = selectedUser.value.personne;
        } else {
          // Créer une nouvelle personne
          const newPersonne = {
            nom: newPersonForm.value.nom.trim(),
            prenom: newPersonForm.value.prenom.trim(),
            genre: newPersonForm.value.genre
          };

          const response = await api.post('/personnes', newPersonne);
          personneId = response.data._id;
        }

        // Ajouter la personne à la famille
        try {
          await api.put(`/familles/${selectedFamille.value._id}/membres`, {
            personneId
          });

          memberMessage.value = 'Membre ajouté avec succès !';
          memberSuccess.value = true;

          // Recharger les membres
          await loadFamilyMembers();

          // Mettre à jour le compteur de membres valides
          await loadMembresValidesCount();

          // Fermer la modal après un court délai
          setTimeout(() => {
            closeAddMemberModal();
          }, 1500);
        } catch (error) {
          if (error.response?.data?.message.includes("appartient déjà à une autre famille")) {
            const autreFamille = error.response.data.famille;
            memberMessage.value = `Cette personne appartient déjà à la famille ${autreFamille.codeFamille} (${autreFamille.nom})`;
          } else {
            memberMessage.value = error.response?.data?.message || "Erreur lors de l'ajout du membre";
          }
          memberSuccess.value = false;
        }

      } catch (error) {
        let errorMessage = "Erreur lors de l'ajout du membre";

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        memberMessage.value = errorMessage;
        memberSuccess.value = false;
      }
    };

    const removeMember = async (member) => {
      console.log('Removing member:', member);

      // Préparer les options en fonction du type d'utilisateur
      const hasUserAccount = member.login && member.role;
      const confirmationText = `Souhaitez-vous retirer ${member.prenom} ${member.nom} de cette famille ?`;

      const modalContent = `
        <div class="confirmation-details">
          <div class="member-info">
            <div class="member-info-item"><strong>Nom:</strong> ${member.nom} ${member.prenom}</div>
            ${hasUserAccount ? `<div class="member-info-item"><strong>Login:</strong> ${member.login}</div>` : ''}
            ${hasUserAccount ? `<div class="member-info-item"><strong>Rôle:</strong> ${member.role}</div>` : ''}
            ${hasUserAccount ? `<div class="member-info-item"><strong>Niveau:</strong> ${member.niveau}</div>` : ''}
            ${hasUserAccount ? `
            <div class="member-warning">
              <i class="fas fa-exclamation-triangle"></i> Cette personne possède un compte utilisateur. Le retirer de la famille pourrait affecter son accès à certaines fonctionnalités.
            </div>` : ''}
          </div>
        </div>
      `;

      // Actions pour les boutons
      const actions = [
        {
          text: 'Retirer de la famille',
          type: 'warning',
          handler: async () => {
            showNotification.value = false;

            try {
              // Afficher une indication de chargement
              displayNotification(
                  `Retrait de ${member.prenom} ${member.nom} en cours...`,
                  'info',
                  0
              );

              // Appel API avec paramètre pour conserver la personne
              const response = await api.delete(
                  `familles/${selectedFamille.value._id}/membres/${member._id}?conserverPersonne=true`
              );

              // Fermer la notification de chargement
              showNotification.value = false;

              if (response.data.familleDeleted) {
                displayNotification(
                    `${member.prenom} ${member.nom} a été retiré. La famille a été supprimée car elle n'avait plus de membres.`,
                    'success',
                    5000
                );
                loadFamilies();
                closeMembersModal();
              } else {
                displayNotification(
                    `${member.prenom} ${member.nom} a été retiré de la famille. ${response.data.remainingMembers} membre(s) restant(s).`,
                    'success',
                    5000
                );
                loadFamilyMembers();

                // Mettre à jour le compteur de membres valides
                await loadMembresValidesCount();
              }
            } catch (error) {
              console.error('Error removing member:', error);
              displayNotification(
                  `Erreur lors du retrait du membre: ${error.response?.data?.message || error.message}`,
                  'error',
                  5000
              );
            }
          }
        },
        {
          text: 'Annuler',
          type: 'cancel',
          handler: () => {
            showNotification.value = false;
          }
        }
      ];

      // Utiliser la notification avancée avec les actions
      displayNotification(
          confirmationText,
          'warning',
          0, // Ne pas fermer automatiquement
          modalContent,
          actions
      );
    };

    const getNotificationIcon = () => {
      switch (notificationType.value) {
        case 'success':
          return 'fas fa-check-circle';
        case 'error':
          return 'fas fa-exclamation-circle';
        case 'warning':
          return 'fas fa-exclamation-triangle';
        default:
          return 'fas fa-info-circle';
      }
    };

    const getMembresValidesCount = (famille) => {
      if (!famille || !famille._id) return 0;

      // Utiliser le compteur exact provenant de l'API
      if (membresValidesCount.value && membresValidesCount.value[famille._id]) {
        return membresValidesCount.value[famille._id];
      }

      // Fallback : filtrer les membres qui ont une référence personne valide
      if (famille.membres) {
        return famille.membres.filter(membre => membre.personne && membre.personne._id).length;
      }

      return 0;
    };

    onMounted(() => {
      loadFamilies();
    });

    return {
      families,
      searchQuery,
      filteredFamilies,
      showModal,
      editingFamille,
      editFamille,
      openAddFamilleModal,
      closeModal,
      confirmDelete,
      saveFamille,
      form,
      formMessage,
      formSuccess,
      message,
      messageSuccess,
      showMembersModal,
      selectedFamille,
      familyMembers,
      viewMembers,
      closeMembersModal,
      formatDate,
      getGenderIcon,
      // Nouvelles propriétés et méthodes
      showAddMemberModal,
      memberSearchQuery,
      searchResults,
      selectedUser,
      newPersonForm,
      memberMessage,
      memberSuccess,
      openAddMemberModal,
      closeAddMemberModal,
      searchUsers,
      selectUser,
      addMemberToFamily,
      removeMember,
      // Notifications
      showNotification,
      notificationMessage,
      notificationType,
      displayNotification,
      getNotificationIcon,
      notificationHtmlContent,
      notificationActions,
      memberFilterQuery,
      filteredFamilyMembers,
      getMembresValidesCount,
      membresValidesCount,
      getPhotoUrl
    };
  }
};
</script>

<style scoped>
.admin-families-container {
  padding: 20px;
  background-color: #f8f9fa;
  min-height: calc(100vh - 40px);
}

.page-title {
  color: #2c5038;
  margin-bottom: 25px;
  font-size: 1.8rem;
  font-weight: 600;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  align-items: center;
}

.search-box {
  flex: 1;
  max-width: 300px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #2c5038;
  outline: none;
}

.add-famille-btn {
  background-color: #2c5038;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.add-famille-btn:hover {
  background-color: #1e3725;
}

.families-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f4f6f8;
  color: #2c5038;
  font-weight: 600;
  font-size: 0.9rem;
}

.badge-members {
  background-color: #2c5038;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  display: inline-block;
  min-width: 25px;
  text-align: center;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.edit {
  background-color: #2c5038;
  color: white;
}

.action-btn.view {
  background-color: #4a6fa5;
  color: white;
}

.action-btn.delete {
  background-color: #dc3545;
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.action-btn.edit:hover {
  background-color: #1e3725;
}

.action-btn.view:hover {
  background-color: #3a5a84;
}

.action-btn.delete:hover {
  background-color: #bd2130;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 25px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.members-modal {
  width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.form-row {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c5038;
}

input, select, textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

input:focus, select:focus, textarea:focus {
  border-color: #2c5038;
  outline: none;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
}

.save-btn {
  background-color: #2c5038;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.save-btn:hover {
  background-color: #1e3725;
}

.save-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background-color: #5a6268;
}

.success-msg {
  background-color: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 4px;
  margin-top: 15px;
}

.error-msg {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 4px;
  margin-top: 15px;
}

.members-table {
  width: 100%;
  margin-top: 15px;
}

.member-avatar {
  width: 32px;
  height: 32px;
  background-color: #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2c5038;
}

.no-members {
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
}

.no-members i {
  font-size: 48px;
  margin-bottom: 15px;
  color: #dee2e6;
}

.no-members p {
  margin-bottom: 20px;
}

.add-member-btn {
  background-color: #2c5038;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.add-member-btn:hover {
  background-color: #1e3725;
}

.add-member-btn-empty {
  background-color: #2c5038;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.search-container {
  display: flex;
  gap: 10px;
}

.search-btn {
  background-color: #2c5038;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
}

.search-results {
  margin-top: 20px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 10px;
}

.search-results h3 {
  margin-bottom: 15px;
  color: #2c5038;
  font-weight: 500;
  font-size: 16px;
}

.users-list {
  max-height: 200px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: #f8f9fa;
}

.user-item.selected {
  background-color: #e8f4ea;
  border: 1px solid #2c5038;
}

.user-icon {
  width: 32px;
  height: 32px;
  background-color: #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  color: #2c5038;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 500;
}

.user-login {
  font-size: 12px;
  color: #6c757d;
}

.separator {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
}

.separator::before,
.separator::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #dee2e6;
}

.separator span {
  padding: 0 10px;
  color: #6c757d;
  font-size: 14px;
}

/* Notification */
.notification {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.notification-content {
  background-color: white;
  padding: 25px;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: slideDown 0.3s ease-out;
}

.notification-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.notification-success .notification-icon {
  color: #28a745;
}

.notification-error .notification-icon {
  color: #dc3545;
}

.notification-warning .notification-icon {
  color: #ffc107;
}

.notification-info .notification-icon {
  color: #17a2b8;
}

.notification-text {
  text-align: center;
  margin-bottom: 25px;
}

.notification-text p {
  color: #333;
  font-size: 18px;
  margin: 0;
  line-height: 1.5;
}

.notification-actions {
  display: flex;
  justify-content: center;
}

.notification-close {
  background-color: #2c5038;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.notification-close:hover {
  background-color: #1e3725;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(-50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.notification-btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  margin: 0 5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.notification-btn.confirm {
  background-color: #28a745;
  color: white;
}

.notification-btn.confirm:hover {
  background-color: #218838;
}

.notification-btn.cancel {
  background-color: #6c757d;
  color: white;
}

.notification-btn.cancel:hover {
  background-color: #5a6268;
}

.notification-btn.danger {
  background-color: #dc3545;
  color: white;
}

.notification-btn.danger:hover {
  background-color: #c82333;
}

.notification-btn.warning {
  background-color: #ffc107;
  color: #212529;
}

.notification-btn.warning:hover {
  background-color: #e0a800;
}

.notification-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.confirmation-details {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-info-item {
  font-size: 0.9rem;
}

.member-warning {
  margin-top: 10px;
  font-size: 0.85rem;
  color: #721c24;
  background-color: #f8d7da;
  padding: 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-warning i {
  color: #dc3545;
}

.members-search-bar {
  margin-bottom: 20px;
}

.search-container {
  position: relative;
}

.search-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.search-input {
  padding-right: 30px;
}

.no-results {
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
}

.reset-search-btn {
  background-color: #2c5038;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.reset-search-btn:hover {
  background-color: #1e3725;
}
</style>