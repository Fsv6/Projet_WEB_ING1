<template>
  <div class="dashboard-with-sidebar">
    <!-- Sidebar à gauche -->
    <AppSidebar 
      title="Administration" 
      :navItems="navItems"
      class="admin-sidebar"
    />

    <!-- Contenu du tableau de bord adapté -->
    <div class="dashboard-content">
      <div class="dashboard-header">
        <h1>Tableau de bord</h1>
        <p>Aperçu de l'activité de l'application</p>
      </div>

      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon users">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h2>{{ users.length }}</h2>
            <p>Utilisateurs</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon families">
            <i class="fas fa-home"></i>
          </div>
          <div class="stat-content">
            <h2>{{ families.length }}</h2>
            <p>Familles</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon admins">
            <i class="fas fa-user"></i>
          </div>
          <div class="stat-content">
            <h2>{{ adminCount }}</h2>
            <p>Administrateurs</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon incidents">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <h2>{{ incidents.length }}</h2>
            <p>Incidents signalés</p>
          </div>
        </div>
      </div>

      <!-- Conteneur des trois colonnes -->
      <div class="two-column-layout">
        <!-- Section graphique d'activité (colonne gauche) -->
        <div class="content-section left-column">
          <div class="section-header">
            <h2>Répartition des utilisateurs</h2>
            <div class="section-actions">
              <select v-model="chartType" class="period-selector">
                <option value="role">Par rôle</option>
                <option value="family">Par famille</option>
              </select>
            </div>
          </div>

          <div class="chart-container">
            <div v-if="chartType === 'role'" class="chart">
              <div class="donut-chart-container">
                <div class="donut-chart" :style="getDonutChartStyle(roleDistribution)"></div>
                <div class="donut-chart-center">
                  <span>{{ users.length }}</span>
                  <small>Utilisateurs</small>
                </div>
              </div>
              <div class="chart-legend">
                <div class="legend-item" v-for="(count, role) in roleDistribution" :key="role">
                  <span class="legend-color" :style="{ backgroundColor: getRoleColor(role) }"></span>
                  <span>{{ roleLabels[role] || role }} ({{ count }})</span>
                </div>
              </div>
            </div>

            <div v-else class="chart">
              <div class="family-chart">
                <div class="heatmap-container">
                  <div v-for="family in filteredFamilies" :key="family.id" 
                      class="heatmap-item" 
                      :style="{ 
                        backgroundColor: getHeatMapColor(getUsersInFamily(family).length, maxFamilyMembers),
                        width: `${100 / Math.min(filteredFamilies.length, 10)}%`
                      }"
                  >
                    <div class="heatmap-tooltip">
                      {{ family.nom }} ({{ getUsersInFamily(family).length }} membres)
                    </div>
                  </div>
                </div>
                <div class="heatmap-scale">
                  <div class="scale-label">0</div>
                  <div class="scale-gradient"></div>
                  <div class="scale-label">{{ maxFamilyMembers }}+</div>
                </div>
              </div>
              <div class="chart-subtitle">
                Répartition des utilisateurs par famille (survol pour voir les détails)
              </div>
            </div>
          </div>
        </div>

        <!-- Section des activités récentes (colonne centrale) -->
        <div class="content-section center-column">
          <div class="section-header">
            <h2>Activités récentes</h2>
            <div class="section-actions">
              <select v-model="activityFilter" class="period-selector">
                <option value="all">Toutes les activités</option>
                <option value="creation">Créations</option>
                <option value="modification">Modifications</option>
              </select>
            </div>
          </div>

          <div class="activity-categories">
            <div class="activity-summary">
              <div class="summary-item">
                <div class="summary-icon user">
                  <i class="fas fa-user-plus"></i>
                </div>
                <div class="summary-count">{{ creationCount }}</div>
                <div class="summary-label">Créations</div>
              </div>
              <div class="summary-item">
                <div class="summary-icon update">
                  <i class="fas fa-user-edit"></i>
                </div>
                <div class="summary-count">{{ modificationCount }}</div>
                <div class="summary-label">Modifications</div>
              </div>
            </div>

            <div class="activity-timeline">
              <h3 class="timeline-title">Historique des activités</h3>
              <div class="timeline">
                <div class="timeline-item" v-for="(activity, index) in filteredActivities" :key="index">
                  <div class="timeline-icon" :class="getActivityType(activity)">
                    <i :class="getActivityIcon(activity)"></i>
                  </div>
                  <div class="timeline-content">
                    <div class="timeline-date">{{ formatActivityDate(activity.date_creation || activity.date_modification) }}</div>
                    <div class="timeline-title">{{ getActivityTitle(activity) }}</div>
                    <div class="timeline-desc">{{ getActivityDescription(activity) }}</div>
                  </div>
                </div>
                <div v-if="filteredActivities.length === 0" class="empty-message">
                  Aucune activité récente
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Section des statistiques de connexion (colonne droite) -->
        <div class="content-section right-column">
          <div class="section-header">
            <h2>Statistiques de connexion</h2>
            <div class="section-actions">
              <select v-model="selectedTimeframe" class="period-selector" @change="processConnexionData">
                <option v-for="option in timeframeOptions" :key="option">{{ option }}</option>
              </select>
            </div>
          </div>
          
          <div class="connexion-stats">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5>Connexions sur la période</h5>
              </div>
              <div class="card-body">
                <div class="bar-chart-container">
                  <div class="bar-chart-labels">
                    <div 
                      v-for="(label, index) in getTimeframeLabels()" 
                      :key="index" 
                      class="bar-chart-label"
                    >
                      {{ label }}
                    </div>
                  </div>
                  <div class="bar-chart">
                    <div 
                      v-for="(count, index) in connexionData" 
                      :key="index"
                      class="bar-item" 
                      :style="{ height: getBarHeight(count) }"
                    >
                      <span class="bar-tooltip">{{ count }} connexions</span>
                    </div>
                  </div>
                  <div class="chart-info">
                    <div class="total-connections">
                      Total: <strong>{{ getTotalConnections() }} connexions</strong> dans la période
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section des familles actives -->
      <div class="content-section">
        <div class="section-header">
          <h2>Familles actives</h2>
          <div class="section-actions">
            <button class="view-all-btn" @click="$router.push('/admin/families')">
              <i class="fas fa-list"></i>
              Voir toutes les familles
            </button>
          </div>
        </div>

        <div class="family-cards">
          <div class="family-card" v-for="family in filteredFamilies.slice(0, 3)" :key="family.id">
            <div class="family-header">
              <h3>{{ family.nom }}</h3>
              <span class="family-code">{{ family.code }}</span>
            </div>
            <div class="family-members">
              <div class="member-count">
                <i class="fas fa-users"></i>
                <span>{{ getUsersInFamily(family).length }} membres</span>
              </div>
              <div class="member-list">
                <div class="member-item" v-for="user in getUsersInFamily(family).slice(0, 3)" :key="user.id">
                  <span class="member-name">{{ user.nom_utilisateur }}</span>
                  <span class="member-role" :class="'role-' + user.role">{{ user.role }}</span>
                </div>
                <div class="member-more" v-if="getUsersInFamily(family).length > 3">
                  + {{ getUsersInFamily(family).length - 3 }} autres
                </div>
              </div>
            </div>
          </div>
          <div class="family-card empty" v-if="filteredFamilies.length === 0">
            <div class="empty-message">Aucune famille</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal famille -->
    <div v-if="showFamilyModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingFamily ? 'Modifier une famille' : 'Ajouter une famille' }}</h3>
          <button class="close-btn" @click="closeFamilyModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveFamily">
            <div class="form-group">
              <label>Nom de la famille</label>
              <input type="text" v-model="familyForm.nom" required>
            </div>
            <div class="form-actions">
              <button type="button" class="btn secondary" @click="closeFamilyModal">Annuler</button>
              <button type="submit" class="btn primary">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppSidebar from '@/components/Sidebar.vue'

export default {
  name: 'DashboardWithSidebar',
  components: {
    AppSidebar,
  },
  data() {
    return {
      users: [],
      families: [],
      filteredFamilies: [],
      userActivities: [],
      incidents: [],
      connexionStats: [],
      chartType: 'role',
      activityFilter: 'all',
      timeframeFilter: 'day',
      roleLabels: {
        'admin': 'Administrateur',
        'simple': 'Simple',
        'complexe': 'Complexe'
      },
      showFamilyModal: false,
      editingFamily: null,
      familyForm: {
        nom: '',
        code: ''
      },
      navItems: [
        { 
          path: '/', 
          label: '', 
          icon: 'fas fa-arrow-left',
          position: 'top'
        },
        { 
          path: '/dashboard-with-sidebar', 
          label: 'Tableau de bord', 
          icon: 'fas fa-tachometer-alt' 
        },
        { 
          path: '/admin/users', 
          label: 'Gestion des utilisateurs', 
          icon: 'fas fa-users' 
        },
        { 
          path: '/admin/families', 
          label: 'Gestion des familles', 
          icon: 'fas fa-home' 
        },
        { 
          path: '/login', 
          label: 'Déconnexion', 
          icon: 'fas fa-sign-out-alt' 
        }
      ],
      timeframeOptions: ["Jour", "Semaine", "Mois"],
      selectedTimeframe: "Semaine",
      connexionData: [],
    }
  },
  computed: {
    adminCount() {
      return this.users.filter(user => user.role === 'admin').length;
    },
    roleDistribution() {
      const distribution = {};
      this.users.forEach(user => {
        if (!distribution[user.role]) {
          distribution[user.role] = 0;
        }
        distribution[user.role]++;
      });
      return distribution;
    },
    maxFamilyMembers() {
      if (this.families.length === 0) return 0;
      return Math.max(...this.families.map(family => 
        this.users.filter(user => user.famille_id === family.id).length
      ));
    },
    creationCount() {
      return this.userActivities.filter(
        activity => activity.date_creation && (!activity.date_modification || 
        new Date(activity.date_creation).getTime() === new Date(activity.date_modification).getTime())
      ).length;
    },
    modificationCount() {
      return this.userActivities.filter(
        activity => activity.date_modification && 
        new Date(activity.date_creation).getTime() !== new Date(activity.date_modification).getTime()
      ).length;
    },
    filteredActivities() {
      if (this.activityFilter === 'all') {
        return this.userActivities;
      } else if (this.activityFilter === 'creation') {
        return this.userActivities.filter(
          activity => activity.date_creation && (!activity.date_modification || 
          new Date(activity.date_creation).getTime() === new Date(activity.date_modification).getTime())
        );
      } else if (this.activityFilter === 'modification') {
        return this.userActivities.filter(
          activity => activity.date_modification && 
          new Date(activity.date_creation).getTime() !== new Date(activity.date_modification).getTime()
        );
      }
      return this.userActivities;
    },
    connexionHeatmapData() {
      // Génère les données pour la heatmap selon le filtre temporel
      let data = [];
      
      switch(this.timeframeFilter) {
        case 'day':
          data = this.getDailyConnexionStats();
          break;
        case 'week':
          data = this.getWeeklyConnexionStats();
          break;
        case 'month':
          data = this.getMonthlyConnexionStats();
          break;
        default:
          data = this.getDailyConnexionStats();
      }
      
      return data;
    },
    maxConnexionsCount() {
      if (this.connexionData.length === 0) return 1;
      return Math.max(...this.connexionData);
    }
  },
  mounted() {
    this.loadData();
    this.processConnexionData();
    // Afficher la date actuelle pour référence
    console.log('Date actuelle:', this.formatDateFrench(new Date()));
  },
  methods: {
    async loadData() {
      try {
        await Promise.all([
          this.fetchUsers(),
          this.fetchFamilies(),
          this.fetchActivities(),
          this.fetchIncidents(),
          this.fetchConnexionStats()
        ]);
        console.log('Date du jour:', this.formatDateFrench(new Date()));
        console.log('Jour de la semaine:', new Date().getDay());
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    },
    
    async fetchUsers() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/utilisateurs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des utilisateurs');
        }
        
        const data = await response.json();
        this.users = data;
      } catch (error) {
        console.error('Erreur:', error);
        this.users = [];
      }
    },
    
    async fetchFamilies() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/familles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des familles');
        }
        
        const data = await response.json();
        this.families = data || [];
        this.filteredFamilies = data || [];
      } catch (error) {
        console.error('Erreur:', error);
        this.families = [];
        this.filteredFamilies = [];
      }
    },
    
    async fetchActivities() {
      try {
        const token = localStorage.getItem('token');
        // On récupère les 10 derniers utilisateurs créés ou modifiés
        const response = await fetch('http://localhost:3000/api/utilisateurs?limit=15', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des activités');
        }
        
        const data = await response.json();
        
        // On trie les utilisateurs par date de création/modification
        this.userActivities = data
          .filter(user => user.date_creation || user.date_modification)
          .sort((a, b) => {
            const dateA = new Date(a.date_modification || a.date_creation);
            const dateB = new Date(b.date_modification || b.date_creation);
            return dateB - dateA;
          })
          .slice(0, 8);
      } catch (error) {
        console.error('Erreur:', error);
        this.userActivities = [];
      }
    },
    
    async fetchIncidents() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/incidents', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des incidents');
        }
        
        const data = await response.json();
        this.incidents = data || [];
      } catch (error) {
        console.error('Erreur:', error);
        this.incidents = [];
      }
    },
    
    async fetchConnexionStats() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/activites', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des statistiques de connexion');
        }
        
        const data = await response.json();
        // Filtrer uniquement les activités de type connexion
        this.connexionStats = data.filter(activity => activity.type_activite === 'connexion') || [];
        
        // Affichage des statistiques pour le débogage
        console.log('Statistiques de connexion récupérées:', this.connexionStats.length);
        this.connexionStats.forEach((stat, index) => {
          const date = new Date(stat.date_activite);
          console.log(`Connexion ${index + 1}:`, 
            this.formatDateFrench(date), 
            `- Jour: ${date.getDay()} (${this.getWeekdayName(date.getDay())})`);
        });
        
        this.processConnexionData();
      } catch (error) {
        console.error('Erreur:', error);
        this.connexionStats = [];
      }
    },
    
    processConnexionData() {
      // Traiter les données en fonction du timeframe sélectionné
      switch(this.selectedTimeframe) {
        case "Jour":
          this.connexionData = this.getDailyConnexionStats();
          break;
        case "Semaine":
          this.connexionData = this.getWeeklyConnexionStats();
          break;
        case "Mois":
          this.connexionData = this.getMonthlyConnexionStats();
          break;
        default:
          this.connexionData = this.getWeeklyConnexionStats();
      }
    },
    
    getDailyConnexionStats() {
      // Les données sont au format 24h (heure par heure)
      const hours = Array.from({ length: 24 }, () => 0);
      
      // Si pas de données de connexion, retourner un tableau vide
      if (this.connexionStats.length === 0) {
        return hours;
      }
      
      // Utilisation des vraies données
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      this.connexionStats.forEach(stat => {
        const date = new Date(stat.date_activite);
        // On ne garde que les connexions d'aujourd'hui
        if (date.getTime() >= today.getTime()) {
          const hour = date.getHours();
          hours[hour]++;
        }
      });
      
      return hours;
    },
    
    getWeeklyConnexionStats() {
      // Les données sont au format jours de la semaine (0-6, où 0 est dimanche)
      const days = Array.from({ length: 7 }, () => 0);
      
      // Si pas de données de connexion, retourner un tableau vide
      if (this.connexionStats.length === 0) {
        return days;
      }
      
      // Utilisation des vraies données
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Journaliser pour déboguer
      console.log('Vérification des jours:');
      
      this.connexionStats.forEach(stat => {
        const date = new Date(stat.date_activite);
        
        // On ne garde que les connexions de la dernière semaine
        if (date.getTime() >= oneWeekAgo.getTime()) {
          const day = date.getDay(); // 0-6 (0 = dimanche, 1 = lundi, etc.)
          
          // Log pour déboguer
          console.log(`Date: ${date.toLocaleDateString()} - Jour: ${day} (${this.getWeekdayName(day)})`);
          
          days[day]++;
        }
      });
      
      return days;
    },
    
    // Fonction utilitaire pour obtenir le nom du jour de la semaine
    getWeekdayName(dayIndex) {
      const weekdays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      return weekdays[dayIndex];
    },
    
    getMonthlyConnexionStats() {
      // Les données sont au format jours du mois
      const today = new Date();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      
      const days = Array.from({ length: daysInMonth }, () => 0);
      
      // Si pas de données de connexion, retourner un tableau vide
      if (this.connexionStats.length === 0) {
        return days;
      }
      
      // Utilisation des vraies données
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      this.connexionStats.forEach(stat => {
        const date = new Date(stat.date_activite);
        // On ne garde que les connexions du mois en cours
        if (date.getTime() >= firstDayOfMonth.getTime()) {
          const day = date.getDate() - 1; // 0-indexed
          if (day >= 0 && day < days.length) {
            days[day]++;
          }
        }
      });
      
      return days;
    },
    
    getUsersInFamily(family) {
      return this.users.filter(user => user.famille_id === family.id);
    },
    
    getDonutChartStyle(distribution) {
      const total = Object.values(distribution).reduce((a, b) => a + b, 0);
      if (total === 0) return '';
      
      let conic = 'conic-gradient(';
      let currentAngle = 0;
      
      const roles = Object.keys(distribution);
      roles.forEach((role, index) => {
        const percentage = (distribution[role] / total) * 100;
        const color = this.getRoleColor(role);
        
        conic += `${color} ${currentAngle}deg ${currentAngle + percentage * 3.6}deg`;
        currentAngle += percentage * 3.6;
        
        if (index < roles.length - 1) {
          conic += ', ';
        }
      });
      
      conic += ')';
      return { background: conic };
    },
    
    getRoleColor(role) {
      const colors = {
        'admin': '#2196f3',
        'simple': '#4caf50',
        'complexe': '#ff9800'
      };
      
      return colors[role] || '#999';
    },
    
    getHeatMapColor(value, max) {
      if (max === 0) return '#eee';
      
      const intensity = Math.min(value / max, 1);
      return `hsla(210, 100%, ${100 - (intensity * 50)}%, ${0.2 + intensity * 0.8})`;
    },
    
    getConnexionHeatmapColor(count) {
      if (this.maxConnexionsCount === 0) return 'hsla(120, 70%, 90%, 0.5)';
      const intensity = count / this.maxConnexionsCount;
      return `hsla(120, 70%, ${90 - intensity * 40}%, ${0.5 + intensity * 0.5})`;
    },
    
    getTimeframeLabels() {
      switch(this.selectedTimeframe) {
        case "Jour": {
          // Générer les heures de la journée (0h, 4h, 8h, etc.)
          return Array.from({ length: 7 }, (_, idx) => `${(idx * 4)}h`);
        }
        case "Semaine": {
          // Générer les jours de la semaine dans l'ordre standard (dimanche à samedi)
          const weekdays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
          return weekdays;
        }
        case "Mois": {
          // Générer les semaines du mois
          return Array.from({ length: 7 }, (_, idx) => `S${idx+1}`);
        }
        default:
          return Array.from({ length: 7 }, (_, idx) => `J${idx+1}`);
      }
    },
    
    getActivityType(activity) {
      if (activity.date_creation && !activity.date_modification) {
        return 'user';
      } else {
        return 'update';
      }
    },
    
    getActivityIcon(activity) {
      if (activity.date_creation && !activity.date_modification) {
        return 'fas fa-user-plus';
      } else {
        return 'fas fa-user-edit';
      }
    },
    
    getActivityTitle(activity) {
      if (activity.date_creation && !activity.date_modification) {
        return 'Nouvel utilisateur';
      } else {
        return 'Utilisateur modifié';
      }
    },
    
    getActivityDescription(activity) {
      if (activity.date_creation && !activity.date_modification) {
        return `L'utilisateur "${activity.nom_utilisateur}" (${activity.email}) a été créé`;
      } else {
        return `L'utilisateur "${activity.nom_utilisateur}" (${activity.email}) a été mis à jour`;
      }
    },
    
    formatActivityDate(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffDay > 0) {
        return `Il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
      } else if (diffHour > 0) {
        return `Il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
      } else if (diffMin > 0) {
        return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
      } else {
        return 'À l\'instant';
      }
    },
    
    editFamily(family) {
      this.editingFamily = family;
      this.familyForm = {
        nom: family.nom_famille
      };
      this.showFamilyModal = true;
    },
    
    async regenerateCode(family) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/familles/${family.id}/regenerer-code`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la régénération du code');
        }
        
        await this.fetchFamilies();
        alert('Code régénéré avec succès');
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la régénération du code');
      }
    },
    
    async saveFamily() {
      try {
        const token = localStorage.getItem('token');
        const isEditing = !!this.editingFamily;
        const url = isEditing 
          ? `http://localhost:3000/api/familles/${this.editingFamily.id}`
          : 'http://localhost:3000/api/familles';
          
        const response = await fetch(url, {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.familyForm)
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de l\'enregistrement');
        }
        
        await this.fetchFamilies();
        this.closeFamilyModal();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'enregistrement');
      }
    },
    
    closeFamilyModal() {
      this.showFamilyModal = false;
      this.editingFamily = null;
      this.familyForm = {
        nom: ''
      };
    },
    
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push('/login');
    },
    
    changeTimeframe() {
      // Retraiter les données lors du changement de période
      this.processConnexionData();
    },
    
    getTotalConnections() {
      return this.connexionData.reduce((sum, count) => sum + count, 0);
    },
    
    getBarHeight(count) {
      const maxHeight = 180;
      const maxCount = this.maxConnexionsCount || 1;
      return `${(count / maxCount) * maxHeight}px`;
    },
    
    // Méthode pour enregistrer une connexion utilisateur
    async enregistrerConnexion(utilisateurId) {
      try {
        const token = localStorage.getItem('token');
        
        // Créer une nouvelle activité de type connexion
        const nouvelleActivite = {
          utilisateur_id: utilisateurId,
          type_activite: 'connexion',
          date_activite: new Date().toISOString(),
          details: 'Connexion au tableau de bord',
          adresse_ip: '' // L'adresse IP pourrait être récupérée côté serveur
        };
        
        // Envoyer la requête pour créer l'activité
        const response = await fetch('http://localhost:3000/api/activites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(nouvelleActivite)
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de l\'enregistrement de la connexion');
        }
        
        // Actualiser les stats de connexion
        await this.fetchConnexionStats();
      } catch (error) {
        console.error('Erreur:', error);
      }
    },
    
    formatDateFrench(date) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('fr-FR', options);
    },
  }
}
</script>

<style scoped lang="scss">
/* Structure de base avec sidebar */
.dashboard-with-sidebar {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

/* Styles du contenu adapté avec la sidebar */
.dashboard-content {
  flex: 1;
  padding: 15px;
  margin-left: 220px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* Réinitialiser le style pour éviter les problèmes de mise en page */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f5f7fa;
}

/* Styles de base uniformisés */
.dashboard-header {
  margin-bottom: 25px;
  text-align: center;
}

.dashboard-header h1 {
  font-size: 24px;
  margin: 0 0 8px 0;
  color: #333;
  font-weight: 600;
}

.dashboard-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

/* Cartes statistiques uniformisées */
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid rgba(0, 0, 0, 0.03);
  height: 100px;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  color: #333;
  font-size: 20px;
  flex-shrink: 0;
}

.stat-icon.users {
  color: #2196f3;
}

.stat-icon.families {
  color: #4caf50;
}

.stat-icon.admins {
  color: #ff9800;
}

.stat-icon.incidents {
  color: #f44336;
}

.stat-content {
  flex: 1;
}

.stat-content h2 {
  font-size: 24px;
  margin: 0;
  font-weight: 600;
  color: #333;
}

.stat-content p {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 14px;
}

/* Layout des trois grandes cartes */
.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

/* Style uniformisé des cartes */
.content-section {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.03);
  height: 450px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.content-section:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

/* En-tête des cartes uniformisé */
.section-header {
  padding: 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.section-actions {
  display: flex;
  gap: 10px;
}

.period-selector {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background-color: white;
  font-size: 14px;
  cursor: pointer;
  color: #555;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  padding-right: 32px;
}

.period-selector:hover {
  border-color: #aaa;
}

.period-selector:focus {
  outline: none;
  border-color: #4263eb;
  box-shadow: 0 0 0 2px rgba(66, 99, 235, 0.2);
}

/* Contenu des cartes uniformisé */
.chart-container, 
.activity-categories, 
.connexion-stats {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Styles pour le graphique donut */
.chart {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-chart-container {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  position: relative;
}

.donut-chart {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
}

.donut-chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.03);
}

.donut-chart-center span {
  font-size: 22px;
  font-weight: 600;
  color: #333;
}

.donut-chart-center small {
  font-size: 13px;
  color: #666;
  margin-top: 2px;
}

.chart-legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 20px;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #555;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  margin-right: 8px;
}

/* Information supplémentaire dans la carte */
.chart-info-text {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-top: 20px;
  font-style: italic;
}

/* Styles pour les activités récentes */
.activity-summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #eee;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
}

.summary-icon {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 10px;
  font-size: 18px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.summary-icon.user {
  background-color: #4263eb;
}

.summary-icon.update {
  background-color: #0fb9b1;
}

.summary-count {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
}

.summary-label {
  font-size: 14px;
  color: #666;
}

.activity-timeline {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.timeline-title {
  font-size: 16px;
  margin: 0 0 15px 0;
  color: #333;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 1px dashed #eee;
}

.timeline {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
  scrollbar-width: thin;
  position: relative;
  padding-left: 30px;
}

.timeline:before {
  content: '';
  position: absolute;
  left: 9px;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #e9ecef;
  border-radius: 3px;
}

.timeline::-webkit-scrollbar {
  width: 6px;
}

.timeline::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 10px;
}

.timeline::-webkit-scrollbar-track {
  background-color: #f5f5f5;
  border-radius: 10px;
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
  margin-bottom: 0;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-icon {
  position: absolute;
  left: -30px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  z-index: 2;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.timeline-icon.creation {
  background-color: #4263eb;
}

.timeline-icon.update {
  background-color: #0fb9b1;
}

.timeline-content {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.timeline-item:nth-child(odd) .timeline-content {
  border-left-color: #4263eb;
}

.timeline-item:nth-child(even) .timeline-content {
  border-left-color: #0fb9b1;
}

.timeline-date {
  font-size: 12px;
  color: #888;
  margin-bottom: 5px;
}

.timeline-item-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
}

.timeline-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

/* Styles pour les statistiques de connexion */
.connexion-stats {
  display: flex;
  flex-direction: column;
}

.connexion-header {
  margin-bottom: 15px;
}

.connexion-stats-title {
  font-size: 16px;
  color: #333;
  font-weight: 600;
  margin: 0 0 5px 0;
}

.connexion-period {
  font-size: 14px;
  color: #666;
}

.bar-chart-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  margin-top: 20px;
}

.bar-chart-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 10px;
}

.bar-chart-label {
  flex: 1;
  text-align: center;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.bar-chart {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 220px;
  padding: 0 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  border-left: 1px solid #eee;
  position: relative;
}

/* Lignes horizontales pour le graphique */
.bar-chart:before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 25%;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.05);
}

.bar-chart:after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 75%;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.05);
}

.bar-item {
  flex: 1;
  background-color: #4263eb;
  margin: 0 5px;
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 5px;
  transition: all 0.3s ease;
  max-width: 35px;
  width: 100%;
}

.bar-item:hover {
  background-color: #3b57ce;
  transform: scaleY(1.05);
}

.bar-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 13px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  margin-bottom: 8px;
  z-index: 5;
}

.bar-item:hover .bar-tooltip {
  opacity: 1;
}

.bar-tooltip:after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
}

.chart-info {
  display: flex;
  justify-content: center;
  padding: 10px;
  border-top: 1px dashed #eee;
  margin-top: auto;
}

.total-connections {
  font-size: 15px;
  color: #555;
  font-weight: 500;
}

/* Pour les écrans plus petits */
@media (max-width: 1200px) {
  .two-column-layout {
    grid-template-columns: 1fr 1fr;
  }
  
  .content-section:last-child {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .two-column-layout {
    grid-template-columns: 1fr;
  }
  
  .content-section:last-child {
    grid-column: auto;
  }
}
</style> 