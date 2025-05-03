const mongoose = require('mongoose');

const recette = new mongoose.Schema({
    titre: String,
    description: String,
    ingredients: [String],
    etapes: [String],
    objetsUtilises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ObjetCuisine' }],
    noteMoyenne: { type: Number, default: 0 },
    dateCreation: { type: Date, default: Date.now },
    auteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Recette', recette);
