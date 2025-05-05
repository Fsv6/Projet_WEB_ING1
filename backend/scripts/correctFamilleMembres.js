// correctFamilleMembres.js
const mongoose = require('mongoose');
const Famille = require('../models/Famille');

mongoose.connect('mongodb://localhost:27017/your_database', { useNewUrlParser: true, useUnifiedTopology: true });

async function correctMembres() {
    const familles = await Famille.find();

    for (const famille of familles) {
        let updated = false;
        for (const membre of famille.membres) {
            if (!membre.typeMembre) {
                membre.typeMembre = 'autre'; // Valeur par défaut
                updated = true;
            }
        }

        if (updated) {
            await famille.save();
            console.log(`✅ Famille ${famille.codeFamille} mise à jour`);
        }
    }

    mongoose.disconnect();
}

correctMembres();
