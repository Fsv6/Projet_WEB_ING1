const mongoose = require('mongoose');

const objetCuisineSchema = new mongoose.Schema({
    nom: String, // "Four principal", "Mixeur Pro"
    description: String,
    type: String, // "Four", "Robot", "Plaque", etc.
    marque: String,
    model: String,
    mode: String, // "Éco", "Rapide", etc.
    connectivite: String, // "Wi-Fi", "Bluetooth"
    batterie: Number, // pour appareils sans fil
    statut: { type: String, enum: ['Actif', 'Inactif'], default: 'Actif' },
    temperatureActuelle: Number,
    temperatureCible: {
        type: Number,
        default: 0
    },

    modesDisponibles: {
        type: [String],
        default: []
    },
    piece: { type: String, default: "Cuisine" },
    derniereInteraction: Date,

    niveauDanger: {
        type: String,
        enum: ['faible', 'élevé'],
        default: 'élevé'
    },
    supporteTemperature: {
        type: Boolean,
        default: false
    },
    supporteMode: {
        type: Boolean,
        default: true
    }

});

module.exports = mongoose.model('ObjetCuisine', objetCuisineSchema, 'objets');
