const mongoose = require('mongoose');

const familleSchema = new mongoose.Schema({
    codeFamille: { type: String, required: true, unique: true },
    membres: [
        {
            personne: { type: mongoose.Schema.Types.ObjectId, ref: 'Personne' },
            typeMembre: { type: String, enum: ['père', 'mère', 'enfant', 'autre'], required: false }
        }
    ]
});

module.exports = mongoose.model('Famille', familleSchema);
