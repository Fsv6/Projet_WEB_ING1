<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Historique de {{ user?.email }}</h2>
        <button class="close-button" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Catégories d'actions de l'utilisateur -->
      <div class="categories-container">
        <div v-for="(actions, category) in groupedActions" :key="category" class="category-section">
          <div class="category-header" @click="toggleCategory(category)">
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
              <div class="expand-button" :class="{ 'expanded': expandedCategories.includes(category) }">
                <i class="fas fa-chevron-down"></i>
              </div>
            </div>
          </div>

          <!-- Timeline des actions de la catégorie -->
          <div v-if="expandedCategories.includes(category)" class="timeline-container">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import api from '@/services/api';

export default {
  name: 'UserHistoryModal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    user: {
      type: Object,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const logs = ref([]);
    const expandedCategories = ref([]);
    const loading = ref(false);

    const loadHistory = async () => {
      if (!props.user?._id) return;

      try {
        loading.value = true;
        const response = await api.get(`/history/user/${props.user._id}`);
        logs.value = response.data.histories || [];
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
      } finally {
        loading.value = false;
      }
    };

    const groupedActions = computed(() => {
      const grouped = {};

      logs.value.forEach(log => {
        if (!grouped[log.action]) {
          grouped[log.action] = [];
        }
        grouped[log.action].push(log);
      });

      // Trier les actions par date
      Object.values(grouped).forEach(actions => {
        actions.sort((a, b) => new Date(b.date) - new Date(a.date));
      });

      return grouped;
    });

    const toggleCategory = (category) => {
      const index = expandedCategories.value.indexOf(category);
      if (index === -1) {
        expandedCategories.value.push(category);
      } else {
        expandedCategories.value.splice(index, 1);
      }
    };

    const closeModal = () => {
      emit('close');
    };

    const getCategoryIcon = (action) => {
      const icons = {
        'connexion': 'fas fa-sign-in-alt',
        'creation_utilisateur': 'fas fa-user-plus',
        'modification_utilisateur': 'fas fa-user-edit',
        'suppression_utilisateur': 'fas fa-user-minus',
        'ajout_points': 'fas fa-star'
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
        'connexion': 'Connexions',
        'creation_utilisateur': 'Créations d\'utilisateurs',
        'modification_utilisateur': 'Modifications d\'utilisateurs',
        'suppression_utilisateur': 'Suppressions d\'utilisateurs',
        'ajout_points': 'Ajouts de points'
      };
      return actions[action] || action;
    };

    const getActionClass = (action) => {
      const classes = {
        'connexion': 'action-connexion',
        'creation_utilisateur': 'action-creation',
        'modification_utilisateur': 'action-modification',
        'suppression_utilisateur': 'action-suppression',
        'ajout_points': 'action-points'
      };
      return classes[action] || '';
    };

    const formatDetailKey = (key) => {
      return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    };

    const formatUserAgent = (userAgent) => {
      if (!userAgent) return '';
      return userAgent.split(' ')[0];
    };

    watch(() => props.show, (newValue) => {
      if (newValue) {
        loadHistory();
      } else {
        logs.value = [];
        expandedCategories.value = [];
      }
    });

    return {
      groupedActions,
      expandedCategories,
      closeModal,
      toggleCategory,
      getCategoryIcon,
      formatDate,
      formatAction,
      getActionClass,
      formatDetailKey,
      formatUserAgent
    };
  }
};
</script>

<style scoped>
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
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.modal-header h2 {
  margin: 0;
  color: #2c5038;
  font-size: 1.5rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s;
}

.close-button:hover {
  color: #2c5038;
}

.categories-container {
  padding: 20px;
}

/* Réutilisation des styles existants */
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
  background-color: #4CAF50;
}

.action-creation {
  background-color: #2196F3;
}

.action-modification {
  background-color: #FF9800;
}

.action-suppression {
  background-color: #f44336;
}

.action-points {
  background-color: #9C27B0;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .modal-header {
    padding: 15px;
  }

  .categories-container {
    padding: 15px;
  }

  .category-header {
    padding: 10px;
  }

  .timeline-container {
    padding: 10px;
  }

  .action-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .action-meta {
    flex-direction: column;
  }
}
</style>