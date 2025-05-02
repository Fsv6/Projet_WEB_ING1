const mongoose = require('mongoose');

const personneSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    dateNaissance: { type: Date },
    genre: { type: String, enum: ['Homme', 'Femme', 'Autre'] }
});

module.exports = mongoose.model('Personne', personneSchema);
