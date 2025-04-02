const sequelize = require('../config/database');
const ActiviteUtilisateur = require('../models/activiteUtilisateur')(sequelize);

// Récupérer toutes les activités
exports.getAllActivites = async (req, res) => {
  try {
    const activites = await ActiviteUtilisateur.findAll();
    res.status(200).json(activites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des activités' });
  }
};

// Récupérer une activité par ID
exports.getActiviteById = async (req, res) => {
  const { id } = req.params;
  try {
    const activite = await ActiviteUtilisateur.findByPk(id);
    if (activite) {
      res.status(200).json(activite);
    } else {
      res.status(404).json({ message: 'Activité non trouvée' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'activité' });
  }
};

// Créer une nouvelle activité
exports.createActivite = async (req, res) => {
  try {
    const nouvelleActivite = await ActiviteUtilisateur.create(req.body);
    res.status(201).json(nouvelleActivite);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la création de l\'activité' });
  }
};

// Mettre à jour une activité
exports.updateActivite = async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await ActiviteUtilisateur.update(req.body, {
      where: { id: id }
    });
    if (updated) {
      const updatedActivite = await ActiviteUtilisateur.findByPk(id);
      res.status(200).json(updatedActivite);
    } else {
      res.status(404).json({ message: 'Activité non trouvée' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'activité' });
  }
};

// Supprimer une activité
exports.deleteActivite = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await ActiviteUtilisateur.destroy({
      where: { id: id }
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Activité non trouvée' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'activité' });
  }
}; 