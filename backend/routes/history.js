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
        const actionType = req.query.action || ''; // Nouveau paramètre pour filtrer par type d'action

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

        // Filtre par type d'action
        if (actionType) {
            filter.action = actionType;
            console.log("Filtrage par type d'action:", actionType);
        }

        // Recherche
        if (searchTerm) {
            // Créer une expression régulière pour la recherche insensible à la casse
            const regex = new RegExp(searchTerm, 'i');

            // Rechercher dans différents champs pertinents
            const searchFilter = [
                { action: regex },
                { 'details.codeFamille': regex },
                { 'details.nom': regex },
                { 'details.prenom': regex },
                { 'details.login': regex }
            ];

            // Si un filtre existe déjà, l'intégrer avec le filtre de recherche
            if (Object.keys(filter).length > 0) {
                filter = { $and: [filter, { $or: searchFilter }] };
            } else {
                filter.$or = searchFilter;
            }
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

// Logger une action dans l'historique (accessible à tout utilisateur connecté)
router.post('/', require('../middleware/auth').authenticate, async (req, res) => {
    try {
        const { action, details } = req.body;
        if (!action) return res.status(400).json({ message: "Action requise" });

        const History = require('../models/History');
        const historyEntry = new History({
            user: details?.userId || req.user.id,
            action,
            details: details || {},
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        await historyEntry.save();

        res.status(201).json({ message: "Action enregistrée" });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'action:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Récupérer les statistiques pour le tableau de bord d'administration
router.get('/admin-stats', [auth, isAdmin], async (req, res) => {
    try {
        // 1. Récupérer les utilisateurs
        const User = require('../models/user');
        const users = await User.find();

        // 2. Récupérer les familles
        const Famille = require('../models/Famille');
        const families = await Famille.find().populate('membres.personne');

        // 3. Récupérer l'historique (toutes les actions)
        const history = await History.find().sort({ date: -1 });

        // Date d'il y a une semaine pour les calculs
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Date d'aujourd'hui à minuit pour compter les actions du jour
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Analyser les actions de création d'utilisateur pour les nouveaux utilisateurs
        const newUsersActions = history.filter(
            h => h.action === 'creation_utilisateur' && new Date(h.date) >= oneWeekAgo
        ).length;

        // Compter les utilisateurs par niveau
        const usersByLevel = {
            'débutant': 0,
            'intermédiaire': 0,
            'avancé': 0,
            'expert': 0
        };
        
        users.forEach(user => {
            const niveau = user.niveau || 'débutant';
            if (usersByLevel[niveau] !== undefined) {
                usersByLevel[niveau]++;
            }
        });

        // Total des points et points distribués cette semaine
        const totalPoints = users.reduce((sum, user) => sum + (user.points || 0), 0);

        const pointsActions = history.filter(
            h => h.action === 'ajout_points' && new Date(h.date) >= oneWeekAgo
        );
        
        const pointsDistributed = pointsActions.reduce((sum, action) => {
            const montant = action.details?.montant || 0;
            return sum + montant;
        }, 0);

        // Familles avec des points
        const familiesWithPoints = families.filter(famille => {
            if (!famille.membres || !Array.isArray(famille.membres)) return false;
            
            const membreIds = famille.membres
                .filter(m => m.personne)
                .map(m => m.personne._id.toString());
            
            return users.some(user => 
                user.personne && 
                membreIds.includes(user.personne.toString()) && 
                user.points > 0
            );
        }).length;

        // Actions aujourd'hui
        const todayActions = history.filter(h => new Date(h.date) >= today).length;

        // Actions par jour et tranche horaire
        const actionsByDayTime = Array(7).fill().map(() => Array(3).fill(0));
        
        history.forEach(action => {
            const date = new Date(action.date);
            const day = date.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
            const hour = date.getHours();
            
            // Tranches horaires: 0-8h, 8-16h, 16-24h
            let timeSlot = 0;
            if (hour >= 8 && hour < 16) timeSlot = 1;
            else if (hour >= 16) timeSlot = 2;
            
            actionsByDayTime[day][timeSlot]++;
        });

        // Construire l'objet de statistiques
        const stats = {
            usersCount: users.length,
            newUsers: newUsersActions,
            familiesCount: families.length,
            activeWithPoints: familiesWithPoints,
            actionsCount: history.length,
            todayActions: todayActions,
            totalPoints: totalPoints,
            pointsDistributed: pointsDistributed,
            usersByLevel: usersByLevel,
            actionsByDayTime: actionsByDayTime
        };

        res.json(stats);
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques d\'administration:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Récupérer les statistiques pour le rapport d'administration
router.get('/admin-report', [auth, isAdmin], async (req, res) => {
    try {
        const periodDays = req.query.period || 30;
        let startDate = new Date();
        
        if (periodDays !== 'all') {
            startDate.setDate(startDate.getDate() - parseInt(periodDays));
        } else {
            startDate = new Date(0); // Date minimum pour "all"
        }

        // Récupérer les modèles et données nécessaires
        const User = require('../models/user');
        const Famille = require('../models/Famille');
        const Objet = require('../models/ObjetConnecte');

        const users = await User.find();
        const families = await Famille.find().populate('membres.personne');
        const objects = await Objet.find();
        const history = await History.find({ date: { $gte: startDate } }).sort({ date: -1 });

        // Analyser les données pour le rapport
        const usersStats = analyzeUsers(users, history, startDate);
        const objectsStats = analyzeObjects(objects, history, startDate);
        const familiesStats = analyzeFamilies(families, users, history, startDate);
        const activityStats = analyzeActivity(history);

        res.json({
            // Statistiques utilisateurs
            usersCount: usersStats.total,
            usersByLevel: usersStats.byLevel,
            newUsers: usersStats.new,
            activeUsers: usersStats.active,
            avgLoginsPerDay: usersStats.avgLoginsPerDay,
            
            // Statistiques objets
            objectsCount: objectsStats.total,
            objectsByType: objectsStats.byType,
            totalObjectsUsage: objectsStats.totalUsage,
            avgObjectsUsagePerDay: objectsStats.avgUsagePerDay,
            mostUsedObject: objectsStats.mostUsed,
            
            // Statistiques familles
            familiesCount: familiesStats.total,
            avgFamilySize: familiesStats.avgSize,
            familiesWithPoints: familiesStats.withPoints,
            totalPoints: familiesStats.totalPoints,
            avgPointsPerFamily: familiesStats.avgPointsPerFamily,
            recentPointsDistributed: familiesStats.recentPoints,
            
            // Statistiques activité
            actionsCount: activityStats.total,
            actionsByType: activityStats.byType,
            actionsByTime: activityStats.byTime
        });
    } catch (error) {
        console.error('Erreur lors de la génération du rapport:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Fonctions d'analyse de données pour le rapport
function analyzeUsers(users, history, startDate) {
    // Utilisateurs par niveau
    const byLevel = users.reduce((acc, user) => {
        const level = user.level || 'débutant';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {});
    
    // Utilisateurs créés dans la période
    const newUsers = users.filter(user => 
        user.createdAt && new Date(user.createdAt) >= startDate
    ).length;
    
    // Utilisateurs actifs (avec au moins une action)
    const activeUserIds = [...new Set(
        history.map(entry => entry.user ? entry.user.toString() : null).filter(Boolean)
    )];
    
    // Moyenne de connexions par jour
    const loginEntries = history.filter(entry => entry.action === 'connexion');
    const dayCount = Math.max(1, Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24)));
    
    return {
        total: users.length,
        byLevel,
        new: newUsers,
        active: activeUserIds.length,
        avgLoginsPerDay: loginEntries.length / dayCount
    };
}

function analyzeObjects(objects, history, startDate) {
    // Objets par type
    const byType = objects.reduce((acc, obj) => {
        const type = obj.type || 'Autre';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});
    
    // Utilisations des objets
    const objectUsages = history.filter(entry => 
        entry.action === 'utilisation_objet' && entry.details && entry.details.objetId
    );
    
    // Objet le plus utilisé
    const usageCountByObject = objectUsages.reduce((acc, entry) => {
        const objetId = entry.details.objetId.toString();
        acc[objetId] = (acc[objetId] || 0) + 1;
        return acc;
    }, {});
    
    let mostUsedObjectId = null;
    let maxUsage = 0;
    
    Object.entries(usageCountByObject).forEach(([objetId, count]) => {
        if (count > maxUsage) {
            mostUsedObjectId = objetId;
            maxUsage = count;
        }
    });
    
    const mostUsedObject = objects.find(obj => 
        obj._id.toString() === mostUsedObjectId
    );
    
    // Moyenne d'utilisation par jour
    const dayCount = Math.max(1, Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24)));
    
    return {
        total: objects.length,
        byType,
        totalUsage: objectUsages.length,
        avgUsagePerDay: objectUsages.length / dayCount,
        mostUsed: mostUsedObject ? mostUsedObject.nom : 'Aucun'
    };
}

function analyzeFamilies(families, users, history, startDate) {
    // Points distribués
    const pointsActions = history.filter(entry => 
        entry.action === 'ajout_points' && 
        entry.details && 
        entry.details.points
    );
    
    const totalPoints = pointsActions.reduce((sum, entry) => 
        sum + (parseFloat(entry.details.points) || 0), 0
    );
    
    // Familles avec points
    const familiesWithPoints = families.filter(family => 
        family.points && family.points > 0
    ).length;
    
    // Points distribués récemment
    const recentPoints = pointsActions.reduce((sum, entry) => 
        sum + (parseFloat(entry.details.points) || 0), 0
    );
    
    // Taille moyenne des familles
    const totalMembers = families.reduce((sum, family) => 
        sum + (family.membres ? family.membres.length : 0), 0
    );
    
    return {
        total: families.length,
        avgSize: families.length ? totalMembers / families.length : 0,
        withPoints: familiesWithPoints,
        totalPoints,
        avgPointsPerFamily: families.length ? totalPoints / families.length : 0,
        recentPoints
    };
}

function analyzeActivity(history) {
    // Répartition par type d'action
    const byType = history.reduce((acc, entry) => {
        const action = entry.action || 'autre';
        acc[action] = (acc[action] || 0) + 1;
        return acc;
    }, {});
    
    // Répartition par tranche horaire
    const byTime = history.reduce((acc, entry) => {
        const hour = new Date(entry.date).getHours();
        let timeSlot;
        
        if (hour >= 0 && hour < 8) {
            timeSlot = 'Matin (00h-08h)';
        } else if (hour >= 8 && hour < 16) {
            timeSlot = 'Journée (08h-16h)';
        } else {
            timeSlot = 'Soir (16h-00h)';
        }
        
        acc[timeSlot] = (acc[timeSlot] || 0) + 1;
        return acc;
    }, {});
    
    return {
        total: history.length,
        byType,
        byTime
    };
}

module.exports = router;