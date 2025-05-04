<template>
  <AppLayout>
    <div class="admin-users-container">
      <h1 class="page-title">Gestion des utilisateurs</h1>

      <!-- Message d'erreur pour le chargement des utilisateurs -->
      <div v-if="errorMessage" class="error-msg">
        <i class="fas fa-exclamation-triangle"></i> {{ errorMessage }}
      </div>

      <div class="actions-bar">
        <div class="search-box">
          <input
              type="text"
              v-model="searchQuery"
              placeholder="Rechercher..."
              class="search-input"
          />
        </div>
      </div>
      <div v-if="deleteMessage" :class="{'success-msg': deleteSuccess, 'error-msg': !deleteSuccess}">
        {{ deleteMessage }}
      </div>

      <!-- Indicateur de chargement -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>Chargement des utilisateurs...</p>
      </div>

      <div v-else-if="users.length === 0" class="no-users">
        <i class="fas fa-users-slash"></i>
        <p>Aucun utilisateur trouvé</p>
      </div>

      <div v-else-if="filteredUsers.length > 0" class="users-table">
        <table class="users-data-table">
          <thead>
          <tr>
            <th>Photo</th>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Famille</th>
            <th>Login</th>
            <th>Rôle/Niveau</th>
            <th>Points & Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="user in filteredUsers" :key="user._id">
            <td>
              <img
                  :src="getPhotoUrl(user.photo, user._id)"
                  :alt="user.login"
                  class="user-avatar"
                  @error="handleImageError"
              />
            </td>
            <td>{{ user.nom }}</td>
            <td>{{ user.prenom }}</td>
            <td>{{ user.famille?.codeFamille || '-' }}</td>
            <td>{{ user.login }}</td>
            <td>
              <span :class="getRoleBadgeClass(user.role)">
                {{ user.role }}
              </span>
              <span class="niveau-badge">/{{ user.niveau }}</span>
            </td>
            <td class="points-actions-cell">
              <span class="points-badge">{{ user.points || 0 }}</span>
              <button @click="adjustPoints(user)" class="points-adjust-btn" title="Ajuster les points">
                <i class="fas fa-plus-circle"></i>
              </button>
              <button @click="editUser(user)" class="action-btn edit" title="Modifier">
                <i class="fas fa-edit"></i>
                <span class="tooltip">Modifier</span>
              </button>
              <button @click="confirmDelete(user)" class="action-btn delete" title="Supprimer">
                <i class="fas fa-trash"></i>
                <span class="tooltip">Supprimer</span>
              </button>
              <button @click="showHistory(user)" class="action-btn history" title="Voir historique">
                <i class="fas fa-history"></i>
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="no-results">
        <i class="fas fa-search"></i>
        <p>Aucun résultat ne correspond à votre recherche</p>
      </div>

    </div>

    <!-- Modal pour éditer/ajouter un utilisateur -->
    <div v-if="showModal" class="modal">
      <div class="modal-content user-modal-content">
        <h2>{{ editingUser ? 'Modifier' : 'Ajouter' }} un utilisateur</h2>
        <form @submit.prevent="saveUser">
          <div class="form-row">
            <label>Nom :</label>
            <input v-model="form.nom" type="text" required />
          </div>
          <div class="form-row">
            <label>Prénom :</label>
            <input v-model="form.prenom" type="text" required />
          </div>
          <div class="form-row">
            <label>Email :</label>
            <input v-model="form.email" type="email" required :readonly="editingUser" :style="editingUser ? 'background:#f3f3f3;cursor:not-allowed;' : ''" />
          </div>
          <div class="form-row">
            <label>Login :</label>
            <input v-model="form.login" type="text" required />
          </div>
          <div class="form-row">
            <label>Rôle :</label>
            <select v-model="form.role" required>
              <option value="simple">Simple</option>
              <option value="complexe">Complexe</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="form-row">
            <label>Genre :</label>
            <select v-model="form.genre" required>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
              <option value="Autres">Autres</option>
              <option value="Non spécifié">Non spécifié</option>
            </select>
          </div>
          <div class="form-row" v-if="!editingUser">
            <label>Mot de passe :</label>
            <input v-model="form.password" type="password" required />
          </div>
          <div class="form-row">
            <label>Niveau :</label>
            <select v-model="form.niveau" required>
              <option value="débutant">Débutant</option>
              <option value="intermédiaire">Intermédiaire</option>
              <option value="avancé">Avancé</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="submit" class="save-btn">Enregistrer</button>
            <button type="button" @click="closeModal" class="cancel-btn">Annuler</button>
          </div>
        </form>
        <div v-if="formMessage" :class="{'success-msg': formSuccess, 'error-msg': !formSuccess}">{{ formMessage }}</div>
      </div>
    </div>

    <!-- Modal pour ajouter une famille -->
    <div v-if="showFamilleModal" class="modal">
      <div class="modal-content">
        <h2>Ajouter une famille</h2>
        <form @submit.prevent="saveFamille">
          <div class="form-row">
            <label>Code Famille :</label>
            <input v-model="familleForm.codeFamille" type="text" required />
          </div>
          <div class="form-row">
            <label>Nom de la famille :</label>
            <input v-model="familleForm.nom" type="text" required placeholder="Ex: Famille Dupont" />
          </div>
          <div class="form-row">
            <label>Description :</label>
            <textarea v-model="familleForm.description" placeholder="Description de la famille (optionnelle)"></textarea>
          </div>
          <div class="modal-actions">
            <button type="submit" class="save-btn">Enregistrer</button>
            <button type="button" @click="closeFamilleModal" class="cancel-btn">Annuler</button>
          </div>
        </form>
      </div>
    </div>

    <UserHistoryModal
        :show="showHistoryModal"
        :user="selectedUser"
        @close="closeHistoryModal"
    />

    <!-- Modal pour l'historique des points -->
    <div v-if="showPointsHistoryModal" class="modal">
      <div class="modal-content points-history-modal">
        <div class="modal-header">
          <h2>Historique des points - {{ selectedUser?.login }}</h2>
          <button class="close-btn" @click="closePointsHistoryModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="user-points-summary">
            <p class="total-points">
              Points actuels: <span class="points-value">{{ selectedUser?.points || 0 }}</span>
            </p>
          </div>

          <div class="points-history-list">
            <div v-if="pointsHistory.length === 0" class="no-history">
              Aucun historique de points disponible
            </div>
            <div v-else class="points-history-table">
              <table>
                <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Montant</th>
                  <th>Avant</th>
                  <th>Après</th>
                  <th>Raison</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(entry, index) in pointsHistory" :key="index">
                  <td>{{ formatDate(entry.date) }}</td>
                  <td>{{ formatAction(entry.action) }}</td>
                  <td :class="getPointsClass(entry.details.montant)">
                    {{ formatPointsChange(entry.details.montant) }}
                  </td>
                  <td>{{ entry.details.pointsAvant }}</td>
                  <td>{{ entry.details.pointsApres }}</td>
                  <td>{{ entry.details.raison }}</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour ajuster les points -->
    <div v-if="showPointsAdjustModal" class="modal">
      <div class="modal-content points-adjust-modal">
        <div class="modal-header">
          <h2>Ajuster les points - {{ selectedUser?.login }} <button class="close-btn" @click="closePointsAdjustModal">×</button></h2>
        </div>
        <div class="modal-body">
          <div class="points-info">
            <p>Points actuels: <strong>{{ selectedUser?.points || 0 }}</strong></p>
            <p>Niveau actuel: <strong>{{ selectedUser?.niveau }}</strong></p>
            <p>Rôle actuel: <strong>{{ selectedUser?.role }}</strong></p>
          </div>
          <form @submit.prevent="savePointsAdjustment">
            <div class="form-row">
              <label>Montant des points:</label>
              <input
                type="number"
                v-model="pointsForm.amount"
                step="0.5"
                placeholder="Entrez un nombre positif ou négatif"
                required
              />
            </div>
            <div class="form-row">
              <label>Raison:</label>
              <input
                type="text"
                v-model="pointsForm.reason"
                :placeholder="selectedUser?.prenom ? `${selectedUser.prenom} a été sage aujourd'hui !` : 'Ajustement de points'"
              />
            </div>
            <div class="modal-actions">
              <button type="submit" class="save-btn" :disabled="loading">
                <span v-if="loading">Traitement...</span>
                <span v-else>Confirmer</span>
              </button>
              <button type="button" @click="closePointsAdjustModal" class="cancel-btn">Annuler</button>
            </div>
          </form>
          <div v-if="pointsErrorMessage" class="error-msg">{{ pointsErrorMessage }}</div>
        </div>
      </div>
    </div>

    <!-- Modal de notification pour changement de niveau/rôle -->
    <div v-if="showLevelChangeModal" class="modal">
      <div class="modal-content level-change-modal">
        <div class="modal-header">
          <h2>Évolution de l'utilisateur</h2>
          <button class="close-btn" @click="closeLevelChangeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="level-change-content">
            <div class="user-info-header">
              <span class="user-login">{{ selectedUser?.login }}</span>
            </div>

            <div v-if="levelChangeData.niveauChanged" class="change-item">
              <div class="change-label">Changement de niveau</div>
              <div class="change-details">
                <div class="before-change">
                  <span class="label">Avant:</span>
                  <span class="value">{{ levelChangeData.niveauAvant }}</span>
                </div>
                <div class="after-change">
                  <span class="label">Après:</span>
                  <span class="value highlight">{{ levelChangeData.niveauApres }}</span>
                </div>
              </div>
            </div>

            <div v-if="levelChangeData.roleChanged" class="change-item">
              <div class="change-label">Changement de rôle</div>
              <div class="change-details">
                <div class="before-change">
                  <span class="label">Avant:</span>
                  <span class="value">{{ levelChangeData.roleAvant }}</span>
                </div>
                <div class="after-change">
                  <span class="label">Après:</span>
                  <span class="value highlight">{{ levelChangeData.roleApres }}</span>
                </div>
              </div>
            </div>

            <div class="points-summary">
              <div class="points-label">Points actuels:</div>
              <div class="points-value">{{ selectedUser?.points }}</div>
            </div>

            <div class="congratulations-message">
              <p v-if="levelChangeData.niveauChanged || levelChangeData.roleChanged">
                <template v-if="isLevelUpgrade(levelChangeData.niveauAvant, levelChangeData.niveauApres) || isRoleUpgrade(levelChangeData.roleAvant, levelChangeData.roleApres)">
                  🎉 Félicitations ! L'utilisateur a progressé !
                </template>
                <template v-else>
                  ⚠️ Attention ! L'utilisateur a régressé suite à la perte de points.
                </template>
              </p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn primary" @click="closeLevelChangeModal">Fermer</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import AppLayout from '@/layout/AppLayoutGlobal.vue';
import api from '@/services/api';
import defaultAvatar from '@/assets/default-avatar.png';
import { getPhotoUrl } from '@/utils/photo';
import UserHistoryModal from '@/components/UserHistoryModal.vue';

export default {
  name: 'AdminUsers',
  components: {
    AppLayout,
    UserHistoryModal
  },
  setup() {
    const users = ref([]);
    const familles = ref([]);
    const searchQuery = ref('');
    const showModal = ref(false);
    const showFamilleModal = ref(false);
    const editingUser = ref(null);
    const form = ref({
      nom: '',
      prenom: '',
      email: '',
      genre: 'Homme',
      login: '',
      password: '',
      role: 'simple',
      niveau: 'débutant'
    });
    const familleForm = ref({
      codeFamille: '',
      nom: '',
      description: ''
    });
    const formMessage = ref('');
    const formSuccess = ref(false);
    const showHistoryModal = ref(false);
    const selectedUser = ref(null);
    const loading = ref(false);
    const isLoading = ref(false);
    const errorMessage = ref('');

    // Nouvelles variables pour la gestion des points
    const showPointsHistoryModal = ref(false);
    const showPointsAdjustModal = ref(false);
    const pointsHistory = ref([]);
    const pointsForm = ref({
      amount: null,
      reason: ''
    });

    // Ajout des variables pour gérer le changement de niveau
    const showLevelChangeModal = ref(false);
    const levelChangeData = ref({
      niveauChanged: false,
      roleChanged: false,
      niveauAvant: '',
      niveauApres: '',
      roleAvant: '',
      roleApres: ''
    });

    const pointsErrorMessage = ref('');

    const loadFamilles = async () => {
      try {
        const response = await api.get('/familles');
        familles.value = response.data;
      } catch (error) {
        console.error('Erreur lors du chargement des familles:', error);
      }
    };

    const loadUsers = async () => {
      try {
        isLoading.value = true;
        errorMessage.value = '';
        
        const response = await api.get('/users');
        console.log('Données brutes des utilisateurs:', response.data);
        
        // Fonction pour analyser la structure d'un utilisateur
        const analyzeUserStructure = (user) => {
          const hasPersonne = !!user.personne;
          const hasDirectProps = !!(user.nom || user.prenom);
          const personneStructure = hasPersonne ? Object.keys(user.personne).join(', ') : 'absent';
          
          console.log(`Utilisateur ${user._id || 'sans ID'}: ` +
            `Objet personne: ${hasPersonne ? 'présent' : 'absent'}, ` +
            `Props directes: ${hasDirectProps ? 'présentes' : 'absentes'}, ` +
            `Structure personne: ${personneStructure}, ` +
            `Rôle: ${user.role || 'non défini'}`);
        };
        
        // Analyser la structure de chaque utilisateur
        if (response.data && response.data.length > 0) {
          console.log('--- Analyse de la structure des utilisateurs ---');
          response.data.forEach(analyzeUserStructure);
          console.log('-----------------------------------------------');
        }
        
        users.value = response.data.map(user => {
          // Vérification détaillée des données
          console.log('Structure utilisateur:', user);
          
          return {
            _id: user._id,
            nom: user.personne?.nom || user.nom || 'Non défini',
            prenom: user.personne?.prenom || user.prenom || 'Non défini',
            login: user.login || 'Non défini',
            role: user.role || 'simple',
            niveau: user.niveau || 'débutant',
            photo: user.photo || null,
            points: user.points || 0,
            genre: user.personne?.genre || user.genre || 'Non spécifié',
            famille: user.famille
          };
        });
        console.log('Utilisateurs chargés et transformés:', users.value);
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        errorMessage.value = "Erreur lors du chargement des utilisateurs. Veuillez rafraîchir la page.";
      } finally {
        isLoading.value = false;
      }
    };

    const filteredUsers = computed(() => {
      if (!searchQuery.value) return users.value;
      const query = searchQuery.value.toLowerCase();
      return users.value.filter(user =>
          user.login?.toLowerCase().includes(query) ||
          user.nom?.toLowerCase().includes(query) ||
          user.prenom?.toLowerCase().includes(query) ||
          user.famille?.codeFamille?.toLowerCase().includes(query)
      );
    });

    const handleImageError = (event) => {
      event.target.src = defaultAvatar;
    };

    const getRoleBadgeClass = (role) => {
      return `role-badge role-${role}`;
    };

    const editUser = (user) => {
      editingUser.value = user;
      form.value = {
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        genre: (user.genre === 'Homme' || user.genre === 'Femme' || user.genre === 'Autres') ? user.genre : 'Homme',
        login: user.login,
        role: user.role,
        niveau: user.niveau,
        password: ''
      };
      formMessage.value = '';
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
      editingUser.value = null;
    };

    const closeFamilleModal = () => {
      showFamilleModal.value = false;
    };

    const saveFamille = async () => {
      try {
        await api.post('/familles', familleForm.value);
        await loadFamilles();
        closeFamilleModal();
      } catch (error) {
        console.error('Erreur lors de la création de la famille:', error);
      }
    };

    const deleteMessage = ref('');
    const deleteSuccess = ref(false);

    const confirmDelete = async (user) => {
      if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.login} ?`)) {
        try {
          await api.delete(`/users/${user._id}`);
          deleteMessage.value = 'Utilisateur supprimé avec succès !';
          deleteSuccess.value = true;
          await loadUsers();
          setTimeout(() => {
            deleteMessage.value = '';
          }, 2000);
        } catch (error) {
          deleteMessage.value = error.response?.data?.message || "Erreur lors de la suppression de l'utilisateur.";
          deleteSuccess.value = false;
        }
      }
    };

    const saveUser = async () => {
      try {
        formMessage.value = '';
        if (!form.value.password && !editingUser.value) {
          formMessage.value = 'Le mot de passe est requis pour un nouvel utilisateur';
          formSuccess.value = false;
          return;
        }
        const userData = {
          email: form.value.email.trim(),
          nom: form.value.nom.trim(),
          prenom: form.value.prenom.trim(),
          login: form.value.login.trim(),
          role: form.value.role,
          niveau: form.value.niveau,
          personne: {
            nom: form.value.nom.trim(),
            prenom: form.value.prenom.trim(),
            genre: form.value.genre
          }
        };
        if (!editingUser.value) {
          userData.password = form.value.password;
        }
        let response;
        if (editingUser.value) {
          const updateData = {
            nom: form.value.nom.trim(),
            prenom: form.value.prenom.trim(),
            role: form.value.role,
            genre: form.value.genre
          };
          response = await api.put(`/users/${editingUser.value._id}`, updateData);
        } else {
          response = await api.post('/users', userData);
        }
        if (response.data) {
          formMessage.value = editingUser.value ?
              'Utilisateur modifié avec succès !' :
              'Utilisateur ajouté avec succès !';
          formSuccess.value = true;
          await loadUsers();
          setTimeout(() => closeModal(), 1500);
        }
      } catch (err) {
        let errorMessage = editingUser.value ?
            'Erreur lors de la modification de l\'utilisateur' :
            'Erreur lors de la création de l\'utilisateur';
        if (err.response?.status === 404) {
          errorMessage = 'Erreur de connexion au serveur. Vérifiez que le serveur backend est démarré.';
        } else if (err.response?.status === 403) {
          errorMessage = 'Vous n\'avez pas les droits nécessaires.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        formMessage.value = errorMessage;
        formSuccess.value = false;
      }
    };

    const showHistory = (user) => {
      selectedUser.value = user;
      showHistoryModal.value = true;
    };

    const closeHistoryModal = () => {
      showHistoryModal.value = false;
    };

    // Nouvelle fonction pour afficher l'historique des points
    const fetchPointsHistory = async (userId) => {
      try {
        loading.value = true;
        const response = await api.get(`/history?search=${userId}`);
        // Filtrer pour ne garder que les actions liées aux points
        pointsHistory.value = response.data.histories.filter(
            entry => entry.action === 'ajout_points' &&
                entry.details.userId === userId
        );
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique des points:', error);
      } finally {
        loading.value = false;
      }
    };

    // Fonctions pour gérer l'affichage de l'historique des points
    const viewPointsHistory = async (user) => {
      selectedUser.value = user;
      await fetchPointsHistory(user._id);
      showPointsHistoryModal.value = true;
    };

    const closePointsHistoryModal = () => {
      showPointsHistoryModal.value = false;
      pointsHistory.value = [];
    };

    // Fonctions pour gérer l'ajustement des points
    const adjustPoints = (user) => {
      selectedUser.value = user;
      pointsForm.value = {
        amount: null,
        reason: ''
      };
      showPointsAdjustModal.value = true;
    };

    const closePointsAdjustModal = () => {
      showPointsAdjustModal.value = false;
    };

    const savePointsAdjustment = async () => {
      if (!pointsForm.value.amount) return;
      try {
        loading.value = true;
        pointsErrorMessage.value = '';
        const response = await api.post(`/users/${selectedUser.value._id}/points`, {
          amount: parseFloat(pointsForm.value.amount),
          reason: pointsForm.value.reason
        });
        // Mettre à jour les points de l'utilisateur dans la liste
        const userIndex = users.value.findIndex(u => u._id === selectedUser.value._id);
        if (userIndex !== -1) {
          const oldNiveau = users.value[userIndex].niveau;
          const oldRole = users.value[userIndex].role;

          // Mettre à jour les points
          users.value[userIndex].points = response.data.points;
          selectedUser.value.points = response.data.points;

          // Vérifier s'il y a eu changement de niveau ou de rôle
          if (response.data.niveauChanged || response.data.roleChanged) {
            // Mettre à jour le niveau et le rôle
            users.value[userIndex].niveau = response.data.niveau;
            users.value[userIndex].role = response.data.role;
            selectedUser.value.niveau = response.data.niveau;
            selectedUser.value.role = response.data.role;

            // Préparer les données pour le modal de notification
            levelChangeData.value = {
              niveauChanged: response.data.niveauChanged,
              roleChanged: response.data.roleChanged,
              niveauAvant: oldNiveau,
              niveauApres: response.data.niveau,
              roleAvant: oldRole,
              roleApres: response.data.role
            };

            // Fermer le modal d'ajustement et afficher celui de notification
            showPointsAdjustModal.value = false;
            showLevelChangeModal.value = true;
          } else {
            // Rafraîchir l'historique des points et afficher
            await fetchPointsHistory(selectedUser.value._id);
            showPointsAdjustModal.value = false;
            showPointsHistoryModal.value = true;
          }
        }
        // Ajout : recharger la liste des utilisateurs après ajustement des points
        await loadUsers();
      } catch (error) {
        console.error('Erreur lors de l\'ajustement des points:', error);
        pointsErrorMessage.value = error.response?.data?.message || "Erreur lors de l'ajustement des points.";
      } finally {
        loading.value = false;
      }
    };

    // Fonctions d'aide pour l'affichage
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString('fr-FR');
    };

    const formatAction = (action) => {
      const actions = {
        'ajout_points': 'Ajustement de points',
        'upgrade_niveau': 'Changement de niveau'
      };
      return actions[action] || action;
    };

    const formatPointsChange = (amount) => {
      if (amount > 0) return `+${amount}`;
      return amount;
    };

    const getPointsClass = (amount) => {
      if (amount > 0) return 'points-positive';
      if (amount < 0) return 'points-negative';
      return '';
    };

    // Fonction pour déterminer si un changement de niveau est une progression ou une régression
    const isLevelUpgrade = (before, after) => {
      const niveauxOrder = {
        'débutant': 1,
        'intermédiaire': 2,
        'avancé': 3,
        'expert': 4
      };
      return niveauxOrder[after] > niveauxOrder[before];
    };

    // Fonction pour déterminer si un changement de rôle est une progression ou une régression
    const isRoleUpgrade = (before, after) => {
      const rolesOrder = {
        'visiteur': 1,
        'simple': 2,
        'complexe': 3,
        'admin': 4
      };
      return rolesOrder[after] > rolesOrder[before];
    };

    // Fonction pour fermer le modal de changement de niveau
    const closeLevelChangeModal = () => {
      showLevelChangeModal.value = false;
    };

    onMounted(() => {
      loadUsers();
      loadFamilles();
    });

    return {
      users,
      familles,
      searchQuery,
      filteredUsers,
      showModal,
      showFamilleModal,
      editingUser,
      defaultAvatar,
      getPhotoUrl,
      handleImageError,
      editUser,
      closeModal,
      closeFamilleModal,
      confirmDelete,
      saveUser,
      saveFamille,
      getRoleBadgeClass,
      form,
      familleForm,
      formMessage,
      formSuccess,
      showHistoryModal,
      selectedUser,
      showHistory,
      closeHistoryModal,

      // Nouvelles variables pour les points
      showPointsHistoryModal,
      showPointsAdjustModal,
      pointsHistory,
      pointsForm,
      loading,

      // Nouvelles variables pour le changement de niveau
      showLevelChangeModal,
      levelChangeData,
      closeLevelChangeModal,

      // Nouvelles fonctions pour la comparaison
      isLevelUpgrade,
      isRoleUpgrade,

      // Fonctions pour les points
      viewPointsHistory,
      closePointsHistoryModal,
      adjustPoints,
      closePointsAdjustModal,
      savePointsAdjustment,
      formatDate,
      formatAction,
      formatPointsChange,
      getPointsClass,

      // Nouvelles variables pour le chargement
      isLoading,
      errorMessage,
      pointsErrorMessage
    };
  }
};
</script>

<style scoped>
.admin-users-container {
  padding: 15px;
}

.page-title {
  color: #2c5038;
  margin-bottom: 20px;
  font-size: 1.8rem;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.search-input {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 250px;
}

.add-user-btn {
  background-color: #2c5038;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.users-table {
  width: 100%;
  overflow-x: auto;
  margin-top: 20px;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th, .users-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.users-table th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #2c5038;
  position: sticky;
  top: 0;
  z-index: 10;
}

.users-table tbody tr:hover {
  background-color: #f1f5f9;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #4a7c59;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Ajustement des largeurs de colonnes */
.users-table th:nth-child(1), .users-table td:nth-child(1) { width: 60px; }  /* Photo */
.users-table th:nth-child(2), .users-table td:nth-child(2) { width: 12%; }   /* Nom */
.users-table th:nth-child(3), .users-table td:nth-child(3) { width: 12%; }   /* Prénom */
.users-table th:nth-child(4), .users-table td:nth-child(4) { width: 10%; }   /* Famille */
.users-table th:nth-child(5), .users-table td:nth-child(5) { width: 12%; }   /* Login */
.users-table th:nth-child(6), .users-table td:nth-child(6) { width: 8%; }    /* Rôle */
.users-table th:nth-child(7), .users-table td:nth-child(7) { width: 12%; }   /* Niveau */
.users-table th:nth-child(8), .users-table td:nth-child(8) { width: 8%; }    /* Points */
.users-table th:nth-child(9), .users-table td:nth-child(9) { width: 16%; }   /* Actions */

/* Style des badges de rôle */
.role-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
  display: inline-block;
}

.role-admin {
  background-color: #fee2e2;
  color: #b91c1c;
}

.role-simple {
  background-color: #e0f2fe;
  color: #0369a1;
}

.role-complexe {
  background-color: #dcfce7;
  color: #166534;
}

.role-visiteur {
  background-color: #fef3c7;
  color: #92400e;
}

/* Messages de succès et d'erreur */
.success-msg, .error-msg {
  padding: 10px 15px;
  margin: 10px 0;
  border-radius: 5px;
  font-weight: 500;
}

.success-msg {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.error-msg {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

/* Colonne d'actions */
.actions-cell {
  display: flex;
  flex-wrap: nowrap;          
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  min-width: 120px;        
  padding: 4px;
}


.users-data-table th:last-child,
.users-data-table td.actions-cell {
  width: 140px;
  max-width: 160px;
  white-space: nowrap;
  text-align: left;
}


th.actions-header, td.actions-cell {
  white-space: nowrap;
  width: 1%;              /* permet au tableau d'ajuster au contenu */
}


.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn i {
  font-size: 0.9rem;
}

.action-btn.edit {
  background-color: #2c5038;
  color: white;
}

.action-btn.delete {
  background-color: #dc3545;
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.action-btn.edit:hover {
  background-color: #1e3725;
}

.action-btn.delete:hover {
  background-color: #c82333;
}

.action-btn .tooltip {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  white-space: nowrap;
  z-index: 1000;
}

.action-btn:hover .tooltip {
  opacity: 1;
  visibility: visible;
  bottom: -35px;
}

/* Ajout d'une petite flèche au tooltip */
.action-btn .tooltip::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 4px 4px 4px;
  border-style: solid;
  border-color: transparent transparent #333 transparent;
}

/* Style pour la colonne Actions dans le header */
th:last-child {
  text-align: center !important;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.user-modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 420px;
  width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  position: relative;
}

@media (max-width: 600px) {
  .user-modal-content {
    max-width: 99vw;
    padding: 10px;
  }
}

.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #9e9e9e;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}
.form-row label {
  font-weight: 500;
  margin-bottom: 4px;
  color: #2c5038;
}
.form-row input, .form-row select {
  padding: 7px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}
.avatar-homme {
  border: 3px solid #007bff; /* Bleu */
  padding: 2px;
}

.avatar-femme {
  border: 3px solid #ff9800; /* Orange */
  padding: 2px;
}

.avatar-neutre {
  border: 3px solid #ccc; /* Gris */
  padding: 2px;
}

.btn-history {
  background-color: #2c5038;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.3s;
  font-size: 0.85rem;
}

.btn-history:hover {
  background-color: #1a3022;
}

.btn-history i {
  font-size: 0.85rem;
}

.actions {
  display: flex;
  gap: 10px;
}

.add-famille-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 5px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.add-famille-btn i {
  font-size: 0.9rem;
}

.add-famille-btn:hover {
  background-color: #45a049;
}

.points-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.points-badge {
  background-color: #2c5038;
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.9rem;
  min-width: 30px;
  text-align: center;
}

.points-adjust-btn {
  background: none;
  border: none;
  color: #2c5038;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 2px;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.points-adjust-btn:hover {
  opacity: 1;
}

.points-history-modal {
  max-width: 800px;
  width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #2c5038;
  color: white;
  border-radius: 8px 8px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}

.user-points-summary {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.total-points {
  font-size: 1.1rem;
  margin: 0;
}

.points-value {
  font-weight: bold;
  color: #2c5038;
}

.points-history-table {
  width: 100%;
  overflow-x: auto;
}

.points-history-table table {
  width: 100%;
  border-collapse: collapse;
}

.points-history-table th,
.points-history-table td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  text-align: left;
}

.points-history-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #333;
}

.points-positive {
  color: green;
  font-weight: bold;
}

.points-negative {
  color: red;
  font-weight: bold;
}

.no-history {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.level-change-modal {
  max-width: 400px;
  width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #2c5038;
  color: white;
  border-radius: 8px 8px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}

.level-change-content {
  padding: 20px;
}

.user-info-header {
  margin-bottom: 20px;
}

.user-login {
  font-size: 1.2rem;
  font-weight: bold;
}

.change-item {
  margin-bottom: 10px;
}

.change-label {
  font-weight: bold;
}

.change-details {
  margin-top: 5px;
}

.before-change {
  margin-right: 10px;
}

.after-change {
  font-weight: bold;
}

.highlight {
  font-weight: bold;
  color: #2c5038;
}

.points-summary {
  margin-top: 20px;
  margin-bottom: 10px;
}

.points-label {
  font-weight: bold;
}

.congratulations-message {
  text-align: center;
  margin-top: 10px;
}

.modal-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.btn {
  background-color: #2c5038;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn:hover {
  background-color: #1a3022;
}

.primary {
  background-color: #4CAF50;
}

.primary:hover {
  background-color: #45a049;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #4a7c59;
}

.loading-spinner {
  font-size: 2rem;
  margin-bottom: 15px;
}

.no-users {
  text-align: center;
  padding: 30px;
  background-color: #f8fafc;
  border-radius: 8px;
  color: #64748b;
}

.no-users i {
  font-size: 2.5rem;
  margin-bottom: 15px;
  opacity: 0.6;
}

.no-results {
  text-align: center;
  padding: 30px;
  background-color: #f8fafc;
  border-radius: 8px;
  color: #64748b;
}

.no-results i {
  font-size: 2.5rem;
  margin-bottom: 15px;
  opacity: 0.6;
}

.niveau-badge {
  font-size: 0.85em;
  color: #64748b;
  margin-left: 4px;
  font-weight: 500;
}

.action-btn.history {
  background-color: #e0e7ef;
  color: #2c5038;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.action-btn.history:hover {
  background-color: #cbd5e1;
}

.points-actions-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  min-width: 180px;
  max-width: 260px;
  padding: 4px;
}

.points-adjust-modal {
  background: white;
  padding: 0;
  border-radius: 10px;
  max-width: 350px;
  width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  position: relative;
  display: flex;
  flex-direction: column;
}
.points-adjust-modal .modal-header {
  background: #23613d;
  color: #fff;
  padding: 18px 20px 10px 20px;
  border-radius: 10px 10px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.points-adjust-modal .modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
  flex: 1;
}
.points-adjust-modal .close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.3rem;
  cursor: pointer;
  margin-left: 10px;
}
.points-adjust-modal .modal-body {
  padding: 18px 20px 20px 20px;
}
.points-adjust-modal .points-info {
  background: #f8f9fa;
  padding: 10px 12px;
  border-radius: 7px;
  margin-bottom: 18px;
  font-size: 0.98rem;
}
.points-adjust-modal .form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}
.points-adjust-modal .form-row label {
  font-weight: 500;
  margin-bottom: 4px;
  color: #23613d;
}
.points-adjust-modal .form-row input {
  padding: 7px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}
.points-adjust-modal .modal-actions {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.points-adjust-modal .save-btn {
  background-color: #4CAF50;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.points-adjust-modal .cancel-btn {
  background-color: #9e9e9e;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.points-adjust-modal .error-msg {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  padding: 10px 15px;
  border-radius: 5px;
  margin-top: 12px;
  font-weight: 500;
  text-align: center;
}
@media (max-width: 600px) {
  .points-adjust-modal {
    max-width: 99vw;
    padding: 0;
  }
  .points-adjust-modal .modal-header,
  .points-adjust-modal .modal-body {
    padding: 10px;
  }
}
</style>