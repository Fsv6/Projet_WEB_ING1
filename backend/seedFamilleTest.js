const mongoose = require('mongoose');
require('dotenv').config();

const Personne = require('./models/Personne');
const Famille = require('./models/Famille');

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB");

    // 👤 Créer les 5 personnes
    const personnes = await Personne.insertMany([
        {
            nom: 'Dupont',
            prenom: 'Jean',
            dateNaissance: new Date('1980-01-01'),
            genre: 'Homme'
        },
        {
            nom: 'Dupont',
            prenom: 'Julie',
            dateNaissance: new Date('1982-05-12'),
            genre: 'Femme'
        },
        {
            nom: 'Dupont',
            prenom: 'Lucas',
            dateNaissance: new Date('2008-04-21'),
            genre: 'Homme'
        },
        {
            nom: 'Dupont',
            prenom: 'Emma',
            dateNaissance: new Date('2011-07-30'),
            genre: 'Femme'
        },
        {
            nom: 'Moreau',
            prenom: 'Léa',
            dateNaissance: new Date('2006-10-15'),
            genre: 'Femme'
        }
    ]);

    // 🏠 Créer la famille avec le code "DUPONT2024"
    const famille = new Famille({
        codeFamille: 'DUPONT2024',
        membres: [
            { personne: personnes[0]._id, typeMembre: 'père' },
            { personne: personnes[1]._id, typeMembre: 'mère' },
            { personne: personnes[2]._id, typeMembre: 'enfant' },
            { personne: personnes[3]._id, typeMembre: 'enfant' },
            { personne: personnes[4]._id, typeMembre: 'autre' } // cousine
        ]
    });

    await famille.save();

    console.log("🎉 Famille et membres enregistrés avec succès !");
    mongoose.disconnect();
}

seed();
