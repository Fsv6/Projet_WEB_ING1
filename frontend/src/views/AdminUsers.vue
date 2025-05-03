<template>
  <AppLayout>
    <div class="admin-users-container">
      <h1 class="page-title">Gestion des utilisateurs</h1>

      <div class="actions-bar">
        <div class="search-box">
          <input
              type="text"
              v-model="searchQuery"
              placeholder="Rechercher..."
              class="search-input"
          />
        </div>
        <button @click="openAddUserModal" class="add-user-btn">
          Ajouter un utilisateur
        </button>
      </div>
      <div v-if="deleteMessage" :class="{'success-msg': deleteSuccess, 'error-msg': !deleteSuccess}">
        {{ deleteMessage }}
      </div>

      <div class="users-table">
        <table>
          <thead>
          <tr>
            <th>Photo</th>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Famille</th>
            <th>Login</th>
            <th>Rôle</th>
            <th>Niveau</th>
            <th>Points</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="user in filteredUsers" :key="user._id">
            <td>
              <img
                  :src="user.photo || defaultAvatar"
                  :alt="user.login"
                  class="user-avatar"
                  :class="user-avatar"
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
            </td>
            <td>{{ user.niveau }}</td>
            <td class="points-cell">
              <span class="points-badge">{{ user.points || 0 }}</span>
              <button @click="adjustPoints(user)" class="points-adjust-btn" title="Ajuster les points">
                <i class="fas fa-plus-circle"></i>
              </button>
            </td>
            <td class="actions-cell">
              <button @click="editUser(user)" class="action-btn edit" title="Modifier">
                <i class="fas fa-edit"></i>
                <span class="tooltip">Modifier</span>
              </button>
              <button @click="confirmDelete(user)" class="action-btn delete" title="Supprimer">
                <i class="fas fa-trash"></i>
                <span class="tooltip">Supprimer</span>
              </button>
              <button @click="showHistory(user)" class="btn btn-history">
                <i class="fas fa-history"></i> Voir historique
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal pour éditer/ajouter un utilisateur -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
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
            <label>Genre :</label>
            <select v-model="form.genre" required>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
              <option value="Non spécifié">Non spécifié</option>
            </select>
          </div>
          <div class="form-row">
            <label>Famille :</label>
            <select v-model="form.codeFamille" required>
              <option value="">Sélectionner une famille</option>
              <option v-for="famille in familles" :key="famille._id" :value="famille.codeFamille">
                {{ famille.codeFamille }}
              </option>
            </select>
            <button type="button" @click="openAddFamilleModal" class="add-famille-btn">
              <i class="fas fa-plus"></i> Nouvelle famille
            </button>
          </div>
          <div class="form-row">
            <label>Login :</label>
            <input v-model="form.login" type="text" required />
          </div>
          <div class="form-row">
            <label>Rôle :</label>
            <select v-model="form.role" required>
              <option value="simple">Simple</option>
              <option value="admin">Admin</option>
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
      <div class="modal-content">
        <div class="modal-header">
          <h2>Ajuster les points - {{ selectedUser?.login }}</h2>
          <button class="close-btn" @click="closePointsAdjustModal">
            <i class="fas fa-times"></i>
          </button>
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
                  placeholder="Ex: Participation à un événement"
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
      genre: 'Non spécifié',
      codeFamille: '',
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
        const response = await api.get('/users');
        users.value = response.data.map(user => ({
          _id: user._id,
          nom: user.personne?.nom || '-',
          prenom: user.personne?.prenom || '-',
          login: user.login || '-',
          role: user.role || 'simple',
          niveau: user.niveau || 'débutant',
          photo: user.photo || null,
          points: user.points || 0,
          genre: user.personne?.genre || 'Non spécifié',
          famille: user.famille
        }));
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
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

    const editUser = (user) => {
      editingUser.value = user;
      form.value = {
        nom: user.nom,
        prenom: user.prenom,
        codeFamille: user.famille?.codeFamille || '',
        login: user.login,
        role: user.role,
        niveau: user.niveau,
        genre: user.genre || 'Non spécifié',
        password: ''
      };
      formMessage.value = '';
      showModal.value = true;
    };

    const openAddUserModal = () => {
      editingUser.value = null;
      showModal.value = true;
      form.value = {
        nom: '',
        prenom: '',
        genre: 'Non spécifié',
        codeFamille: '',
        login: '',
        password: '',
        role: 'simple',
        niveau: 'débutant'
      };
      formMessage.value = '';
    };

    const openAddFamilleModal = () => {
      showFamilleModal.value = true;
      familleForm.value = {
        codeFamille: '',
        nom: '',
        description: ''
      };
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

    const closeModal = () => {
      showModal.value = false;
      editingUser.value = null;
    };

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
          nom: form.value.nom.trim(),
          prenom: form.value.prenom.trim(),
          codeFamille: form.value.codeFamille,
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
          response = await api.put(`/users/${editingUser.value._id}`, userData);
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

    const getRoleBadgeClass = (role) => {
      switch (role.toLowerCase()) {
        case 'admin':
          return 'role-badge admin';
        case 'simple':
          return 'role-badge simple';
        case 'complexe':
          return 'role-badge complexe';
        case 'visiteur':
          return 'role-badge visiteur';
        default:
          return 'role-badge';
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

      } catch (error) {
        console.error('Erreur lors de l\'ajustement des points:', error);
        alert('Une erreur est survenue lors de l\'ajustement des points.');
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
      handleImageError,
      editUser,
      openAddUserModal,
      openAddFamilleModal,
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
      getPointsClass
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
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}

th {
  background-color: #f8f9fa;
  color: #2c5038;
  font-weight: 600;
  font-size: 0.9rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.role-badge {
  padding: 3px 6px;
  border-radius: 12px;
  font-size: 0.8em;
}

.role-badge.admin {
  background-color: #2c5038;
  color: white;
}

.role-badge.simple {
  background-color: #4CAF50;
  color: white;
}

.role-badge.complexe {
  background-color: #FF9800;
  color: white;
}

.role-badge.visiteur {
  background-color: #9E9E9E;
  color: white;
}

.actions-cell {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
  padding: 4px !important;
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
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 400px;
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
.success-msg {
  color: #2c5038;
  margin-top: 10px;
  font-weight: bold;
}
.error-msg {
  color: #dc3545;
  margin-top: 10px;
  font-weight: bold;
}
.form-row label[for="role"] {
  color: #dc3545;
  font-weight: bold;
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
</style>