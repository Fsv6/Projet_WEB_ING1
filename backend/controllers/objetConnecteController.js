const sequelize = require('../config/database');
const ObjetConnecte = require('../models/ObjetConnecte')(sequelize);

// Récupérer tous les objets connectés
exports.getAllObjetsConnectes = async (req, res) => {
  try {
    const objets = await ObjetConnecte.findAll();
    res.status(200).json(objets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des objets connectés' });
  }
};

// Récupérer un objet connecté par ID
exports.getObjetConnecteById = async (req, res) => {
  const { id } = req.params;
  try {
    const objet = await ObjetConnecte.findByPk(id);
    if (objet) {
      res.status(200).json(objet);
    } else {
      res.status(404).json({ message: 'Objet connecté non trouvé' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'objet connecté' });
  }
};

// Créer un nouvel objet connecté
exports.createObjetConnecte = async (req, res) => {
  try {
    const nouvelObjet = await ObjetConnecte.create(req.body);
    res.status(201).json(nouvelObjet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la création de l\'objet connecté' });
  }
};

// Mettre à jour un objet connecté
exports.updateObjetConnecte = async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await ObjetConnecte.update(req.body, {
      where: { id: id }
    });
    if (updated) {
      const updatedObjet = await ObjetConnecte.findByPk(id);
      res.status(200).json(updatedObjet);
    } else {
      res.status(404).json({ message: 'Objet connecté non trouvé' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'objet connecté' });
  }
};

// Supprimer un objet connecté
exports.deleteObjetConnecte = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await ObjetConnecte.destroy({
      where: { id: id }
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Objet connecté non trouvé' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'objet connecté' });
  }
}; 