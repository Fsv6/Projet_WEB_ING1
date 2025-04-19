/* eslint-disable no-useless-catch */
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const authService = {
  async login(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
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
      const response = await axios.post(`${API_BASE_URL}/register`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async validate(token) {
    try {
      const response = await axios.get(`${API_BASE_URL}/validate?token=${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};


export default authService;