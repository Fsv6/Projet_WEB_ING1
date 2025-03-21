// frontend/src/services/utilisateurService.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/utilisateurs'; // Remplacer tjrs ici par l'URL de votre API

const getAllUtilisateurs = () => {
  return axios.get(API_URL);
};

const getUtilisateurById = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

const createUtilisateur = (utilisateur) => {
  return axios.post(API_URL, utilisateur);
};

const updateUtilisateur = (id, utilisateur) => {
  return axios.put(`${API_URL}/${id}`, utilisateur);
};

const deleteUtilisateur = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};

export default {
  getAllUtilisateurs,
  getUtilisateurById,
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur
};
