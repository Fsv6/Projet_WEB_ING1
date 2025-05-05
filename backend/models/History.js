const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            // Utilisateurs
            'connexion',
            'deconnexion',
            'creation_utilisateur',
            'modification_utilisateur',
            'suppression_utilisateur',
            'validation_compte',
            'ajout_points',
            'upgrade_niveau',
            // Familles
            'creation_famille',
            'modification_famille',
            'suppression_famille',
            'ajout_membre_famille',
            'retrait_membre_famille',
            // Recettes
            'creation_recette',
            'modification_recette',
            'suppression_recette',
            'notation_recette',
            'commentaire_recette',
            'consultation_recette',
            // Objets/Ingrédients
            'creation_objet',
            'modification_objet',
            'suppression_objet',
            'utilisation_objet'
        ]
    },
    date: {
        type: Date,
        default: Date.now
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
        // Validation spécifique pour l'action utilisation_objet
        validate: {
            validator: function(details) {
                if (this.action === 'utilisation_objet') {
                    return details.objetId && details.duree !== undefined;
                }
                return true;
            },
            message: 'Les détails de l\'utilisation d\'un objet doivent inclure l\'ID de l\'objet et la durée'
        }
    },
    ip: {
        type: String
    },
    userAgent: {
        type: String
    }
});

// Index pour améliorer les performances des requêtes
historySchema.index({ user: 1, date: -1 });
historySchema.index({ action: 1, date: -1 });

module.exports = mongoose.model('History', historySchema);