const Recette = require('../models/Recette')

module.exports = async (req, res, next) => {
    try {
        const recette = await Recette.findById(req.params.id)
        if (!recette) return res.status(404).json({ message: 'Recette non trouvée' })

        // Autorisé si auteur ou admin
        if (recette.auteur.toString() === req.user.id || req.user.role === 'admin') {
            return next()
        }

        return res.status(403).json({ message: 'Accès interdit' })
    } catch (err) {
        return res.status(500).json({ message: 'Erreur serveur' })
    }
}
