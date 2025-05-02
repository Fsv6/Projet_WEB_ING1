<template>
  <div class="validation-container">
    <h1>{{ message }}</h1>

    <button
        v-if="validationRéussie"
        @click="goToLogin"
        class="btn-retour"
    >
      Retour à la page de connexion
    </button>
  </div>
</template>

<script>
import authService from '../services/authService';

export default {
  name: 'ValidationView',
  data() {
    return {
      message: 'Validation en cours...',
      validationRéussie: false
    };
  },
  async mounted() {
    const token = this.$route.query.token;

    if (!token) {
      this.message = "Lien de validation invalide ou manquant.";
      return;
    }

    try {
      const response = await authService.validate(token);
      this.message = response.message;
      this.validationRéussie = true;
    } catch (err) {
      this.message = err.response?.data?.message || "Erreur pendant la validation du compte.";
    }
  },
  methods: {
    goToLogin() {
      this.$router.push('/login');
    }
  }
};
</script>


<style scoped>
.validation-container {
  text-align: center;
  margin-top: 100px;
}

.btn-retour {
  margin-top: 20px;
  padding: 12px 24px;
  background-color: #2e7d32;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-retour:hover {
  background-color: #1b5e20;
}
</style>
