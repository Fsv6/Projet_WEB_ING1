const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe hashé
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        login: user.login,
        role: user.role,
        niveau: user.niveau,
        points: user.points
      }
    });
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};

// Register
exports.register = async (req, res) => {
  try {
    const { email, mot_de_passe, nom, prenom, nom_utilisateur } = req.body;

    // Vérifier si l'email existe déjà
    const existingUtilisateur = await User.findOne({ email });
    if (existingUtilisateur) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Créer l'utilisateur
    const utilisateur = await User.create({
      email,
      password: hashedPassword,
      login: nom_utilisateur,
      role: 'simple',
      niveau: 'debutant'
    });

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: utilisateur._id, 
        email: utilisateur.email,
        role: utilisateur.role,
        login: utilisateur.login,
        niveau: utilisateur.niveau
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        _id: utilisateur._id,
        email: utilisateur.email,
        login: utilisateur.login,
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