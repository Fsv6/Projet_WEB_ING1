// Middleware pour vérifier si l'utilisateur est un administrateur
exports.isAdmin = (req, res, next) => {
    // Vérifier si l'utilisateur est connecté et a le rôle 'admin'
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    // Si non admin, renvoyer une erreur 403 (Forbidden)
    return res.status(403).json({ message: "Accès non autorisé. Seuls les administrateurs peuvent effectuer cette action." });
}; 