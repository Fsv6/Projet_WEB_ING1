const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('../models/user');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const hashed = await bcrypt.hash("123456", 10);
    const user = await User.create({
        username: "lucie",
        email: "lucie@email.com",
        password: hashed,
        role: "simple"
    });
    console.log("✅ Utilisateur ajouté :", user);
    mongoose.disconnect();
});
