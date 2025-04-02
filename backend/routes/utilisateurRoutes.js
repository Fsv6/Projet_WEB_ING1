
const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');

// Récupérer tous les utilisateurs
router.get('/', utilisateurController.getAllUtilisateurs);

// Récupérer un utilisateur par ID
router.get('/:id', utilisateurController.getUtilisateurById);

// Créer un nouvel utilisateur
router.post('/', utilisateurController.createUtilisateur);

// Mettre à jour un utilisateur existant
router.put('/:id', utilisateurController.updateUtilisateur);

// Supprimer un utilisateur
router.delete('/:id', utilisateurController.deleteUtilisateur);

module.exports = router;
