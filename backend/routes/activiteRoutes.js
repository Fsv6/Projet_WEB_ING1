const express = require('express');
const router = express.Router();
const activiteController = require('../controllers/activiteController');

// Routes pour les activités
router.get('/', activiteController.getAllActivites);
router.get('/:id', activiteController.getActiviteById);
router.post('/', activiteController.createActivite);
router.put('/:id', activiteController.updateActivite);
router.delete('/:id', activiteController.deleteActivite);

module.exports = router; 