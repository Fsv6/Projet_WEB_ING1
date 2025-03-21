const express = require('express');
const router = express.Router();
const objetConnecteController = require('../controllers/objetConnecteController');

// Routes pour les objets connectés
router.get('/', objetConnecteController.getAllObjetsConnectes);
router.get('/:id', objetConnecteController.getObjetConnecteById);
router.post('/', objetConnecteController.createObjetConnecte);
router.put('/:id', objetConnecteController.updateObjetConnecte);
router.delete('/:id', objetConnecteController.deleteObjetConnecte);

module.exports = router; 