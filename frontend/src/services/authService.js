import axios from 'axios';

// Création d'une instance axios avec la configuration de base
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000, // timeout après 5 secondes
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Gérer les erreurs d'authentification
      if (error.response.status === 401) {
        AuthService.logout();
        window.location.href = '/';
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject({ message: 'Erreur de connexion au serveur' });
  }
);

class AuthService {
  static async login(email, mot_de_passe) {
    try {
      const response = await api.post('/auth/login', { email, mot_de_passe });
      this._handleAuthResponse(response);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  static async register({ nom_utilisateur, email, nom, mot_de_passe }) {
    try {
      const response = await api.post('/auth/register', {
        nom_utilisateur,
        email,
        nom,
        mot_de_passe
      });
      this._handleAuthResponse(response);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Supprimer le token des headers pour les futures requêtes
    delete api.defaults.headers.common['Authorization'];
  }

  static isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    // Vérifier si le token est expiré
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  static getToken() {
    return localStorage.getItem('token');
  }

  static getUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  // Méthodes privées pour gérer la réponse et les erreurs
  static _handleAuthResponse(response) {
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.utilisateur));
      // Mettre à jour le token dans les headers
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
  }

  static _handleError(error) {
    if (error.message) {
      return {
        message: error.message,
        status: error.status || 500
      };
    }
    return {
      message: 'Une erreur est survenue',
      status: 500
    };
  }

  // Méthode pour rafraîchir le token si nécessaire
  static async refreshToken() {
    try {
      const response = await api.post('/auth/refresh-token');
      this._handleAuthResponse(response);
      return response.data;
    } catch (error) {
      this.logout();
      throw this._handleError(error);
    }
  }
}

export default AuthService; 