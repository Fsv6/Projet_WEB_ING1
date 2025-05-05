/* eslint-disable no-useless-catch */
import api from './api'


const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async register(userData) {
    try {
      let response;
      if (userData instanceof FormData) {
        response = await api.post('/auth/register', userData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post('/auth/register', userData);
      }
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

export const upgradeLevel = async (newLevel) => {
  return api.post('/users/upgrade', { newLevel });
};


export default authService;