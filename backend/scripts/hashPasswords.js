const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const Utilisateur = require('../models/utilisateur')(sequelize);

async function hashExistingPasswords() {
  try {
    // Récupérer tous les utilisateurs
    const utilisateurs = await Utilisateur.findAll();
    
    // Pour chaque utilisateur
    for (const utilisateur of utilisateurs) {
      // Hasher le mot de passe s'il n'est pas déjà hashé
      if (!utilisateur.mot_de_passe.startsWith('$2')) {
        const hashedPassword = await bcrypt.hash(utilisateur.mot_de_passe, 10);
        await utilisateur.update({ mot_de_passe: hashedPassword });
        console.log(`Mot de passe hashé pour l'utilisateur: ${utilisateur.email}`);
      }
    }
    
    console.log('Tous les mots de passe ont été hashés avec succès !');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors du hashage des mots de passe:', err);
    process.exit(1);
  }
}

// Exécuter le script
hashExistingPasswords(); 