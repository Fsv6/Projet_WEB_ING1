const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    console.log('⭕ Middleware d\'authentification activé');

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ Pas de token ou format incorrect:', authHeader);
        return res.status(401).json({ message: 'Accès refusé : token manquant ou invalide' });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 Token reçu:', token.substring(0, 15) + '...');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token vérifié, contenu:', decoded);
        
        // Important: nous devons avoir l'ID utilisateur pour accéder aux routes protégées
        if (!decoded.id) {
            console.log('❌ Pas d\'ID utilisateur dans le token:', decoded);
            return res.status(403).json({ message: 'Token invalide: informations manquantes' });
        }
        
        req.user = decoded;
        next();
    } catch (err) {
        console.log('❌ Erreur de vérification du token:', err.message);
        return res.status(403).json({ message: 'Token invalide' });
    }
};
