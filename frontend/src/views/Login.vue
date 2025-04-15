<template>
  <div class="login-container">
    <div class="login-image left">
      <img src="@/assets/kitchen-left.jpg" alt="Cuisine design">
    </div>
    <div class="login-card">
      <h2>Bienvenue dans<br>MaCuisineConnectée</h2>
      
      <div v-if="message" :class="['alert', message.type === 'success' ? 'alert-success' : 'alert-error']">
        {{ message.text }}
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required
            placeholder="Email"
            :disabled="loading"
          >
        </div>

        <div class="form-group">
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required
            placeholder="Mot de passe"
            :disabled="loading"
          >
        </div>

        <button type="submit" :disabled="loading" class="submit-btn">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? 'Connexion en cours...' : 'Se connecter' }}
        </button>

        <p class="register-link">
          Pas encore de compte ? 
          <router-link to="/register" :class="{ 'disabled': loading }">S'inscrire</router-link>
        </p>
      </form>
    </div>
    <div class="login-image right">
      <img src="@/assets/kitchen-right.jpg" alt="Plats cuisinés">
    </div>
  </div>
</template>

<script>
import authService from '../services/authService';

export default {
  name: 'LoginPage',
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      message: null
    };
  },
  methods: {
    async handleLogin() {
      if (this.loading) return;
      
      this.loading = true;
      this.message = null;

      try {
        const response = await authService.login(this.email, this.password);
        this.message = {
          type: 'success',
          text: 'Connexion réussie ! Redirection...'
        };
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.utilisateur));
        
        setTimeout(() => {
          if (response.utilisateur.role === 'admin') {
            this.$router.push('/admin');
          } else {
            this.$router.push('/login');
          }
        }, 1500);

      } catch (error) {
        this.message = {
          type: 'error',
          text: error.response?.data?.message || 'Email ou mot de passe incorrect'
        };
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #e8f4f8;
  padding: 0;
  gap: 20px;
}

.login-image {
  height: 85vh;
  width: 200px;
  overflow: hidden;
  display: none;
  border-radius: 30px;
}

.login-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  
}

.login-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: #006d77;
  margin-bottom: 30px;
  font-size: 1.8rem;
  line-height: 1.3;
}

.form-group {
  margin-bottom: 20px;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #006d77;
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

.register-link {
  text-align: center;
  margin-top: 20px;
  font-size: 0.9rem;
}

.register-link a {
  color: #42b983;
  text-decoration: none;
}

.alert {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 0.9rem;
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

/* Media Queries */
@media screen and (min-width: 1200px) {
  .login-image {
    display: block;
  }
}

@media screen and (max-width: 768px) {
  .login-container {
    padding: 15px;
  }
  .login-card {
    padding: 25px;
  }
  h2 {
    font-size: 1.75rem;
    margin-bottom: 25px;
  }
  input {
    padding: 10px;
    font-size: 14px;
  }
  button {
    padding: 10px;
    font-size: 14px;
  }
}
@media screen and (max-width: 480px) {
  .login-container {
    padding: 10px;
  }
  .login-card {
    padding: 20px;
  }
  h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }
  .form-group {
    margin-bottom: 15px;
  }
  label {
    font-size: 0.9rem;
  }
  input {
    padding: 8px;
    font-size: 13px;
  }
  button {
    padding: 8px;
    font-size: 13px;
  }
  .register-link {
    font-size: 0.8rem;
  }
  .alert {
    padding: 10px;
    font-size: 0.8rem;
  }
}

.submit-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.disabled {
  pointer-events: none;
  opacity: 0.7;
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.alert {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style> 