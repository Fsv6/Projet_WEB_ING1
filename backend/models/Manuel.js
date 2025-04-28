const mongoose = require('mongoose');

const manuelSchema = new mongoose.Schema({
    titre: String,
    contenu: String,
    fichierPDF: String,
    objetLie: { type: mongoose.Schema.Types.ObjectId, ref: 'ObjetCuisine' }
})

module.exports = mongoose.model('Manuel', manuelSchema)
