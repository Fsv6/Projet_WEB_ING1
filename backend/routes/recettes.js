const express = require('express');
const router = express.Router();
const Recette = require('../models/Recette');
const { authenticate } = require('../middleware/auth');
const authorizeRecipeOwnerOrAdmin = require('../middleware/authorizeRecipeOwnerOrAdmin');
const History = require('../models/History');

// 🔍 GET all recettes (publiques)
router.get('/', async (req, res) => {
  try {
    const recettes = await Recette.find()
        .populate('objetsUtilises')
        .populate('auteur', 'login'); // pour afficher qui a écrit chaque recette

    res.json(recettes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 GET one recette
router.get('/:id', authenticate, async (req, res) => {
  try {
    const recette = await Recette.findById(req.params.id)
        .populate('objetsUtilises')
        .populate('auteur', 'login');

    if (!recette) return res.status(404).json({ error: 'Recette non trouvée' });

    // Ajout de logs pour debug
    console.log('req.user dans GET /recettes/:id =', req.user);

    if (!req.user || !req.user.id) {
      console.error('Utilisateur non authentifié ou token mal formé');
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Log historique consultation
    await History.create({
      user: req.user.id,
      action: 'consultation_recette',
      details: { recetteId: recette._id, titre: recette.titre },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json(recette);
  } catch (err) {
    console.error('Erreur lors de la consultation de recette :', err);
    res.status(500).json({ error: err.message });
  }
});

// 🆕 POST nouvelle recette — nécessite authentification
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('DEBUG req.user =', req.user)
    const recetteData = {
      titre: req.body.titre,
      description: req.body.description,
      objetsUtilises: req.body.objetsUtilises || [],
      ingredients: req.body.ingredients || [],
      etapes: req.body.etapes || [],
      auteur: req.user.id
    }

    const recette = new Recette(recetteData);
    await recette.save();
    // Log historique création
    await History.create({
      user: req.user.id,
      action: 'creation_recette',
      details: { recetteId: recette._id, titre: recette.titre },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.status(201).json(recette);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✏️ PUT mise à jour (auteur uniquement ou admin)
router.put('/:id', authenticate, authorizeRecipeOwnerOrAdmin, async (req, res) => {
  try {
    const oldRecette = await Recette.findById(req.params.id);
    const updated = await Recette.findByIdAndUpdate(req.params.id, req.body, { new: true });
    // Log historique modification
    await History.create({
      user: req.user.id,
      action: 'modification_recette',
      details: { recetteId: updated._id, titre: updated.titre, oldValues: oldRecette, newValues: req.body },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 🗑️ DELETE recette (auteur uniquement ou admin)
router.delete('/:id', authenticate, authorizeRecipeOwnerOrAdmin, async (req, res) => {
  try {
    const recette = await Recette.findById(req.params.id);
    await Recette.findByIdAndDelete(req.params.id);
    // Log historique suppression
    await History.create({
      user: req.user.id,
      action: 'suppression_recette',
      details: { recetteId: recette._id, titre: recette.titre },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ message: 'Recette supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
