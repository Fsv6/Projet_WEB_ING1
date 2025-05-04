const express = require('express');
const router = express.Router();
const ObjetCuisine = require('../models/ObjetConnecte');
const DemandeSuppression = require('../models/DemandeSupression');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const History = require('../models/History');


// GET all objets
router.get('/', async (req, res) => {
  try {
    const objets = await ObjetCuisine.find();
    res.json(objets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET one objet
router.get('/:id', async (req, res) => {
  try {
    const objet = await ObjetCuisine.findById(req.params.id)
    if (!objet) return res.status(404).json({ error: 'Objet non trouvé' });
    res.json(objet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST : ajouter un objet (sécurisé)
router.post('/', authenticate, authorizeRoles('complexe', 'admin'), async (req, res) => {
  try {
    const objet = new ObjetCuisine(req.body);
    await objet.save();
    // Log historique
    await History.create({
      user: req.user.id,
      action: 'creation_objet',
      details: { objetId: objet._id, nom: objet.nom },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.status(201).json(objet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT : modifier un objet (complet)
router.put('/:id', authenticate, authorizeRoles('complexe', 'admin'), async (req, res) => {
  try {
    const objet = await ObjetCuisine.findById(req.params.id);
    if (!objet) return res.status(404).json({ error: 'Objet non trouvé' });
    const champsAMettreAJour = [
      'nom', 'description', 'type', 'marque', 'connectivite', 'statut',
      'niveauDanger', 'temperatureCible', 'mode',
      'supporteTemperature', 'supporteMode', 'modesDisponibles'
    ];
    const oldValues = {};
    champsAMettreAJour.forEach(champ => {
      if (req.body[champ] !== undefined) {
        oldValues[champ] = objet[champ];
        objet[champ] = req.body[champ];
      }
    });
    await objet.save();
    // Log historique
    await History.create({
      user: req.user.id,
      action: 'modification_objet',
      details: { objetId: objet._id, nom: objet.nom, oldValues, newValues: req.body },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ message: 'Objet mis à jour', objet });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

// PUT : contrôle simple d'objet (température/mode/statut uniquement)
router.put('/:id/control', authenticate, authorizeRoles('complexe', 'admin'), async (req, res) => {
  try {
    const { temperatureCible, mode, statut, duree } = req.body;
    const objet = await ObjetCuisine.findById(req.params.id);
    if (!objet) return res.status(404).json({ error: 'Objet non trouvé' });
    const oldValues = {
      temperatureCible: objet.temperatureCible,
      mode: objet.mode,
      statut: objet.statut
    };
    objet.temperatureCible = temperatureCible;
    objet.mode = mode;
    objet.statut = statut;
    await objet.save();
    // Log historique
    await History.create({
      user: req.user.id,
      action: 'utilisation_objet',
      details: { 
        objetId: objet._id, 
        nom: objet.nom, 
        oldValues, 
        newValues: req.body,
        duree: duree || 0 // Durée en minutes
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ message: 'Objet mis à jour avec succès', objet });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

// DELETE objet (admin uniquement)
router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const objet = await ObjetCuisine.findById(req.params.id);
    if (!objet) return res.status(404).json({ error: 'Objet non trouvé' });
    await ObjetCuisine.findByIdAndDelete(req.params.id);
    // Log historique
    await History.create({
      user: req.user.id,
      action: 'suppression_objet',
      details: { objetId: objet._id, nom: objet.nom },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ message: 'Objet supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST : demander suppression (accessible à utilisateurs connectés)
router.post('/:id/demande-suppression', authenticate, async (req, res) => {
  try {
    const objet = await ObjetCuisine.findById(req.params.id);
    if (!objet) return res.status(404).json({ message: 'Objet non trouvé' });

    const demande = new DemandeSuppression({
      objet: objet._id,
      motif: req.body.motif || '',
      demandeur: req.user.id
    });

    await demande.save();
    res.status(200).json({ message: 'Demande de suppression enregistrée.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : statistiques d'activité d'un objet
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const objet = await ObjetCuisine.findById(req.params.id);
    if (!objet) return res.status(404).json({ error: 'Objet non trouvé' });

    // Récupérer l'historique d'utilisation de l'objet
    const utilisations = await History.find({
      action: 'utilisation_objet',
      'details.objetId': objet._id.toString()
    }).populate({
      path: 'user',
      populate: {
        path: 'personne',
        select: 'nom prenom'
      }
    }).sort({ date: -1 });

    console.log(`Statistiques pour l'objet ${objet.nom}: ${utilisations.length} utilisations trouvées`);

    // Calculer les statistiques
    const stats = {
      totalUtilisations: utilisations.length,
      utilisateursUniques: new Set(utilisations.map(u => u.user?._id?.toString() || 'unknown')).size,
      tempsMoyen: 0,
      derniereUtilisation: utilisations.length > 0 ? utilisations[0].date : null,
      usageParMembre: [],
      usageParJour: Array(7).fill(0),
      usageParHeure: Array(24).fill(0)
    };

    // Calculer le temps moyen d'utilisation s'il est disponible
    if (utilisations.length > 0) {
      const totalDuree = utilisations.reduce((sum, utilisation) => {
        return sum + (utilisation.details?.duree || 0);
      }, 0);
      stats.tempsMoyen = Math.round(totalDuree / utilisations.length);
    }

    // Calculer l'utilisation par membre
    const usageParMembreMap = new Map();
    utilisations.forEach(utilisation => {
      if (!utilisation.user) return;
      
      const userId = utilisation.user._id.toString();
      const count = (usageParMembreMap.get(userId) || 0) + 1;
      usageParMembreMap.set(userId, count);
    });

    // Convertir en tableau avec les noms des utilisateurs
    for (const [userId, count] of usageParMembreMap.entries()) {
      try {
        const utilisationWithUser = utilisations.find(u => u.user && u.user._id.toString() === userId);
        
        if (utilisationWithUser && utilisationWithUser.user && utilisationWithUser.user.personne) {
          const personne = utilisationWithUser.user.personne;
          stats.usageParMembre.push({
            userId,
            nom: `${personne.prenom || ''} ${personne.nom || ''}`.trim() || 'Utilisateur',
            count
          });
        } else {
          stats.usageParMembre.push({
            userId,
            nom: 'Utilisateur inconnu',
            count
          });
        }
      } catch (err) {
        console.error(`Erreur lors du traitement de l'utilisateur ${userId}:`, err);
        stats.usageParMembre.push({
          userId,
          nom: 'Utilisateur inconnu',
          count
        });
      }
    }

    // Calculer l'utilisation par jour et par heure
    utilisations.forEach(utilisation => {
      try {
        const date = new Date(utilisation.date);
        const day = date.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
        const hour = date.getHours();
        
        if (day >= 0 && day < 7) stats.usageParJour[day]++;
        if (hour >= 0 && hour < 24) stats.usageParHeure[hour]++;
      } catch (err) {
        console.error(`Erreur lors du traitement de la date ${utilisation.date}:`, err);
      }
    });

    res.json(stats);
  } catch (err) {
    console.error(`Erreur lors de la récupération des statistiques:`, err);
    res.status(500).json({ error: err.message || 'Erreur interne du serveur' });
  }
});

// GET : historique détaillé d'un objet
router.get('/:id/history', authenticate, async (req, res) => {
  try {
    const objet = await ObjetCuisine.findById(req.params.id);
    if (!objet) return res.status(404).json({ error: 'Objet non trouvé' });

    // Récupérer l'historique d'utilisation de l'objet
    const utilisations = await History.find({
      action: 'utilisation_objet',
      'details.objetId': objet._id.toString()
    })
    .populate({
      path: 'user',
      populate: {
        path: 'personne',
        select: 'nom prenom'
      }
    })
    .sort({ date: -1 });

    console.log(`Historique pour l'objet ${objet.nom}: ${utilisations.length} utilisations trouvées`);

    // Transformer les données pour le frontend
    const history = utilisations.map(utilisation => {
      try {
        const user = utilisation.user || {};
        const personne = user.personne || {};
        
        return {
          _id: utilisation._id,
          date: utilisation.date,
          utilisateur: {
            _id: user._id || 'unknown',
            nom: personne.nom || '',
            prenom: personne.prenom || ''
          },
          duree: utilisation.details?.duree || 0,
          mode: utilisation.details?.newValues?.mode || '-',
          temperature: utilisation.details?.newValues?.temperatureCible || '-'
        };
      } catch (err) {
        console.error(`Erreur lors du traitement de l'utilisation ${utilisation._id}:`, err);
        return {
          _id: utilisation._id || 'unknown',
          date: utilisation.date || new Date(),
          utilisateur: { _id: 'unknown', nom: '', prenom: '' },
          duree: 0,
          mode: '-',
          temperature: '-'
        };
      }
    });

    res.json(history);
  } catch (err) {
    console.error(`Erreur lors de la récupération de l'historique:`, err);
    res.status(500).json({ error: err.message || 'Erreur interne du serveur' });
  }
});

// Route pour générer des données d'activité simulées (pour les tests)
router.post('/:id/generate-activity', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const objet = await ObjetCuisine.findById(req.params.id);
    if (!objet) return res.status(404).json({ error: 'Objet non trouvé' });

    const { count = 20 } = req.body;
    const limit = Math.min(count, 100); // Limiter à 100 entrées maximum

    // Récupérer quelques utilisateurs aléatoires pour les activités
    const User = require('../models/user');
    const users = await User.find().limit(10);
    
    if (users.length === 0) {
      return res.status(400).json({ error: 'Aucun utilisateur disponible pour générer des activités' });
    }

    // Générer des activités aléatoires
    const activities = [];
    const modes = objet.modesDisponibles && objet.modesDisponibles.length > 0 
      ? objet.modesDisponibles 
      : ['Standard', 'Éco', 'Intensif', 'Rapide'];
    const temperaturesRange = objet.supporteTemperature ? [20, 40, 60, 80, 100, 120, 150, 180, 200, 220, 250] : [];

    // Date de départ pour les activités (un mois en arrière)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    for (let i = 0; i < limit; i++) {
      // Choisir un utilisateur aléatoire
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      // Choisir une date aléatoire entre startDate et maintenant
      const activityDate = new Date(startDate.getTime() + Math.random() * (Date.now() - startDate.getTime()));
      
      // Valeurs aléatoires pour l'activité
      const mode = modes[Math.floor(Math.random() * modes.length)];
      const oldMode = modes[Math.floor(Math.random() * modes.length)];
      const temperature = objet.supporteTemperature 
        ? temperaturesRange[Math.floor(Math.random() * temperaturesRange.length)] 
        : null;
      const oldTemperature = objet.supporteTemperature 
        ? temperaturesRange[Math.floor(Math.random() * temperaturesRange.length)] 
        : null;
      const duree = Math.floor(Math.random() * 60) + 5; // Entre 5 et 65 minutes
      
      // Créer l'activité
      const activity = new History({
        user: randomUser._id,
        action: 'utilisation_objet',
        date: activityDate,
        details: {
          objetId: objet._id.toString(),
          nom: objet.nom,
          oldValues: {
            mode: oldMode,
            temperatureCible: oldTemperature,
            statut: 'Actif'
          },
          newValues: {
            mode: mode,
            temperatureCible: temperature,
            statut: 'Actif'
          },
          duree: duree
        },
        ip: '127.0.0.1',
        userAgent: 'Test Activity Generator'
      });
      
      await activity.save();
      activities.push(activity);
    }

    res.json({ 
      message: `${activities.length} activités générées avec succès pour l'objet ${objet.nom}`,
      count: activities.length
    });
  } catch (err) {
    console.error(`Erreur lors de la génération d'activités:`, err);
    res.status(500).json({ error: err.message || 'Erreur interne du serveur' });
  }
});

module.exports = router;
