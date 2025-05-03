const express = require('express');
const router = express.Router();
const Recette = require('../models/Recette');
const { authenticate } = require('../middleware/auth');
const authorizeRecipeOwnerOrAdmin = require('../middleware/authorizeRecipeOwnerOrAdmin');

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
router.get('/:id', async (req, res) => {
  try {
    const recette = await Recette.findById(req.params.id)
        .populate('objetsUtilises')
        .populate('auteur', 'login');

    if (!recette) return res.status(404).json({ error: 'Recette non trouvée' });
    res.json(recette);
  } catch (err) {
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
      auteur: req.user._id$
    }

    const recette = new Recette(recetteData);
    await recette.save();
    res.status(201).json(recette);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✏️ PUT mise à jour (auteur uniquement ou admin)
router.put('/:id', authenticate, authorizeRecipeOwnerOrAdmin, async (req, res) => {
  try {
    const updated = await Recette.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 🗑️ DELETE recette (auteur uniquement ou admin)
router.delete('/:id', authenticate, authorizeRecipeOwnerOrAdmin, async (req, res) => {
  try {
    await Recette.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recette supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
