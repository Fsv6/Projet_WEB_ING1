const mongoose = require('mongoose');

const familleSchema = new mongoose.Schema({
    codeFamille: { type: String, required: true, unique: true },
    nom: { type: String, default: '' },
    description: { type: String, default: '' },
    membres: [
        {
            personne: { type: mongoose.Schema.Types.ObjectId, ref: 'Personne' },
            typeMembre: { type: String, enum: ['père', 'mère', 'enfant', 'autre'], required: false }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Famille', familleSchema);
