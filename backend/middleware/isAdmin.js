// Middleware pour vérifier si l'utilisateur est un administrateur
module.exports = (req, res, next) => {
    try {
        // Vérifier si l'utilisateur existe dans la requête (ajouté par le middleware auth)
        if (!req.user) {
            return res.status(401).json({ message: "Non authentifié" });
        }

        // Vérifier si l'utilisateur est un administrateur
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès refusé. Droits d'administrateur requis." });
        }

        // Si tout est OK, passer au middleware suivant
        next();
    } catch (error) {
        res.status(401).json({ message: "Erreur lors de la vérification des droits d'administrateur" });
    }
}; 