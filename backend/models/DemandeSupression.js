const mongoose = require('mongoose');

const demandeSuppressionSchema = new mongoose.Schema({
    objet: { type: mongoose.Schema.Types.ObjectId, ref: 'ObjetCuisine', required: true },
    motif: String,
    demandeur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DemandeSuppression', demandeSuppressionSchema);
