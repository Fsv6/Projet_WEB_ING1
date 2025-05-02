const express = require('express');
const router = express.Router();
const ObjetCuisine = require('../models/ObjetConnecte');
require('../models/Manuel')

// GET all objets
router.get('/', async (req, res) => {
  try {
    const objets = await ObjetCuisine.find().populate('manuel');
    res.json(objets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one objet
router.get('/:id', async (req, res) => {
  try {
    const objet = await ObjetCuisine.findById(req.params.id).populate('manuel');
    if (!objet) return res.status(404).json({ error: 'Objet non trouvé' });
    res.json(objet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create objet
router.post('/', async (req, res) => {
  try {
    const newObjet = new ObjetCuisine(req.body);
    const saved = await newObjet.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update objet
router.put('/:id', async (req, res) => {
  try {
    const updated = await ObjetCuisine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE objet
router.delete('/:id', async (req, res) => {
  try {
    await ObjetCuisine.findByIdAndDelete(req.params.id);
    res.json({ message: 'Objet supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;