<template>
  <div class="register-container">
    <div class="register-card">
      <h2>Inscription</h2>

      <div v-if="message" :class="['alert', message.type === 'success' ? 'alert-success' : 'alert-error']">
        {{ message.text }}
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="nom">Nom</label>
          <input 
            type="text" 
            id="nom" 
            v-model="nom" 
            required
            placeholder="Votre nom"
          >
        </div>

        <div class="form-group">
          <label for="prenom">Prénom</label>
          <input 
            type="text" 
            id="prenom" 
            v-model="prenom" 
            required
            placeholder="Votre prénom"
          >
        </div>

        <div class="form-group">
          <label for="nom_utilisateur">Nom d'utilisateur</label>
          <input 
            type="text" 
            id="nom_utilisateur" 
            v-model="nom_utilisateur" 
            required
            placeholder="Votre nom d'utilisateur"
          >
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required
            placeholder="Votre email"
          >
        </div>

        <div class="form-group">
          <label for="mot_de_passe">Mot de passe</label>
          <input 
            type="password" 
            id="mot_de_passe" 
            v-model="mot_de_passe" 
            required
            placeholder="Votre mot de passe"
          >
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Inscription en cours...' : 'S\'inscrire' }}
        </button>

        <p class="login-link">
          Déjà inscrit ? 
          <router-link to="/login">Se connecter</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script>
import authService from '../services/authService';

export default {
  name: 'RegisterPage',
  data() {
    return {
      nom: '',
      prenom: '',
      nom_utilisateur: '',
      email: '',
      mot_de_passe: '',
      loading: false,
      message: null
    };
  },
  methods: {
    async handleRegister() {
      this.loading = true;
      this.message = null;

      try {
        const response = await authService.register({
          nom: this.nom,
          prenom: this.prenom,
          nom_utilisateur: this.nom_utilisateur,
          email: this.email,
          mot_de_passe: this.mot_de_passe
        });

        this.message = {
          type: 'success',
          text: 'Inscription réussie ! Redirection...'
        };

        // Stockage des informations utilisateur
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.utilisateur));

        // Redirection après un court délai pour montrer le message de succès
        setTimeout(() => {
          this.$router.push('/accueil');
        }, 1500);

      } catch (error) {
        this.message = {
          type: 'error',
          text: error.response?.data?.message || 'Erreur lors de l\'inscription'
        };
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.register-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #3aa876;
}

button:disabled {
  background-color: #a8a8a8;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 20px;
}

.login-link a {
  color: #42b983;
  text-decoration: none;
}

.alert {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style> 