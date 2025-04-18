const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');
const Famille = require('../models/famille')(sequelize);
const Utilisateur = require('../models/utilisateur')(sequelize);
const authMiddleware = require('../middleware/authMiddleware');

// Obtenir toutes les familles (admin seulement)
router.get('/', authMiddleware.isAdmin, async (req, res) => {
    try {
        const familles = await Famille.findAll({
            include: [{
                model: Utilisateur,
                as: 'membres',
                attributes: ['id', 'nom', 'prenom', 'email']
            }]
        });
        res.json(familles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route simplifiée sans middleware d'authentification
router.get('/simples', async (req, res) => {
    try {
        console.log('Route /simples appelée');
        const familles = await Famille.findAll();
        console.log('Familles trouvées:', familles);
        res.json(familles);
    } catch (error) {
        console.error('Erreur récupération familles:', error);
        res.status(500).json({ message: error.message });
    }
});

// Créer une nouvelle famille (admin seulement)
router.post('/', authMiddleware.isAdmin, async (req, res) => {
    try {
        const { nom_famille, description } = req.body;
        const code_famille = await Famille.generateFamilyCode();
        
        const famille = await Famille.create({
            nom_famille,
            code_famille,
            description
        });
        
        res.status(201).json(famille);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Vérifier si un code famille existe
router.get('/verifier/:code', async (req, res) => {
    console.log('Requête reçue pour vérifier le code:', req.params.code);
    try {
        const famille = await Famille.findOne({
            where: { code_famille: req.params.code }
        });
        console.log('Résultat de la recherche:', famille);
        
        if (!famille) {
            console.log('Famille non trouvée');
            return res.status(404).json({ message: 'Code famille invalide' });
        }
        
        console.log('Famille trouvée, envoi de la réponse');
        res.json(famille);
    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        res.status(500).json({ message: error.message });
    }
});

// Obtenir les détails d'une famille spécifique (admin ou membre de la famille)
router.get('/:id', authMiddleware.isAuthenticated, async (req, res) => {
    try {
        const famille = await Famille.findByPk(req.params.id, {
            include: [{
                model: Utilisateur,
                as: 'membres',
                attributes: ['id', 'nom', 'prenom', 'email']
            }]
        });

        if (!famille) {
            return res.status(404).json({ message: 'Famille non trouvée' });
        }

        // Vérifier si l'utilisateur est admin ou membre de la famille
        if (!req.user.isAdmin && req.user.famille_id !== famille.id) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        res.json(famille);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 