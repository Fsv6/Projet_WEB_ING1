const mongoose = require('mongoose');

const objetCuisineSchema = new mongoose.Schema({
    nom: String, // "Four principal", "Mixeur Pro"
    description: String,
    type: String, // "Four", "Robot", "Plaque", etc.
    marque: String,
    connectivite: String, // "Wi-Fi", "Bluetooth"
    batterie: Number, // pour appareils sans fil
    statut: { type: String, enum: ['Actif', 'Inactif'], default: 'Actif' },
    temperatureActuelle: Number,
    temperatureCible: Number,
    mode: String, // Ex : "Grill", "Vapeur"
    piece: { type: String, default: "Cuisine" },
    derniereInteraction: Date,
    manuel: { type: mongoose.Schema.Types.ObjectId, ref: 'Manuel' }
});

module.exports = mongoose.model('ObjetCuisine', objetCuisineSchema);
