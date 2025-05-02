const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Personne = require('../models/Personne');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const hashed = await bcrypt.hash("admin123", 10);
        const user = await User.create({
            personne: "6803aa9a63bb20fba91e5474", // ID de Lucas Dupont
            login: "admin",
            email: "benabdelazizsow@gmail.com",
            password: hashed,
            role: "admin",
            niveau: "expert",
            isValidated: true
        });
        console.log("✅ Administrateur ajouté :", user);
    } catch (error) {
        console.error("❌ Erreur:", error);
    } finally {
        mongoose.disconnect();
    }
});
