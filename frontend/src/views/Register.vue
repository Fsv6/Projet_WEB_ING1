<template>
  <div class="register-container">
    <div class="register-image left">
      <img src="@/assets/kitchen-left.jpg" alt="Cuisine gauche" />
    </div>
    <div class="register-card-modern">
      <h2>Inscription</h2>
      <div v-if="message" :class="['alert', message.type === 'success' ? 'alert-success' : 'alert-error']">
        {{ message.text }}
      </div>
      <form @submit.prevent="handleRegister" class="register-form-modern">
        <div class="form-row">
          <div class="form-group">
            <label for="nom">Nom</label>
            <input type="text" id="nom" v-model="nom" required placeholder="Votre nom">
          </div>
          <div class="form-group">
            <label for="prenom">Prénom</label>
            <input type="text" id="prenom" v-model="prenom" required placeholder="Votre prénom">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="login">Nom d'utilisateur</label>
            <input type="text" id="login" v-model="login" required placeholder="Votre nom d'utilisateur">
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" v-model="email" required placeholder="Votre email">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input type="password" id="password" v-model="password" required placeholder="Votre mot de passe">
          </div>
          <div class="form-group">
            <label for="codeFamille">Code Famille</label>
            <input type="text" id="codeFamille" v-model="codeFamille" required placeholder="Ex: DUPONT2024">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="width:100%">
            <label for="photo">Photo de profil (optionnel)</label>
            <input type="file" id="photo" @change="onFileChange" accept="image/*">
          </div>
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Inscription en cours...' : 'S\'inscrire' }}
        </button>
        <p class="login-link">
          Déjà inscrit ? <router-link to="/login">Se connecter</router-link>
        </p>
      </form>
    </div>
    <div class="register-image right">
      <img src="@/assets/kitchen-right.jpg" alt="Cuisine droite" />
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
      login: '',
      email: '',
      password: '',
      codeFamille: '',
      loading: false,
      message: null,
      photo: null
    };
  },
  methods: {
    onFileChange(e) {
      const file = e.target.files[0];
      this.photo = file || null;
    },
    async handleRegister() {
      this.loading = true;
      this.message = null;

      try {
        const formData = new FormData();
        formData.append('nom', this.nom);
        formData.append('prenom', this.prenom);
        formData.append('login', this.login);
        formData.append('email', this.email);
        formData.append('password', this.password);
        formData.append('codeFamille', this.codeFamille);
        if (this.photo) {
          formData.append('photo', this.photo);
        }
        await authService.register(formData);
        this.message = {
          type: 'success',
          text: 'Inscription réussie ! Vérifiez votre mail pour valider votre compte.'
        };
      } catch (error) {
        console.error('Erreur lors de l\'inscription:', error, error.response?.data);
        this.message = {
          type: 'error',
          text: error.response?.data?.message || 'Erreur lors de l\'inscription'
        };
        this.$nextTick(() => {
          const alert = document.querySelector('.alert-error');
          if (alert) alert.scrollIntoView({ behavior: 'smooth' });
        });
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
  background: linear-gradient(120deg, #e8f4f8 60%, #f5f5f5 100%);
  padding: 0;
  gap: 20px;
}

.register-image {
  height: 540px;
  width: 280px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 30px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(44, 80, 56, 0.10);
}
.register-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 30px;
}
@media (max-width: 1100px) {
  .register-image { display: none; }
}

.register-card-modern {
  background: white;
  padding: 48px 40px 40px 40px;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(44, 80, 56, 0.13);
  width: 100%;
  max-width: 480px;
  min-width: 340px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h2 {
  text-align: center;
  color: #006d77;
  margin-bottom: 30px;
  font-size: 2rem;
  line-height: 1.3;
  font-weight: 700;
}

.register-form-modern {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.form-row {
  display: flex;
  gap: 18px;
  margin-bottom: 12px;
}
.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}
label {
  margin-bottom: 7px;
  color: #2c3e50;
  font-weight: 500;
  font-size: 1rem;
}
input[type="text"],
input[type="email"],
input[type="password"],
input[type="file"],
textarea,
select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  margin-top: 2px;
  box-sizing: border-box;
  background: #f8fafc;
  transition: border 0.2s;
}
input:focus {
  border: 1.5px solid #42b983;
  outline: none;
}
button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(90deg, #42b983 60%, #2c5038 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 18px;
  box-shadow: 0 2px 8px rgba(44, 80, 56, 0.08);
}
button:hover {
  background: linear-gradient(90deg, #3aa876 60%, #2c5038 100%);
}
button:disabled {
  background: #a8a8a8;
  cursor: not-allowed;
}
.login-link {
  text-align: center;
  margin-top: 22px;
  font-size: 1rem;
}
.login-link a {
  color: #42b983;
  text-decoration: none;
  font-weight: 500;
}
.alert {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1rem;
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
@media (max-width: 900px) {
  .register-container {
    flex-direction: column;
    padding: 18px 0;
  }
  .register-image {
    display: none;
  }
  .register-card-modern {
    border-radius: 18px;
    min-width: unset;
    max-width: 98vw;
    padding: 28px 8px 28px 8px;
  }
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
@media (max-width: 600px) {
  .register-card-modern {
    padding: 14px 2px 14px 2px;
    min-width: unset;
  }
  h2 {
    font-size: 1.2rem;
    margin-bottom: 14px;
  }
  .form-group label {
    font-size: 0.95rem;
  }
  .form-row {
    margin-bottom: 6px;
  }
  button {
    font-size: 0.95rem;
    padding: 10px;
  }
}
</style>
