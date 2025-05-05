<template>
  <AppLayout>
    <div class="accueil-container">
      <div class="main-content">
        <div class="welcome-card">
          <h1>{{ getWelcomeMessage() }}</h1>
          <div class="user-info" v-if="userData">
            <div class="user-profile">

              <div class="user-details">
                <div class="date-info">
                  <i class="fas fa-calendar-alt"></i> {{ formatDate(new Date()) }}
                </div>
              </div>
            </div>

            <div class="actions">
              <button @click="logout" class="logout-btn">
                <i class="fas fa-sign-out-alt"></i>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="quick-actions">
          <div class="section-header">
            <h2><i class="fas fa-bolt"></i> Actions rapides</h2>
          </div>
          <div class="actions-grid">
            <router-link to="/admin/users?newUser=true" class="action-button">
              <i class="fas fa-user-plus"></i>
              <span>Nouvel utilisateur</span>
            </router-link>
            <router-link to="/admin/families?newFamily=true" class="action-button">
              <i class="fas fa-plus-circle"></i>
              <span>Nouvelle famille</span>
            </router-link>
            <router-link to="/admin/user-points" class="action-button">
              <i class="fas fa-coins"></i>
              <span>Gérer les points</span>
            </router-link>
            <router-link to="/admin/reports" class="action-button">
              <i class="fas fa-file-export"></i>
              <span>Générer rapports</span>
            </router-link>
            <button @click="refreshStats" class="action-button">
              <i class="fas fa-sync-alt"></i>
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        <!-- Statistiques générales -->
        <div class="dashboard-stats">
          <div class="stat-card">
            <div class="stat-icon user-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
              <h3>Utilisateurs</h3>
              <div class="stat-number">{{ stats.usersCount || '...' }}</div>
              <div class="stat-info">
                <span class="stat-highlight">{{ stats.newUsers || 0 }}</span> nouveaux cette semaine
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon family-icon">
              <i class="fas fa-home"></i>
            </div>
            <div class="stat-content">
              <h3>Familles</h3>
              <div class="stat-number">{{ stats.familiesCount || '...' }}</div>
              <div class="stat-info">
                <span class="stat-highlight">{{ stats.activeWithPoints || 0 }}</span> actives avec points
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon action-icon">
              <i class="fas fa-history"></i>
            </div>
            <div class="stat-content">
              <h3>Actions</h3>
              <div class="stat-number">{{ stats.actionsCount || '...' }}</div>
              <div class="stat-info">
                <span class="stat-highlight">{{ stats.todayActions || 0 }}</span> aujourd'hui
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon points-icon">
              <i class="fas fa-star"></i>
            </div>
            <div class="stat-content">
              <h3>Points</h3>
              <div class="stat-number">{{ stats.totalPoints || '...' }}</div>
              <div class="stat-info">
                <span v-if="stats.pointsDistributed > 0" class="stat-positive">+{{ stats.pointsDistributed }}</span>
                <span v-else class="stat-negative">{{ stats.pointsDistributed }}</span>
                cette semaine
              </div>
            </div>
          </div>
        </div>

        <!-- Activité récente (remplacée par des graphiques) -->
        <div class="chart-section">
          <div class="section-header">
            <h2><i class="fas fa-chart-line"></i> Statistiques & Activité</h2>
            <router-link to="/admin/history" class="view-all-link">
              Voir l'historique <i class="fas fa-arrow-right"></i>
            </router-link>
          </div>

          <div v-if="loading" class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i> Chargement des données...
          </div>
          <div v-else class="charts-container">
            <!-- Graphique des utilisateurs par niveau (amélioré) -->
            <div class="chart-wrapper">
              <h3>Distribution des utilisateurs par niveau</h3>
              <div class="doughnut-chart">
                <div class="doughnut-segments" :style="{ background: generateConicGradient(stats.usersByLevel) }">
                </div>
                <div class="chart-center">
                  <span>{{ stats.usersCount }}</span>
                  <small>utilisateurs</small>
                </div>
              </div>
              <div class="chart-legend">
                <div v-for="(count, level) in stats.usersByLevel" :key="level" class="legend-item">
                  <span class="color-badge" :style="{ backgroundColor: getLevelColor(level) }"></span>
                  <span>{{ getNiceLevelName(level) }}: {{ count }} ({{ ((count / stats.usersCount) * 100).toFixed(1) }}%)</span>
                </div>
              </div>
            </div>

            <!-- Graphique: Actions par jour et tranche horaire -->
            <div class="chart-wrapper">
              <h3>Nombre d'actions/utilisations (7 jours)</h3>
              <div class="heatmap-chart">
                <div class="heatmap-y-axis">
                  <div class="heatmap-y-label">Matin<br/>(00h-08h)</div>
                  <div class="heatmap-y-label">Journée<br/>(08h-16h)</div>
                  <div class="heatmap-y-label">Soir<br/>(16h-00h)</div>
                </div>
                <div class="heatmap-grid">
                  <div v-for="(day, dayIndex) in ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']" :key="dayIndex" class="heatmap-day-column">
                    <div class="heatmap-x-label">{{ day }}</div>
                    <div v-for="(timeSlot, slotIndex) in ['morning', 'afternoon', 'evening']" :key="`${dayIndex}-${slotIndex}`"
                         class="heatmap-cell"
                         :style="{ backgroundColor: getHeatmapColor(stats.actionsByDayTime[dayIndex]?.[slotIndex] || 0) }">
                      <span class="heatmap-value">{{ stats.actionsByDayTime[dayIndex]?.[slotIndex] || 0 }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Menu administration -->
        
      </div>
    </div>
  </AppLayout>
</template>

<script>
import AppLayout from '@/layout/AppLayoutGlobal.vue';
import { useAuthStore } from '@/stores/auth';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import defaultAvatar from '@/assets/default-avatar.png';

export default {
  name: 'AccueilAdminPage',
  components: {
    AppLayout
  },
  setup() {
    const auth = useAuthStore();
    const router = useRouter();
    const userData = ref(null);
    const loading = ref(false);
    const recentActions = ref([]);
    const stats = ref({
      usersCount: 0,
      newUsers: 0,
      familiesCount: 0,
      activeWithPoints: 0,
      actionsCount: 0,
      todayActions: 0,
      totalPoints: 0,
      pointsDistributed: 0,
      usersByLevel: {
        'débutant': 0,
        'intermédiaire': 0,
        'avancé': 0,
        'expert': 0
      },
      actionsByDayTime: Array(7).fill().map(() => Array(3).fill(0))
    });

    const loadUserData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || storedUser.role !== 'admin') {
          router.push('/login');
          return;
        }

        // Vérifier que le token est présent
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token manquant');
        }

        // Configuration de l'en-tête d'autorisation
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Charger les données complètes de l'utilisateur depuis l'API
        const response = await api.get(`/users/me`);
        console.log('Réponse API:', response.data); // Pour le débogage

        userData.value = {
          ...response.data,
          nom: response.data.personne?.nom || storedUser.nom,
          prenom: response.data.personne?.prenom || storedUser.prenom,
          email: response.data.email || storedUser.email,
          photo_profil: response.data.photo_profil || defaultAvatar
        };
      } catch (error) {
        console.error('Erreur détaillée:', error.response || error);
        // Utiliser les données du localStorage comme fallback
        const storedUser = JSON.parse(localStorage.getItem('user'));
        userData.value = {
          ...storedUser,
          photo_profil: storedUser.photo_profil || defaultAvatar
        };
      }
    };

    const loadStats = async () => {
      try {
        loading.value = true;

        // Configuration de l'en-tête d'autorisation
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token manquant');
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Récupérer toutes les statistiques en un seul appel API
        const response = await api.get('/history/admin-stats');
        const adminStats = response.data;
        
        // Mettre à jour les statistiques avec les données de l'API
        stats.value = adminStats;
        
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        // En cas d'erreur, ne pas afficher de données fictives, mais garder
        // les valeurs par défaut initialisées dans le ref stats
      } finally {
        loading.value = false;
      }
    };

    const refreshStats = () => {
      loadStats();
    };

    onMounted(() => {
      loadUserData();
      loadStats();
    });

    const getWelcomeMessage = () => {
      if (!userData.value) return 'Bienvenue sur Smart Kitchen';
      const nom = userData.value.nom || '';
      const prenom = userData.value.prenom || '';
      return `Bienvenue ${prenom} ${nom}`.trim();
    };

    const logout = () => {
      auth.clearAuth();
      router.push('/login');
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatTimeAgo = (dateString) => {
      const now = new Date();
      const date = new Date(dateString);
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffDay > 0) {
        return `il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
      } else if (diffHour > 0) {
        return `il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
      } else if (diffMin > 0) {
        return `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
      } else {
        return 'à l\'instant';
      }
    };

    const formatActionName = (action) => {
      const actions = {
        connexion: 'Connexion',
        deconnexion: 'Déconnexion',
        creation_utilisateur: 'Création d\'utilisateur',
        modification_utilisateur: 'Modification d\'utilisateur',
        suppression_utilisateur: 'Suppression d\'utilisateur',
        validation_compte: 'Validation de compte',
        ajout_points: 'Ajout de points',
        creation_famille: 'Création de famille',
        modification_famille: 'Modification de famille',
        suppression_famille: 'Suppression de famille',
        ajout_membre_famille: 'Ajout de membre à une famille',
        retrait_membre_famille: 'Retrait de membre d\'une famille',
        creation_recette: 'Création de recette',
        modification_recette: 'Modification de recette',
        suppression_recette: 'Suppression de recette',
        notation_recette: 'Notation de recette',
        commentaire_recette: 'Commentaire sur recette',
        creation_objet: 'Création d\'objet',
        modification_objet: 'Modification d\'objet',
        suppression_objet: 'Suppression d\'objet',
        utilisation_objet: 'Utilisation d\'objet'
      };
      return actions[action] || action;
    };

    const getActionDescription = (action) => {
      switch (action.action) {
        case 'ajout_points':
          return `${action.details.montant > 0 ? 'Ajout' : 'Retrait'} de ${Math.abs(action.details.montant)} points à ${action.details.email || 'un utilisateur'}`;
        case 'creation_utilisateur':
          return `Création de l'utilisateur ${action.details.email || 'inconnu'}`;
        case 'connexion':
          return `Connexion utilisateur ${action.details.email || 'inconnu'}`;
        default:
          return `Action ${action.action} effectuée`;
      }
    };

    const getActionIcon = (action) => {
      const icons = {
        connexion: 'fas fa-sign-in-alt',
        deconnexion: 'fas fa-sign-out-alt',
        creation_utilisateur: 'fas fa-user-plus',
        modification_utilisateur: 'fas fa-user-edit',
        suppression_utilisateur: 'fas fa-user-minus',
        validation_compte: 'fas fa-user-check',
        ajout_points: 'fas fa-coins',
        creation_famille: 'fas fa-home',
        modification_famille: 'fas fa-edit',
        suppression_famille: 'fas fa-trash',
        ajout_membre_famille: 'fas fa-user-plus',
        retrait_membre_famille: 'fas fa-user-minus',
        creation_recette: 'fas fa-utensils',
        modification_recette: 'fas fa-edit',
        suppression_recette: 'fas fa-trash',
        notation_recette: 'fas fa-star',
        commentaire_recette: 'fas fa-comment',
        creation_objet: 'fas fa-plus-circle',
        modification_objet: 'fas fa-edit',
        suppression_objet: 'fas fa-trash',
        utilisation_objet: 'fas fa-cog'
      };
      return icons[action] || 'fas fa-history';
    };

    const getActionIconClass = (action) => {
      const classes = {
        connexion: 'action-login',
        deconnexion: 'action-logout',
        creation_utilisateur: 'action-create',
        modification_utilisateur: 'action-update',
        suppression_utilisateur: 'action-delete',
        validation_compte: 'action-validate',
        ajout_points: 'action-points'
      };
      return classes[action] || 'action-default';
    };

    // Fonctions pour les graphiques
    const getLevelColor = (level) => {
      const colors = {
        'débutant': '#4a90e2',   // Bleu plus moderne et vibrant
        'intermédiaire': '#2ec4b6', // Vert turquoise
        'avancé': '#f7b801',     // Or plus moderne
        'expert': '#8a4fff'      // Violet plus moderne
      };
      return colors[level] || '#95a5a6';
    };

    const getNiceLevelName = (level) => {
      const names = {
        'débutant': 'Débutant',
        'intermédiaire': 'Intermédiaire',
        'avancé': 'Avancé',
        'expert': 'Expert'
      };
      return names[level] || level;
    };

    // Fonction pour générer le gradient conique pour le graphique en anneau
    const generateConicGradient = (data) => {
      const colors = {
        'débutant': '#4a90e2',
        'intermédiaire': '#2ec4b6',
        'avancé': '#f7b801',
        'expert': '#8a4fff'
      };

      const total = Object.values(data).reduce((sum, val) => sum + val, 0);
      if (total === 0) return '#eaeaea';

      // Générer le gradient conique
      let conicGradient = 'conic-gradient(';
      let currentAngle = 0;

      // Construire le gradient en ajoutant chaque segment
      Object.entries(data).forEach(([level, count], index) => {
        if (count <= 0) return;
        
        const percentage = (count / total) * 100;
        const startAngle = currentAngle;
        const endAngle = currentAngle + percentage * 3.6;
        
        if (index > 0) conicGradient += ', ';
        conicGradient += `${colors[level]} ${startAngle}deg ${endAngle}deg`;
        
        currentAngle = endAngle;
      });

      conicGradient += ')';
      return conicGradient;
    };

    // Fonction pour la couleur de la heatmap
    const getHeatmapColor = (value) => {
      // Échelle de couleur de bleu clair à bleu foncé
      const maxValue = Math.max(...stats.value.actionsByDayTime.flat());
      if (maxValue === 0) return '#f1f5fa'; // Couleur par défaut si pas de données

      const intensity = Math.min(value / maxValue, 1);

      // Échelle de couleur de bleu clair à vert
      if (intensity === 0) return '#f1f5fa';
      if (intensity < 0.2) return '#e3f2fd';
      if (intensity < 0.4) return '#bbdefb';
      if (intensity < 0.6) return '#90caf9';
      if (intensity < 0.8) return '#64b5f6';
      return '#2196f3';
    };

    return {
      userData,
      getWelcomeMessage,
      logout,
      defaultAvatar,
      recentActions,
      stats,
      loading,
      formatDate,
      formatTimeAgo,
      formatActionName,
      getActionDescription,
      getActionIcon,
      getActionIconClass,
      refreshStats,
      getLevelColor,
      getNiceLevelName,
      generateConicGradient,
      getHeatmapColor
    };
  }
};
</script>

<style scoped>
.accueil-container {
  padding: 12px;
}

.main-content {
  flex: 1;
}

.welcome-card {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
}

h1 {
  color: #2c5038;
  margin-bottom: 15px;
  font-size: 1.6rem;
}

.user-profile {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.profile-image-container {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #2c5038;
  margin-right: 15px;
}

.profile-pic {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.date-info {
  color: #666;
  font-size: 0.85rem;
}

h2 {
  color: #2c5038;
  margin: 0 0 12px 0;
  font-size: 1.2rem;
}

.actions {
  text-align: right;
}

.logout-btn {
  background-color: #dc3545;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.logout-btn:hover {
  background-color: #c82333;
}

/* Statistiques */
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 15px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  flex-shrink: 0;
}

.stat-icon i {
  font-size: 1.3rem;
  color: white;
}

.user-icon {
  background-color: #3498db;
}

.family-icon {
  background-color: #2ecc71;
}

.action-icon {
  background-color: #9b59b6;
}

.points-icon {
  background-color: #f39c12;
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  margin: 0 0 3px 0;
  font-size: 0.85rem;
  color: #666;
}

.stat-number {
  font-size: 1.4rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.stat-info {
  font-size: 0.75rem;
  color: #777;
}

.stat-highlight {
  font-weight: bold;
  color: #2c5038;
}

.stat-positive {
  color: #2ecc71;
  font-weight: bold;
}

.stat-negative {
  color: #e74c3c;
  font-weight: bold;
}

/* Activité récente remplacée par des graphiques */
.chart-section {
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
}

.chart-wrapper {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 10px;
  text-align: center;
}

.chart-wrapper h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: #333;
}

/* Pie Chart Styles */
.pie-chart {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background-color: #eee;
  margin: 0 auto 20px;
  overflow: hidden;
}

.pie-segment {
  position: absolute;
  width: 100%;
  height: 100%;
  transform-origin: 50% 50%;
}

.segment-label {
  display: none;
}

.chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.chart-center span {
  font-size: 1.2rem;
}

.chart-center small {
  font-size: 0.7rem;
  color: #666;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
  gap: 8px;
}

.legend-item {
  font-size: 0.75rem;
}

.color-badge {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-right: 5px;
}

/* Bar Chart Styles */
.bar-chart {
  height: 200px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 10px 5px;
  background-color: white;
  border-radius: 4px;
  box-shadow: inset 0 0 3px rgba(0,0,0,0.1);
}

.bar-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  padding: 0 5px;
}

.bar-value {
  width: 100%;
  background-color: #2ecc71;
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 5px; /* pour les valeurs très petites */
  transition: height 0.5s;
}

.bar-tooltip {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.7rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.bar-value:hover .bar-tooltip {
  opacity: 1;
}

.bar-label {
  font-size: 0.7rem;
  color: #666;
  margin-top: 5px;
}

/* Actions rapides */
.quick-actions {
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.view-all-link {
  color: #2c5038;
  font-size: 0.8rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 5px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
}

.action-button:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.action-button i {
  font-size: 1.1rem;
  color: #2c5038;
}

.action-button span {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Menu navigation */
.admin-menu {
  margin-top: 12px;
}

.admin-menu h2 {
  color: #2c5038;
  margin-bottom: 12px;
}

.menu-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.menu-card {
  background-color: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  text-decoration: none;
  color: #333;
  transition: transform 0.3s, box-shadow 0.3s;
}

.menu-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.menu-card i {
  font-size: 1.5rem;
  color: #2c5038;
}

.menu-card span {
  font-size: 0.9rem;
  font-weight: bold;
}

/* Responsive */
@media screen and (max-width: 768px) {
  .accueil-container {
    padding: 10px;
  }

  .dashboard-stats {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .actions-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  }
}

@media screen and (max-width: 480px) {
  .accueil-container {
    padding: 8px;
  }

  .dashboard-stats {
    grid-template-columns: 1fr 1fr;
  }

  .welcome-card {
    padding: 12px;
  }

  .user-profile {
    flex-direction: column;
    text-align: center;
  }

  .profile-image-container {
    margin-right: 0;
    margin-bottom: 8px;
  }

  .activity-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Graphiques améliorés */
.doughnut-chart {
  position: relative;
  width: 130px;
  height: 130px;
  margin: 0 auto 10px;
}

.doughnut-segments {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  transition: all 0.5s ease, transform 0.3s ease;
}

.doughnut-segments:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.chart-center span {
  font-size: 1.2rem;
}

.chart-center small {
  font-size: 0.7rem;
  color: #666;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
  gap: 8px;
}

.legend-item {
  font-size: 0.75rem;
}

.color-badge {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-right: 5px;
}

/* Bar Chart Styles */
.bar-chart {
  height: 200px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 10px 5px;
  background-color: white;
  border-radius: 4px;
  box-shadow: inset 0 0 3px rgba(0,0,0,0.1);
}

.bar-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  padding: 0 5px;
}

.bar-value {
  width: 100%;
  background-color: #2ecc71;
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 5px; /* pour les valeurs très petites */
  transition: height 0.5s;
}

.bar-tooltip {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.7rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.bar-value:hover .bar-tooltip {
  opacity: 1;
}

.bar-label {
  font-size: 0.7rem;
  color: #666;
  margin-top: 5px;
}

/* Actions rapides */
.quick-actions {
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.view-all-link {
  color: #2c5038;
  font-size: 0.8rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 5px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
}

.action-button:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.action-button i {
  font-size: 1.1rem;
  color: #2c5038;
}

.action-button span {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Menu navigation */
.admin-menu {
  margin-top: 12px;
}

.admin-menu h2 {
  color: #2c5038;
  margin-bottom: 12px;
}

.menu-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.menu-card {
  background-color: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  text-decoration: none;
  color: #333;
  transition: transform 0.3s, box-shadow 0.3s;
}

.menu-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.menu-card i {
  font-size: 1.5rem;
  color: #2c5038;
}

.menu-card span {
  font-size: 0.9rem;
  font-weight: bold;
}

/* Responsive */
@media screen and (max-width: 768px) {
  .accueil-container {
    padding: 10px;
  }

  .dashboard-stats {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .actions-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  }
}

@media screen and (max-width: 480px) {
  .accueil-container {
    padding: 8px;
  }

  .dashboard-stats {
    grid-template-columns: 1fr 1fr;
  }

  .welcome-card {
    padding: 12px;
  }

  .user-profile {
    flex-direction: column;
    text-align: center;
  }

  .profile-image-container {
    margin-right: 0;
    margin-bottom: 8px;
  }

  .activity-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Heatmap styles */
.heatmap-chart {
  display: flex;
  height: 130px;
  margin-top: 10px;
}

.heatmap-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 6px;
  width: 60px;
}

.heatmap-y-label {
  height: 36px;
  display: flex;
  align-items: center;
  font-size: 0.6rem;
  color: #666;
  text-align: right;
}

.heatmap-grid {
  display: flex;
  flex: 1;
  gap: 3px;
}

.heatmap-day-column {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.heatmap-x-label {
  text-align: center;
  font-size: 0.6rem;
  color: #666;
  margin-bottom: 4px;
}

.heatmap-cell {
  flex: 1;
  margin: 1px 0;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: default;
  transition: transform 0.2s;
}

.heatmap-cell:hover {
  transform: scale(1.05);
}

.heatmap-value {
  font-size: 0.65rem;
  font-weight: bold;
  color: rgb(85, 81, 81);
  text-shadow: 0 0 1px rgba(0,0,0,0.5);
}
</style> 