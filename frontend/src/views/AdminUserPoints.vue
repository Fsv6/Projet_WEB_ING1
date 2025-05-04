<template>
  <AppLayout>
    <div class="points-management-container">
      <h1 class="page-title">Supervision des points utilisateurs</h1>

      <!-- Filtres -->
      <div class="filters-container">
        <div class="search-box">
          <input
              type="text"
              v-model="searchTerm"
              placeholder="Rechercher un utilisateur..."
              @input="debounceSearch"
          />
          <i class="fas fa-search search-icon"></i>
        </div>

        <div class="filter-options">
          <div class="sort-option">
            <label for="sort-by">Trier par:</label>
            <select id="sort-by" v-model="sortBy" @change="applyFilters">
              <option value="points-desc">Points (décroissant)</option>
              <option value="points-asc">Points (croissant)</option>
              <option value="nom">Nom</option>
              <option value="date">Date de dernière activité</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tableau des utilisateurs et leurs points -->
      <div class="users-table-container">
        <table class="users-table">
          <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Points</th>
            <th>Niveau</th>
            <th>Dernière activité</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="user in displayedUsers" :key="user._id">
            <td class="user-info">
              <img :src="getPhotoUrl(user.photo, user._id)" class="user-avatar" alt="Avatar">
              <div class="user-details">
                <div class="user-name">{{ user.personne?.nom }} {{ user.personne?.prenom }}</div>
                <div class="user-email">{{ user.email }}</div>
              </div>
            </td>
            <td class="points-column">
              <span class="points-badge">{{ user.points }}</span>
            </td>
            <td>{{ user.niveau }}</td>
            <td>{{ formatLastActivity(user.lastActivity) }}</td>
            <td class="actions-column">

              <button class="btn edit-points" @click="openAddPointsModal(user)">
                <i class="fas fa-plus-circle"></i> Ajuster
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
            class="page-btn"
        >
          <i class="fas fa-chevron-left"></i> Précédent
        </button>
        <span class="page-info">Page {{ currentPage }} sur {{ totalPages }}</span>
        <button
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
            class="page-btn"
        >
          Suivant <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <!-- Modal pour ajouter/retirer des points -->
      <div v-if="showPointsModal" class="modal-overlay" @click="closePointsModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Ajuster les points - {{ selectedUser.email }}</h2>
            <button class="close-button" @click="closePointsModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="points-info">
              <p>Points actuels: <strong>{{ selectedUser.points }}</strong></p>
            </div>
            <div class="points-form">
              <div class="form-group">
                <label for="points-amount">Montant des points:</label>
                <input
                    type="number"
                    id="points-amount"
                    v-model="pointsAmount"
                    step="0.5"
                    placeholder="Entrez un nombre positif ou négatif"
                />
              </div>
              <div class="form-group">
                <label for="points-reason">Raison:</label>
                <input
                    type="text"
                    id="points-reason"
                    v-model="pointsReason"
                    placeholder="Ex: Aziz a été sage !"
                />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn cancel" @click="closePointsModal">Annuler</button>
            <button
                class="btn confirm"
                @click="confirmPointsAdjustment"
                :disabled="!pointsAmount || loading"
            >
              <span v-if="loading">Traitement...</span>
              <span v-else>Confirmer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import AppLayout from '@/layout/AppLayoutGlobal.vue';
import api from '@/services/api';
import defaultAvatar from '@/assets/default-avatar.png';
import { getPhotoUrl } from '@/utils/photo';

export default {
  name: 'AdminUserPoints',
  components: {
    AppLayout
  },
  setup() {
    const users = ref([]);
    const loading = ref(false);
    const searchTerm = ref('');
    const searchTimeout = ref(null);
    const currentPage = ref(1);
    const itemsPerPage = 10;
    const sortBy = ref('points-desc');

    // Modals
    const showPointsModal = ref(false);
    const selectedUser = ref({});
    const pointsAmount = ref(null);
    const pointsReason = ref('');

    // Load all users with their points
    const loadUsers = async () => {
      try {
        loading.value = true;
        const response = await api.get('/users');
        users.value = response.data.map(user => ({
          ...user,
          lastActivity: new Date() // Dans un cas réel, il faudrait récupérer cette information
        }));
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      } finally {
        loading.value = false;
      }
    };

    // Filter and sort users
    const filteredUsers = computed(() => {
      if (!users.value) return [];

      let result = [...users.value];

      // Apply search filter
      if (searchTerm.value) {
        const search = searchTerm.value.toLowerCase();
        result = result.filter(user =>
            user.email?.toLowerCase().includes(search) ||
            user.personne?.nom?.toLowerCase().includes(search) ||
            user.personne?.prenom?.toLowerCase().includes(search) ||
            user.login?.toLowerCase().includes(search)
        );
      }

      // Apply sorting
      switch (sortBy.value) {
        case 'points-desc':
          result.sort((a, b) => b.points - a.points);
          break;
        case 'points-asc':
          result.sort((a, b) => a.points - b.points);
          break;
        case 'nom':
          result.sort((a, b) => {
            const nomA = a.personne?.nom || '';
            const nomB = b.personne?.nom || '';
            return nomA.localeCompare(nomB);
          });
          break;
        case 'date':
          result.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
          break;
      }

      return result;
    });

    // Pagination
    const totalPages = computed(() => {
      return Math.ceil(filteredUsers.value.length / itemsPerPage);
    });

    const displayedUsers = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredUsers.value.slice(start, end);
    });

    const changePage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
      }
    };

    // Search with debounce
    const debounceSearch = () => {
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
      }

      searchTimeout.value = setTimeout(() => {
        currentPage.value = 1; // Reset to first page on search
      }, 300);
    };

    const applyFilters = () => {
      currentPage.value = 1; // Reset to first page when changing filters
    };

    // Format date for display
    const formatLastActivity = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleString('fr-FR');
    };

    // Modal functions
    const openAddPointsModal = (user) => {
      selectedUser.value = user;
      pointsAmount.value = null;
      pointsReason.value = '';
      showPointsModal.value = true;
    };

    const closePointsModal = () => {
      showPointsModal.value = false;
    };

    const confirmPointsAdjustment = async () => {
      if (!pointsAmount.value) return;

      try {
        loading.value = true;

        // Call API to adjust points
        const response = await api.post(`/users/${selectedUser.value._id}/points`, {
          amount: parseFloat(pointsAmount.value),
          reason: pointsReason.value
        });

        // Update user points in the local state
        const updatedUser = users.value.find(u => u._id === selectedUser.value._id);
        if (updatedUser) {
          updatedUser.points = response.data.points;
          // Mettre à jour le niveau en fonction des points
          if (response.data.points >= 7) {
            updatedUser.niveau = 'expert';
          } else if (response.data.points >= 5) {
            updatedUser.niveau = 'avancé';
          } else if (response.data.points >= 3) {
            updatedUser.niveau = 'intermédiaire';
          } else {
            updatedUser.niveau = 'débutant';
          }
        }

        // Close modal
        closePointsModal();
      } catch (error) {
        console.error('Erreur lors de l\'ajustement des points:', error);
        alert('Une erreur est survenue lors de l\'ajustement des points.');
      } finally {
        loading.value = false;
      }
    };

    const openHistoryModal = (user) => {
      // Rediriger vers la page d'historique avec filtre sur cet utilisateur
      // Cette fonctionnalité pourrait être implémentée plus tard
      console.log('Ouvrir historique pour:', user.email);
    };

    // Reset page when filters change
    watch([searchTerm, sortBy], () => {
      if (currentPage.value !== 1) {
        currentPage.value = 1;
      }
    });

    onMounted(() => {
      loadUsers();
    });

    return {
      users,
      loading,
      searchTerm,
      currentPage,
      totalPages,
      sortBy,
      displayedUsers,
      showPointsModal,
      selectedUser,
      pointsAmount,
      pointsReason,
      defaultAvatar,
      getPhotoUrl,

      debounceSearch,
      applyFilters,
      changePage,
      formatLastActivity,
      openAddPointsModal,
      closePointsModal,
      confirmPointsAdjustment,
      openHistoryModal
    };
  }
};
</script>

<style scoped>
.points-management-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  color: #2c5038;
  margin-bottom: 30px;
  font-size: 2rem;
}

/* Filtres */
.filters-container {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.search-box input {
  width: 100%;
  padding: 10px 15px 10px 40px;
  border: 1px solid #ddd;
  border-radius: 30px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}

.search-box input:focus {
  border-color: #2c5038;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.filter-options {
  display: flex;
  gap: 10px;
}

.sort-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-option label {
  font-weight: bold;
  color: #2c5038;
}

.sort-option select {
  padding: 8px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  outline: none;
  background-color: white;
  font-size: 1rem;
}

/* Tableau des utilisateurs */
.users-table-container {
  overflow-x: auto;
  margin-bottom: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.users-table th {
  background-color: #f8f9fa;
  color: #2c5038;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: bold;
  color: #333;
}

.user-email {
  font-size: 0.85rem;
  color: #666;
}

.points-column {
  font-weight: bold;
}

.points-badge {
  display: inline-block;
  padding: 5px 10px;
  background-color: #2c5038;
  color: white;
  border-radius: 15px;
  font-size: 0.9rem;
  min-width: 50px;
  text-align: center;
}

.actions-column {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

.view-history {
  background-color: #6c757d;
  color: white;
}

.edit-points {
  background-color: #2c5038;
  color: white;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.page-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #2c5038;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.page-info {
  color: #666;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #2c5038;
  color: white;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
}

.close-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
}

.modal-body {
  padding: 20px;
}

.points-info {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.modal-footer {
  padding: 15px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background-color: #f8f9fa;
}

.btn.cancel {
  background-color: #6c757d;
  color: white;
}

.btn.confirm {
  background-color: #2c5038;
  color: white;
}

.btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .filters-container {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .actions-column {
    flex-direction: column;
  }
}
</style>