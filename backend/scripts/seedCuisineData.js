const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const ObjetConnecte = require('../models/ObjetConnecte'); // nom du modèle MongoDB
const Recette = require('../models/Recette');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connecté'))
    .catch(err => console.error('Erreur de connexion MongoDB:', err));

async function seed() {
  try {
    await ObjetConnecte.deleteMany();
    await Recette.deleteMany();


    const objets = await ObjetConnecte.insertMany([
      {
        nom: 'Four Connecté',
        description: 'Four multifonction Wi-Fi',
        type: 'Four',
        marque: 'SmartBake',
        connectivite: 'Wi-Fi',
        batterie: null,
        statut: 'Actif',
        temperatureActuelle: 180,
        temperatureCible: 200,
        mode: null,
        derniereInteraction: new Date(),
        niveauDanger: 'élevé',
        supporteTemperature: true,
        supporteMode: false,
        modesDisponibles: null
      },
      {
        nom: 'Plaque à induction',
        description: 'Plaque 4 feux à commande tactile',
        type: 'Plaque',
        marque: 'CookTech',
        connectivite: 'Bluetooth',
        batterie: null,
        statut: 'Actif',
        temperatureActuelle: 90,
        temperatureCible: 100,
        mode: null,
        derniereInteraction: new Date(),
        niveauDanger: 'élevé',
        supporteTemperature: true,
        supporteMode: false,
        modesDisponibles: null
      },
      {
        nom: 'Lave-vaisselle connecté',
        description: 'Cycle programmable avec capteurs',
        type: 'Lave-vaisselle',
        marque: 'CleanWave',
        connectivite: 'Wi-Fi',
        batterie: null,
        statut: 'Actif',
        mode: 'Éco',
        supporteMode: true,
        modesDisponibles: ['Éco', 'Rapide', 'Intensif'],
        derniereInteraction: new Date(),
        niveauDanger: 'faible'
      },
      {
        nom: 'Cafetière connectée',
        description: 'Machine à café programmable à distance',
        type: 'Cafetière',
        marque: 'BeanPro',
        connectivite: 'Bluetooth',
        batterie: 65,
        statut: 'Actif',
        mode: 'Espresso',
        supporteMode: true,
        modesDisponibles: ['Espresso', 'Lungo', 'Cappuccino'],
        derniereInteraction: new Date(),
        niveauDanger: 'faible'
      }
      ,
      {
        nom: 'Hotte intelligente',
        description: 'Aspiration automatique avec détection de fumée',
        type: 'Hotte',
        marque: 'AirClean',
        connectivite: 'Wi-Fi',
        batterie: null,
        statut: 'Actif',
        mode: 'Auto',
        supporteMode: true,
        modesDisponibles: ['Auto', 'Boost', 'Silencieux'],
        derniereInteraction: new Date(),
        niveauDanger: 'faible'
      }

    ]);

    const recette1 = new Recette({
      titre: 'Gratin dauphinois',
      description: 'Recette classique de gratin avec cuisson au four',
      ingredients: ['pommes de terre', 'crème', 'lait', 'ail', 'beurre'],
      etapes: ['Préparer les pommes de terre', 'Assembler les ingrédients', 'Cuire au four'],
      objetsUtilises: [objets[0]._id] // Four Connecté
    });

    const recette2 = new Recette({
      titre: 'Café matinal',
      description: 'Un espresso parfait pour bien démarrer la journée',
      ingredients: ['eau', 'café moulu'],
      etapes: ['Allumer la cafetière', 'Lancer le programme Espresso'],
      objetsUtilises: [objets[3]._id] // Cafetière connectée
    });

    await recette1.save();
    await recette2.save();

    console.log('Données insérées avec succès !');
    process.exit();
  } catch (err) {
    console.error('Erreur lors du seed :', err);
    process.exit(1);
  }
}

seed();
