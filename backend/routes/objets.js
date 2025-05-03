const express = require('express');
const router = express.Router();
const ObjetCuisine = require('../models/ObjetConnecte');
const DemandeSuppression = require('../models/DemandeSupression');
const { authenticate, authorizeRoles } = require('../middleware/auth');


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

    champsAMettreAJour.forEach(champ => {
      if (req.body[champ] !== undefined) {
        objet[champ] = req.body[champ];
      }
    });

    await objet.save();
    res.json({ message: 'Objet mis à jour', objet });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

// PUT : contrôle simple d'objet (température/mode/statut uniquement)
router.put('/:id/control', authenticate, authorizeRoles('complexe', 'admin'), async (req, res) => {
  try {
    const { temperatureCible, mode, statut } = req.body;
    const objet = await ObjetCuisine.findById(req.params.id);
    if (!objet) return res.status(404).json({ error: 'Objet non trouvé' });

    objet.temperatureCible = temperatureCible;
    objet.mode = mode;
    objet.statut = statut;

    await objet.save();
    res.json({ message: 'Objet mis à jour avec succès', objet });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

// DELETE objet (admin uniquement - à ajouter si besoin)
router.delete('/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    await ObjetCuisine.findByIdAndDelete(req.params.id);
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

module.exports = router;
