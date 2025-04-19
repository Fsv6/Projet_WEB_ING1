const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes pour les paramètres d'apparence (accès administrateur uniquement)
router.get('/appearance', authMiddleware.isAuthenticated, authMiddleware.isAdmin, settingsController.getAppearanceSettings);
router.put('/appearance', authMiddleware.isAuthenticated, authMiddleware.isAdmin, settingsController.updateAppearanceSettings);

module.exports = router; 