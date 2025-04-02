<template>
  <div class="accueil-container">
    <div class="welcome-card">
      <h1>Bienvenue sur Smart Kitchen</h1>
      <div class="user-info" v-if="user">
        <p>Bonjour, {{ user.nom }}</p>
        <button @click="logout" class="logout-btn">Se déconnecter</button>
      </div>
    </div>
  </div>
</template>

<script>
import authService from '../services/authService';

export default {
  name: 'AccueilPage',
  data() {
    return {
      user: null
    };
  },
  created() {
    this.user = authService.getUser();
    if (!this.user) {
      this.$router.push('/login');
    }
  },
  methods: {
    logout() {
      authService.logout();
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.accueil-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h1 {
  color: #2c3e50;
  margin-bottom: 30px;
}

.user-info {
  margin-top: 20px;
}

.logout-btn {
  background-color: #dc3545;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #c82333;
}
</style> 