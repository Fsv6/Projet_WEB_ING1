<template>
  <AppLayout>
    <div class="history-container">
      <h1 class="page-title">Historique des actions</h1>

      <!-- Message d'erreur -->
      <div v-if="errorMessage" class="error-message">
        <i class="fas fa-exclamation-triangle"></i> {{ errorMessage }}
      </div>

      <!-- Filtres et recherche -->
      <div class="filters-container">
        <div class="search-box">
          <input
              type="text"
              v-model="searchTerm"
              placeholder="Rechercher..."
              @input="debounceSearch"
          />
          <i class="fas fa-search search-icon"></i>
        </div>

        <div class="category-filter">
          <select v-model="selectedCategory" @change="debounceSearch()">
            <option value="">Toutes les catégories</option>
            <option v-for="cat in actionCategories" :key="cat" :value="cat">
              {{ formatAction(cat) }}
            </option>
          </select>
        </div>
      </div>

      <!-- Indication du filtre actif -->
      <div v-if="selectedCategory" class="active-filter-indicator">
        <i class="fas fa-filter"></i> Filtre actif: <strong>{{ formatAction(selectedCategory) }}</strong>
        <button class="clear-filter-btn" @click="clearFilter">
          <i class="fas fa-times"></i> Effacer
        </button>
      </div>

      <!-- Affichage du message si aucun résultat -->
      <div v-if="logs.length === 0 && !loading" class="no-results">
        <p>Aucun résultat ne correspond à votre recherche</p>
      </div>

      <!-- Message si aucun résultat après filtrage -->
      <div v-else-if="groupedByUser.length === 0 && !loading" class="no-results">
        <p>
          <i class="fas fa-exclamation-circle"></i>
          Aucune action de type <strong>{{ formatAction(selectedCategory) }}</strong> n'a été trouvée
        </p>
        <button class="reset-filter-btn" @click="clearFilter">
          Réinitialiser le filtre
        </button>
      </div>

      <!-- Liste des utilisateurs -->
      <div class="users-container">
        <transition-group name="user-list" tag="div" class="users-wrapper">
          <div v-for="userHistory in displayedUsers" :key="userHistory.user.email" class="user-card">
            <div class="user-header" @click="toggleUser(userHistory.user.email)">
              <div class="user-info">
                <img :src="getPhotoUrl(userHistory.user.photo, userHistory.user._id)" class="user-avatar" alt="Avatar">
                <div class="user-details">
                  <h3>{{ userHistory.user.email }}</h3>
                  <span class="action-count">
                    {{ getActionsToday(userHistory.user.email) }} action(s) aujourd'hui
                  </span>
                </div>
              </div>
              <div class="expand-button" :class="{ 'expanded': expandedUsers.includes(userHistory.user.email) }">
                <i class="fas fa-chevron-down"></i>
              </div>
            </div>

            <!-- Catégories d'actions de l'utilisateur -->
            <div v-if="expandedUsers.includes(userHistory.user.email)" class="categories-container">
              <transition-group name="category-list" tag="div" class="categories-wrapper">
                <div v-for="(actions, category) in userHistory.categories" :key="category" class="category-section">
                  <div class="category-header" @click="toggleCategory(userHistory.user.email, category)">
                    <div class="category-info">
                      <span :class="['category-icon', getActionClass(category)]">
                        <i :class="getCategoryIcon(category)"></i>
                      </span>
                      <div class="category-details">
                        <h4>{{ formatAction(category) }}</h4>
                        <span class="category-count">{{ actions.length }} action(s)</span>
                      </div>
                    </div>
                    <div class="category-meta">
                      <span class="last-update-date">Dernière action: {{ formatDate(actions[0].date) }}</span>
                      <div class="expand-button" :class="{ 'expanded': isExpandedCategory(userHistory.user.email, category) }">
                        <i class="fas fa-chevron-down"></i>
                      </div>
                    </div>
                  </div>

                  <!-- Timeline des actions de la catégorie -->
                  <transition name="timeline">
                    <div v-if="isExpandedCategory(userHistory.user.email, category)" class="timeline-container">
                      <div class="timeline">
                        <div v-for="action in actions" :key="action._id" class="timeline-item">
                          <div class="timeline-point" :class="getActionClass(category)"></div>
                          <div class="timeline-content">
                            <div class="action-header">
                              <span class="action-date">{{ formatDate(action.date) }}</span>
                            </div>
                            <div class="action-details" v-if="action.details">
                              <div v-for="(value, key) in action.details" :key="key" class="detail-item">
                                <span class="detail-label">{{ formatDetailKey(key) }}:</span>
                                <span class="detail-value">{{ value }}</span>
                              </div>
                            </div>
                            <div class="action-meta">
                              <span class="meta-item" v-if="action.ip">
                                <i class="fas fa-network-wired"></i> {{ action.ip }}
                              </span>
                              <span class="meta-item" v-if="action.userAgent">
                                <i class="fas fa-laptop"></i> {{ formatUserAgent(action.userAgent) }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </transition>
                </div>
              </transition-group>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalUserPages > 1">
        <button
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
            class="page-btn"
        >
          <i class="fas fa-chevron-left"></i> Précédent
        </button>
        <span class="page-info">Page {{ currentPage }} sur {{ totalUserPages }}</span>
        <button
            :disabled="currentPage === totalUserPages"
            @click="changePage(currentPage + 1)"
            class="page-btn"
        >
          Suivant <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import AppLayout from '@/layout/AppLayoutGlobal.vue';
import api from '@/services/api';
import defaultAvatar from '@/assets/default-avatar.png';
import { getPhotoUrl } from '@/utils/photo';

export default {
  name: 'AdminHistory',
  components: {
    AppLayout
  },
  setup() {
    const logs = ref([]);
    const allUserActions = ref({}); // Stockage des actions d'aujourd'hui pour tous les utilisateurs
    const currentPage = ref(1);
    const totalPages = ref(1);
    const loading = ref(false);
    const expandedUsers = ref([]);
    const expandedCategories = ref(new Map());
    const searchTerm = ref('');
    const searchTimeout = ref(null);
    const usersPerPage = 7; // Nombre d'utilisateurs par page
    const errorMessage = ref('');
    const selectedCategory = ref('');

    // Extraire toutes les catégories d'action possibles à partir des logs ou d'une liste statique
    const actionCategories = [
      'connexion', 'deconnexion', 'creation_utilisateur', 'modification_utilisateur', 'suppression_utilisateur', 'validation_compte', 'ajout_points',
      'creation_famille', 'modification_famille', 'suppression_famille', 'ajout_membre_famille', 'retrait_membre_famille',
      'creation_recette', 'modification_recette', 'suppression_recette', 'notation_recette', 'commentaire_recette',
      'creation_objet', 'modification_objet', 'suppression_objet', 'utilisation_objet'
    ];

    // Chargement de toutes les actions d'aujourd'hui pour référence
    const loadAllTodayActions = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const response = await api.get('/history?limit=1000'); // Demander un grand nombre pour avoir toutes les actions
        const allLogs = response.data.histories || [];

        // Compter les actions d'aujourd'hui par utilisateur
        const actionsByUser = {};

        allLogs.forEach(log => {
          if (!log.user) return;

          const actionDate = new Date(log.date);
          const userEmail = log.user.email;

          if (actionDate >= today) {
            if (!actionsByUser[userEmail]) {
              actionsByUser[userEmail] = {
                count: 0,
                user: log.user
              };
            }
            actionsByUser[userEmail].count++;
          }
        });

        allUserActions.value = actionsByUser;
      } catch (error) {
        console.error('Erreur lors du chargement des actions totales:', error);
      }
    };

    const loadHistory = async (page = 1) => {
      try {
        loading.value = true;
        errorMessage.value = '';
        currentPage.value = page;

        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', 100); // Demander plus d'actions pour avoir assez d'utilisateurs distincts

        if (searchTerm.value) {
          params.append('search', searchTerm.value);
        }
        
        // Si une catégorie est sélectionnée, l'ajouter comme paramètre
        // Bien que le filtrage des actions par catégorie soit fait côté client,
        // informer le backend peut aider à optimiser la requête dans le futur
        if (selectedCategory.value) {
          params.append('action', selectedCategory.value);
        }

        const response = await api.get(`/history?${params.toString()}`);
        logs.value = response.data.histories || [];
        totalPages.value = response.data.pagination.pages;
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
        logs.value = [];
        errorMessage.value = "Erreur lors du chargement de l'historique. Veuillez réessayer.";
      } finally {
        loading.value = false;
      }
    };

    const debounceSearch = () => {
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
      }

      searchTimeout.value = setTimeout(() => {
        loadHistory(1); // Retour à la première page lors d'une recherche
      }, 300); // Délai de 300ms pour éviter trop de requêtes
    };

    // Grouper les logs par utilisateur
    const groupedByUser = computed(() => {
      // Grouper les logs par utilisateur
      const users = {};
      logs.value.forEach(log => {
        if (!log.user) return;
        const email = log.user.email;
        
        // Si une catégorie est sélectionnée et que l'action ne correspond pas, ignorer ce log
        if (selectedCategory.value && log.action !== selectedCategory.value) return;
        
        if (!users[email]) {
          users[email] = { user: log.user, categories: {} };
        }
        
        if (!users[email].categories[log.action]) {
          users[email].categories[log.action] = [];
        }
        users[email].categories[log.action].push(log);
      });
      
      // Ne retourner que les utilisateurs ayant au moins une action (après filtrage)
      return Object.values(users).filter(u => Object.keys(u.categories).length > 0);
    });

    // Nombre total de pages d'utilisateurs (7 utilisateurs par page)
    const totalUserPages = computed(() => {
      return Math.ceil(groupedByUser.value.length / usersPerPage);
    });

    // Utilisateurs à afficher pour la page courante (pagination côté client)
    const displayedUsers = computed(() => {
      const start = (currentPage.value - 1) * usersPerPage;
      const end = start + usersPerPage;

      // S'assurer que nous avons des utilisateurs avec des actions correspondant au filtre
      const filteredUsers = groupedByUser.value.filter(userHistory => {
        // Si aucun filtre famille n'est appliqué, afficher cet utilisateur
        if (!selectedCategory.value) {
          return true;
        }

        // Vérifier si l'utilisateur a des actions liées à la famille sélectionnée
        // (les logs ont déjà été filtrés par le backend, donc si l'utilisateur apparaît,
        // c'est qu'il a au moins une action liée à cette famille)
        return Object.values(userHistory.categories).some(actions => actions.length > 0);
      });

      return filteredUsers.slice(start, end);
    });

    const getTotalActions = (categories) => {
      return Object.values(categories).reduce((total, actions) => total + actions.length, 0);
    };

    const getActionsToday = (userEmail) => {
      return allUserActions.value[userEmail]?.count || 0;
    };

    const toggleUser = (userEmail) => {
      const index = expandedUsers.value.indexOf(userEmail);
      if (index === -1) {
        expandedUsers.value.push(userEmail);
      } else {
        expandedUsers.value.splice(index, 1);
        // Fermer toutes les catégories de cet utilisateur
        expandedCategories.value.delete(userEmail);
      }
    };

    const toggleCategory = (userEmail, category) => {
      if (!expandedCategories.value.has(userEmail)) {
        expandedCategories.value.set(userEmail, new Set());
      }

      const userCategories = expandedCategories.value.get(userEmail);
      if (userCategories.has(category)) {
        userCategories.delete(category);
      } else {
        userCategories.add(category);
      }
    };

    const isExpandedCategory = (userEmail, category) => {
      return expandedCategories.value.has(userEmail) &&
          expandedCategories.value.get(userEmail).has(category);
    };

    const getCategoryIcon = (action) => {
      const icons = {
        // Utilisateurs
        'connexion': 'fas fa-sign-in-alt',
        'deconnexion': 'fas fa-sign-out-alt',
        'creation_utilisateur': 'fas fa-user-plus',
        'modification_utilisateur': 'fas fa-user-edit',
        'suppression_utilisateur': 'fas fa-user-minus',
        'validation_compte': 'fas fa-user-check',
        'ajout_points': 'fas fa-star',

        // Familles
        'creation_famille': 'fas fa-users-cog',
        'modification_famille': 'fas fa-users-cog',
        'suppression_famille': 'fas fa-users-slash',
        'ajout_membre_famille': 'fas fa-user-plus',
        'retrait_membre_famille': 'fas fa-user-minus',

        // Recettes
        'creation_recette': 'fas fa-utensils',
        'modification_recette': 'fas fa-edit',
        'suppression_recette': 'fas fa-trash-alt',
        'notation_recette': 'fas fa-star',
        'commentaire_recette': 'fas fa-comment',

        // Objets/Ingrédients
        'creation_objet': 'fas fa-plus-circle',
        'modification_objet': 'fas fa-edit',
        'suppression_objet': 'fas fa-trash-alt',
        'utilisation_objet': 'fas fa-hand-pointer'
      };
      return icons[action] || 'fas fa-history';
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatAction = (action) => {
      const actions = {
        // Utilisateurs
        'connexion': 'Connexions',
        'deconnexion': 'Déconnexions',
        'creation_utilisateur': 'Créations d\'utilisateurs',
        'modification_utilisateur': 'Modifications d\'utilisateurs',
        'suppression_utilisateur': 'Suppressions d\'utilisateurs',
        'validation_compte': 'Validations de compte',
        'ajout_points': 'Ajouts de points',

        // Familles
        'creation_famille': 'Créations de familles',
        'modification_famille': 'Modifications de familles',
        'suppression_famille': 'Suppressions de familles',
        'ajout_membre_famille': 'Ajouts de membres',
        'retrait_membre_famille': 'Retraits de membres',

        // Recettes
        'creation_recette': 'Créations de recettes',
        'modification_recette': 'Modifications de recettes',
        'suppression_recette': 'Suppressions de recettes',
        'notation_recette': 'Notations de recettes',
        'commentaire_recette': 'Commentaires de recettes',

        // Objets/Ingrédients
        'creation_objet': 'Créations d\'objets',
        'modification_objet': 'Modifications d\'objets',
        'suppression_objet': 'Suppressions d\'objets',
        'utilisation_objet': 'Utilisations d\'objets'
      };
      return actions[action] || action;
    };

    const getActionClass = (action) => {
      const actionType = action.split('_')[0];
      const classes = {
        'connexion': 'action-connexion',
        'deconnexion': 'action-deconnexion',
        'creation': 'action-creation',
        'modification': 'action-modification',
        'suppression': 'action-suppression',
        'ajout': 'action-ajout',
        'retrait': 'action-retrait',
        'validation': 'action-validation',
        'notation': 'action-notation',
        'commentaire': 'action-commentaire',
        'utilisation': 'action-utilisation'
      };
      return classes[actionType] || '';
    };

    const formatDetailKey = (key) => {
      return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    };

    const formatUserAgent = (userAgent) => {
      if (!userAgent) return '';
      return userAgent.split(' ')[0];
    };

    const changePage = (page) => {
      if (page >= 1 && page <= totalUserPages.value) {
        currentPage.value = page;

        // Si on change de page, on ferme tous les utilisateurs développés
        expandedUsers.value = [];
        expandedCategories.value = new Map();
      }
    };

    const clearFilter = () => {
      selectedCategory.value = '';
      loadHistory(1);
    };

    onMounted(() => {
      loadAllTodayActions(); // Charger d'abord toutes les actions d'aujourd'hui
      loadHistory();
    });

    // Réinitialiser la page quand les filtres changent
    watch([selectedCategory, searchTerm], () => {
      if (currentPage.value !== 1) {
        currentPage.value = 1;
      }
      
      // Fermer tous les utilisateurs développés quand on change de filtre
      expandedUsers.value = [];
      expandedCategories.value = new Map();
      
      // Recharger l'historique quand les filtres changent
      loadHistory(1);
    });

    return {
      logs,
      allUserActions,
      currentPage,
      totalPages,
      totalUserPages,
      groupedByUser,
      displayedUsers,
      expandedUsers,
      defaultAvatar,
      formatDate,
      formatAction,
      getActionClass,
      getCategoryIcon,
      formatDetailKey,
      formatUserAgent,
      toggleUser,
      toggleCategory,
      isExpandedCategory,
      getTotalActions,
      getActionsToday,
      changePage,
      searchTerm,
      debounceSearch,
      loading,
      getPhotoUrl,
      errorMessage,
      selectedCategory,
      actionCategories,
      clearFilter
    };
  }
};
</script>

<style scoped>
.history-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  color: #2c5038;
  margin-bottom: 30px;
  font-size: 2rem;
}

/* Styles pour les filtres */
.filters-container {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
  flex-direction: row;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-box input {
  width: 80%;
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

.category-filter {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-filter select {
  padding: 8px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  outline: none;
  background-color: white;
  font-size: 1rem;
  min-width: 170px;
}

.users-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.user-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s;
  background-color: #f8f9fa;
}

.user-header:hover {
  background-color: #e9ecef;
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

.user-details h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c5038;
}

.action-count {
  font-size: 0.9rem;
  color: #666;
}

.categories-container {
  padding: 15px;
  background-color: white;
}

.category-section {
  margin-bottom: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.category-header {
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s;
  background-color: #fff;
}

.category-header:hover {
  background-color: #f8f9fa;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

.category-details h4 {
  margin: 0;
  font-size: 1rem;
  color: #2c5038;
}

.category-count {
  font-size: 0.8rem;
  color: #666;
}

.category-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.last-update-date {
  font-size: 0.8rem;
  color: #888;
  font-style: italic;
}

.expand-button {
  transition: transform 0.3s;
}

.expand-button.expanded {
  transform: rotate(180deg);
}

.timeline-container {
  padding: 15px;
  background-color: #f8f9fa;
}

.timeline {
  position: relative;
  padding-left: 30px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #ddd;
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
}

.timeline-point {
  position: absolute;
  left: -34px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.timeline-content {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.action-date {
  font-size: 0.9em;
  color: #666;
}

.action-details {
  margin: 10px 0;
  font-size: 0.9em;
}

.detail-item {
  margin: 5px 0;
}

.detail-label {
  font-weight: 500;
  color: #666;
}

.action-meta {
  margin-top: 10px;
  display: flex;
  gap: 15px;
  font-size: 0.85em;
  color: #666;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Classes pour les différentes actions */
.action-connexion {
  color: #4a6fa5;
  background-color: rgba(74, 111, 165, 0.1);
}

.action-deconnexion {
  color: #6c757d;
  background-color: rgba(108, 117, 125, 0.1);
}

.action-creation {
  color: #28a745;
  background-color: rgba(40, 167, 69, 0.1);
}

.action-modification {
  color: #17a2b8;
  background-color: rgba(23, 162, 184, 0.1);
}

.action-suppression {
  color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
}

.action-ajout, .action-points {
  color: #ffc107;
  background-color: rgba(255, 193, 7, 0.1);
}

.action-retrait {
  color: #fd7e14;
  background-color: rgba(253, 126, 20, 0.1);
}

.action-validation {
  color: #20c997;
  background-color: rgba(32, 201, 151, 0.1);
}

.action-notation {
  color: #6f42c1;
  background-color: rgba(111, 66, 193, 0.1);
}

.action-commentaire {
  color: #007bff;
  background-color: rgba(0, 123, 255, 0.1);
}

.action-utilisation {
  color: #6610f2;
  background-color: rgba(102, 16, 242, 0.1);
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
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

/* Animation pour l'expansion */
.timeline-container {
  transition: all 0.3s ease-in-out;
}

@media (max-width: 900px) {
  .filters-container {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .search-box, .category-filter {
    width: 100%;
    min-width: 0;
  }
}

.no-results {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  margin: 20px 0;
  color: #666;
  font-size: 1.1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.no-results i {
  color: #dc3545;
  margin-right: 8px;
}

.reset-filter-btn {
  background-color: #2c5038;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.reset-filter-btn:hover {
  background-color: #1e3825;
}

.filtered-indication {
  font-size: 0.8rem;
  font-style: italic;
  color: #666;
}

.error-message {
  background: #ffe4e6;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  padding: 12px 18px;
  border-radius: 8px;
  margin-bottom: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
}

.active-filter-indicator {
  background-color: #e3f2fd;
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  color: #2c5038;
  font-size: 0.95rem;
}

.active-filter-indicator i {
  margin-right: 8px;
}

.active-filter-indicator strong {
  margin: 0 5px;
}

.clear-filter-btn {
  margin-left: auto;
  background-color: transparent;
  border: none;
  color: #dc3545;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.clear-filter-btn:hover {
  background-color: rgba(220, 53, 69, 0.1);
}

/* Animation pour les changements de filtres */
.user-list-enter-active, .user-list-leave-active {
  transition: all 0.5s ease;
}
.user-list-enter-from, .user-list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.category-list-enter-active, .category-list-leave-active {
  transition: all 0.4s ease;
}
.category-list-enter-from, .category-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.timeline-enter-active, .timeline-leave-active {
  transition: all 0.3s;
  max-height: 1000px;
}
.timeline-enter-from, .timeline-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.users-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.categories-wrapper {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
</style>