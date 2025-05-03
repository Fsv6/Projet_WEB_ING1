const express = require('express');
const router = express.Router();
const History = require('../models/History');
const auth = require('../middleware/auth').authenticate;
const isAdmin = require('../middleware/isAdmin');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Récupérer tout l'historique (admin uniquement)
router.get('/', [auth, isAdmin], async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 7; // Limité à 7 éléments par page par défaut
        const skip = (page - 1) * limit;

        // Paramètres de recherche et filtre
        const searchTerm = req.query.search || '';
        const familleId = req.query.familleId || '';

        // Construction du filtre
        let filter = {};

        // Filtre par famille
        if (familleId) {
            try {
                // Utiliser familleId comme chaîne pour la recherche dans details.familleId
                const objectId = new ObjectId(familleId);

                // Essayer de rechercher par ID et par code
                filter.$or = filter.$or || [];
                filter.$or.push(
                    { 'details.familleId': objectId },
                    { 'details.familleId': familleId }
                );

                console.log("Filtrage par famille :", objectId, familleId);
            } catch (error) {
                console.error('ID de famille invalide:', error);
                // Si l'ID est invalide, essayer de filtrer par code famille
                filter['details.codeFamille'] = familleId;
            }
        }

        // Recherche
        if (searchTerm) {
            // Créer une expression régulière pour la recherche insensible à la casse
            const regex = new RegExp(searchTerm, 'i');

            // Rechercher dans différents champs pertinents
            filter.$or = [
                { action: regex },
                { 'details.codeFamille': regex },
                { 'details.nom': regex },
                { 'details.prenom': regex },
                { 'details.login': regex }
            ];
        }

        const histories = await History.find(filter)
            .populate('user', 'email photo')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const total = await History.countDocuments(filter);
        const pages = Math.ceil(total / limit);

        res.json({
            histories,
            pagination: {
                current: page,
                pages,
                total
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Récupérer l'historique d'un utilisateur spécifique
router.get('/user/:userId', [auth, isAdmin], async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 7; // Limité à 7 éléments par page
        const skip = (page - 1) * limit;

        const histories = await History.find({ user: userId })
            .populate('user', 'email photo')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const total = await History.countDocuments({ user: userId });
        const pages = Math.ceil(total / limit);

        res.json({
            histories,
            pagination: {
                current: page,
                pages,
                total
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Récupérer les familles disponibles pour le filtrage
router.get('/familles', [auth, isAdmin], async (req, res) => {
    try {
        // Trouver les entrées d'historique distinctes liées aux familles
        const familles = await History.aggregate([
            // Filtrer les actions liées aux familles
            { $match: {
                    action: {
                        $in: [
                            'creation_famille',
                            'modification_famille',
                            'suppression_famille',
                            'ajout_membre_famille',
                            'retrait_membre_famille'
                        ]
                    },
                    'details.familleId': { $exists: true }
                }},
            // Grouper par ID de famille
            { $group: {
                    _id: '$details.familleId',
                    codeFamille: { $first: '$details.codeFamille' }
                }},
            // Projeter les champs souhaités
            { $project: {
                    _id: 1,
                    codeFamille: 1
                }}
        ]);

        res.json({ familles });
    } catch (error) {
        console.error('Erreur lors de la récupération des familles pour le filtrage:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;