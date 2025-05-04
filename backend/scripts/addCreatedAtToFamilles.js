const mongoose = require('mongoose');
const Famille = require('../models/Famille');
const config = require('../config/database');

async function addCreatedAtToFamilles() {
  await mongoose.connect(config.mongoURI || 'mongodb://localhost:27017/smartkitchen');
  const familles = await Famille.find({ createdAt: { $exists: false } });
  console.log(`Familles à mettre à jour : ${familles.length}`);
  for (const famille of familles) {
    famille.createdAt = new Date();
    await famille.save();
    console.log(`Famille ${famille.codeFamille} mise à jour avec createdAt.`);
  }
  await mongoose.disconnect();
  console.log('Migration terminée.');
}

addCreatedAtToFamilles().catch(err => {
  console.error('Erreur lors de la migration :', err);
  process.exit(1);
}); 