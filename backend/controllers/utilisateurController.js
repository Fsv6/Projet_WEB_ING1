const sequelize = require('../config/database');
const Utilisateur = require('../models/utilisateur')(sequelize);

// Récupérer tous les utilisateurs
exports.getAllUtilisateurs = async (req, res) => {
  try {
    const utilisateurs = await Utilisateur.findAll();
    res.status(200).json(utilisateurs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
};

// Récupérer un utilisateur par ID
exports.getUtilisateurById = async (req, res) => {
  const { id } = req.params;
  try {
    const utilisateur = await Utilisateur.findByPk(id);
    if (utilisateur) {
      res.status(200).json(utilisateur);
    } else {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
  }
};

// Fonction pour mettre à jour le niveau et le rôle en fonction des points (alignée avec le frontend)
const updateUserNiveauAndRole = (points) => {
    let niveau = 'débutant';
    let role = 'simple';

    if (points >= 7) {
        niveau = 'expert';
        role = 'admin';
    } else if (points >= 5) {
        niveau = 'avancé';
        role = 'complexe';
    } else if (points >= 3) {
        niveau = 'intermédiaire';
        role = 'complexe';
    }

    return { niveau, role };
};

// Créer un nouvel utilisateur
exports.createUtilisateur = async (req, res) => {
  try {
    const points = req.body.points || 0;
    const { niveau, role } = updateUserNiveauAndRole(points);
    const nouvelUtilisateur = await Utilisateur.create({
      ...req.body,
      points,
      niveau,
      role
    });
    res.status(201).json(nouvelUtilisateur);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
  }
};

// Mettre à jour un utilisateur existant
exports.updateUtilisateur = async (req, res) => {
  const { id } = req.params;
  try {
    let updateData = { ...req.body };
    if (updateData.points !== undefined) {
      const { niveau, role } = updateUserNiveauAndRole(updateData.points);
      updateData.niveau = niveau;
      updateData.role = role;
    }
    const [updated] = await Utilisateur.update(updateData, {
      where: { id: id }
    });
    if (updated) {
      const updatedUtilisateur = await Utilisateur.findByPk(id);
      res.status(200).json(updatedUtilisateur);
    } else {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
};

// Supprimer un utilisateur
exports.deleteUtilisateur = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Utilisateur.destroy({
      where: { id: id }
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
  }
};
