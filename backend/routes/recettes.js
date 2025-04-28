const express = require('express');
const router = express.Router();
const Recette = require('../models/Recette');

// GET all recettes
router.get('/', async (req, res) => {
  try {
    const recettes = await Recette.find().populate('objetsUtilises');
    res.json(recettes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one recette
router.get('/:id', async (req, res) => {
  try {
    const recette = await Recette.findById(req.params.id).populate('objetsUtilises');
    if (!recette) return res.status(404).json({ error: 'Recette non trouvée' });
    res.json(recette);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create recette
router.post('/', async (req, res) => {
  try {
    const newRecette = new Recette(req.body);
    const saved = await newRecette.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update recette
router.put('/:id', async (req, res) => {
  try {
    const updated = await Recette.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE recette
router.delete('/:id', async (req, res) => {
  try {
    await Recette.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recette supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;