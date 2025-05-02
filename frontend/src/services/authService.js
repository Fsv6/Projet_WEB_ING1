/* eslint-disable no-useless-catch */
import api from './api'
import { useAuthStore } from '../stores/auth'


const authService = {
  async login(login, password) {
    try {
      const response = await api.post('/auth/login', {
        login,
        password
      });
      console.log('Réponse login:', response);
      
      // Stocker le token et l'utilisateur dans localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Appliquer le token à toutes les futures requêtes
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Mettre à jour le store d'authentification
      const user = response.data.user;
      const authStore = useAuthStore();
      console.log('Avant setAuth:', user);
      authStore.setAuth(user);
      console.log('Après setAuth:', authStore);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async validate(token) {
    try {
      const response = await api.get(`/auth/validate?token=${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default authService;