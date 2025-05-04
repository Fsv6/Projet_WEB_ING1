const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const Utilisateur = require('../models/utilisateur')(sequelize);

// Login
exports.login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    
    // Vérifier si l'utilisateur existe
    const utilisateur = await Utilisateur.findOne({ where: { email } });
    if (!utilisateur) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe hashé
    const validPassword = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: utilisateur.id, 
        email: utilisateur.email,
        role: utilisateur.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      utilisateur: {
        id: utilisateur.id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        role: utilisateur.role
      }
    });
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
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

// Register
exports.register = async (req, res) => {
  try {
    const { email, mot_de_passe, nom, prenom, nom_utilisateur } = req.body;

    // Vérifier si l'email existe déjà
    const existingUtilisateur = await Utilisateur.findOne({ where: { email } });
    if (existingUtilisateur) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Calcul automatique du niveau et du rôle selon les points (par défaut 0)
    const points = req.body.points || 0;
    const { niveau, role } = updateUserNiveauAndRole(points);

    // Créer l'utilisateur
    const utilisateur = await Utilisateur.create({
      email,
      mot_de_passe: hashedPassword,
      nom,
      prenom,
      nom_utilisateur,
      points,
      role,
      niveau
    });

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: utilisateur.id, 
        email: utilisateur.email,
        role: utilisateur.role,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      utilisateur: {
        id: utilisateur.id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        role: utilisateur.role,
        niveau: utilisateur.niveau,
        points: utilisateur.points
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}; 