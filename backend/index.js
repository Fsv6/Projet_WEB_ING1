require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Import de la connexion à la base de données
const sequelize = require('./config/database');

// Import des modèles
const Utilisateur = require('./models/utilisateur')(sequelize);
const Piece = require('./models/piece')(sequelize);
const ObjetConnecte = require('./models/objetConnecte')(sequelize);
const DonneeObjet = require('./models/donneeObjet')(sequelize);
const Incident = require('./models/incident')(sequelize);
const ActiviteUtilisateur = require('./models/activiteUtilisateur')(sequelize);

// Initialisation des associations
Object.values(sequelize.models).forEach(model => {
    if (model.associate) {
        model.associate(sequelize.models);
    }
});

// Middleware pour gérer les CORS (Cross-Origin Resource Sharing)
// Permet à votre front-end (Vue.js) d'accéder à l'API Node.js
app.use(cors());

// Middleware pour parser le corps des requêtes en JSON
// Permet de lire les données envoyées par le front-end au format JSON
app.use(express.json());

// Import des routes
const utilisateurRoutes = require('./routes/utilisateurRoutes');
const objetConnecteRoutes = require('./routes/objetConnecteRoutes');
const activiteRoutes = require('./routes/activiteRoutes'); // Ajout des routes pour l'activité
const authRoutes = require('./routes/authRoutes');

// Middleware pour logger les requêtes (utile pour le débogage)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`); // Affiche la méthode HTTP et l'URL de la requête
    next(); // Passe au middleware suivant
});

// Utilisation des routes
app.use('/api/utilisateurs', utilisateurRoutes); // Préfixe toutes les routes utilisateur par /api/utilisateurs
app.use('/api/objets', objetConnecteRoutes); // Préfixe toutes les routes objet connecté par /api/objets
app.use('/api/activites', activiteRoutes); // Préfixe toutes les routes d'activité par /api/activites
app.use('/api/auth', authRoutes);

// Route de test pour vérifier que l'API fonctionne
app.get('/', (req, res) => {
    res.send('API Node.js fonctionne !');
});

// Synchronisation de la base de données (ATTENTION : à utiliser avec précaution en production)
sequelize.sync({ force: false }) // Met à jour la base de données si elle existe déjà
    .then(() => {
        console.log('Base de données synchronisée !');
    })
    .catch(err => {
        console.error('Erreur lors de la synchronisation de la base de données :', err);
    });

// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});
