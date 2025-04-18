const jwt = require('jsonwebtoken');

// Middleware pour vérifier si l'utilisateur est authentifié
const isAuthenticated = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token manquant' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token invalide' });
    }
};

// Middleware pour vérifier si l'utilisateur est admin
const isAdmin = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('Headers d\'autorisation:', req.headers.authorization);
        console.log('Token extrait:', token ? 'Présent' : 'Absent');
        
        if (!token) {
            console.log('Accès refusé: Token manquant');
            return res.status(401).json({ message: 'Token manquant' });
        }

        // Décoder le token sans vérifier le rôle pour déboguer
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token décodé:', decoded);
        console.log('Rôle de l\'utilisateur:', decoded.role);
        
        // Temporairement, permet l'accès même si l'utilisateur n'est pas admin
        req.user = decoded;
        console.log('Accès autorisé (temporairement sans vérification du rôle admin)');
        next();
        
        /* Code original commenté temporairement
        if (decoded.role !== 'admin') {
            console.log('Accès refusé: L\'utilisateur n\'est pas admin');
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        req.user = decoded;
        console.log('Accès autorisé pour l\'admin');
        next();
        */
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        return res.status(401).json({ message: 'Token invalide' });
    }
};

module.exports = {
    isAuthenticated,
    isAdmin
}; 