<template>
  <div class="accueil-container">
    <AppSidebar 
      :title="getTitle"
      :navItems="getNavItems"
    />
    <div class="main-content">
      <div class="welcome-card">
        <h1>{{ getWelcomeMessage }}</h1>
        <div class="user-info" v-if="user">
          <div class="user-profile">
            <img :src="user.photo_profil || '/default-avatar.png'" alt="Photo de profil" class="profile-pic">
            <div class="user-details">
              <h2>{{ user.nom }} {{ user.prenom }}</h2>
              <p class="role-badge admin">Administrateur</p>
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
    </div>
  </div>
</template>

<script>
import authService from '../services/authService';
import AppSidebar from '@/components/Sidebar.vue';

export default {
  name: 'AccueilAdminPage',
  components: {
    AppSidebar
  },
  data() {
    return {
      user: null,
      stats: {
        utilisateurs: 0,
        objets: 0,
        incidents: 0
      }
    };
  },
  computed: {
    getWelcomeMessage() {
      if (!this.user) return 'Bienvenue sur Smart Kitchen';
      return `Bienvenue cher Admin`;
    },
    getTitle() {
      return 'Smart Kitchen - Admin';
    },
    getNavItems() {
      return [
        { path: '/admin', label: 'Accueil', icon: 'fas fa-home' },
        { path: '/admin/dashboard', label: 'Tableau de bord', icon: 'fas fa-chart-line' },
        { path: '/admin/users', label: 'Gestion utilisateurs', icon: 'fas fa-users' },
        { path: '/admin/objets', label: 'Gestion objets', icon: 'fas fa-utensils' },
        { path: '/admin/settings', label: 'Paramètres', icon: 'fas fa-cog' }
      ];
    }
  },
  created() {
    this.user = authService.getUser();
    if (!this.user || this.user.role !== 'admin') {
      this.$router.push('/login');
    } else {
      this.loadAdminStats();
    }
  },
  methods: {
    logout() {
      authService.logout();
      this.$router.push('/login');
    },
    async loadAdminStats() {
      try {
        // Ici, vous pouvez charger les statistiques admin
        // Par exemple :
        // this.stats.utilisateurs = await apiService.getUsersCount();
        // this.stats.objets = await apiService.getObjectsCount();
        // this.stats.incidents = await apiService.getIncidentsCount();
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    }
  }
};
</script>

<style scoped>
.accueil-container {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 20px;
  margin-left: 250px;
}

.welcome-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #2c5038;
  margin-bottom: 30px;
  font-size: 2.5rem;
}

.user-profile {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.profile-pic {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-right: 20px;
  object-fit: cover;
}

.user-details h2 {
  margin: 0;
  color: #2c3e50;
}

.role-badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  margin-top: 5px;
}

.role-badge.admin {
  background-color: #dc3545;
  color: white;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.stat-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card i {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 10px;
}

.stat-card h3 {
  margin: 10px 0;
  color: #2c3e50;
}

.stat-card p {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

.actions {
  margin-top: 30px;
  text-align: center;
}

.logout-btn {
  background-color: #dc3545;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.logout-btn:hover {
  background-color: #c82333;
}

/* Media Queries */
@media screen and (max-width: 768px) {
  .main-content {
    margin-left: 200px;
    padding: 15px;
  }

  .welcome-card {
    padding: 20px;
  }

  .quick-stats {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 480px) {
  .main-content {
    margin-left: 60px;
    padding: 10px;
  }

  .welcome-card {
    padding: 15px;
  }

  .user-profile {
    flex-direction: column;
    text-align: center;
  }

  .profile-pic {
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style> 