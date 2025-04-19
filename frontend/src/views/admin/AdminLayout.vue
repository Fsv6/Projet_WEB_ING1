<template>
  <div class="admin-layout">
    <!-- Utilisation du composant AppSidebar -->
    <AppSidebar title="Administration">
      <router-link to="/admin/users" class="nav-item">
        <i class="fas fa-users"></i>
        Gestion des utilisateurs
      </router-link>
      <!-- Autres liens désactivés pour le moment -->
      <div class="nav-item disabled">
        <i class="fas fa-plug"></i>
        Gestion des objets
      </div>
      <div class="nav-item disabled">
        <i class="fas fa-paint-brush"></i>
        Apparence
      </div>
      <div class="nav-item disabled">
        <i class="fas fa-cog"></i>
        Paramètres
      </div>
    </AppSidebar>

    <!-- Contenu principal dynamique -->
    <div class="main-content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import AppSidebar from '@/components/Sidebar.vue'

export default {
  name: 'AdminLayout',
  components: {
    AppSidebar
  }
}
</script>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.main-content {
  padding: 30px;
  margin-left: 250px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: calc(100vh - 60px);
}
</style> 