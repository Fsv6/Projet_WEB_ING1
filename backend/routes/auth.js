const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const User = require('../models/User');
const Famille = require('../models/Famille');
const Personne = require('../models/Personne');

const router = express.Router();

require('dotenv').config(); // pour utiliser les variables d'env (comme JWT_SECRET)

// POST /api/register
router.post('/register', async (req, res) => {
    try {
        const { nom, prenom, email, login, password, codeFamille } = req.body;

        // 🔍 Étape 1 : trouver la famille par code
        const famille = await Famille.findOne({ codeFamille }).populate('membres.personne');
        if (!famille) {
            return res.status(404).json({ message: "Famille inconnue." });
        }

        // 🔍 Étape 2 : trouver la personne correspondante dans la famille
        const membreTrouve = famille.membres.find(m =>
            m.personne.nom.toLowerCase() === nom.toLowerCase() &&
            m.personne.prenom.toLowerCase() === prenom.toLowerCase()
        );

        if (!membreTrouve) {
            return res.status(403).json({ message: "Cette personne ne fait pas partie de la famille." });
        }

        const personne = membreTrouve.personne;

        // ❌ Étape 3 : vérifier si cette personne est déjà inscrite
        const dejaUtilisateur = await User.findOne({ personne: personne._id });
        if (dejaUtilisateur) {
            return res.status(409).json({ message: "Un compte existe déjà pour cette personne." });
        }

        const loginExistant = await User.findOne({ login });
        if (loginExistant) {
            return res.status(409).json({ message: "Ce nom d'utilisateur est déjà utilisé." });
        }


        // 🔐 Étape 4 : hash du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // 🔑 Étape 5 : création du token de validation email
        const token = jwt.sign(
            { personneId: personne._id, email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 🧍‍♂️ Étape 6 : création du compte utilisateur en base
        const newUser = new User({
            personne: personne._id,
            famille: famille ? famille._id : null,
            email,
            login,
            password: hashedPassword,
            isValidated: false
        });
        await newUser.save();

        // 📩 Étape 7 : envoi de l’email de validation
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FROM,
                pass: process.env.EMAIL_PASS
            }
        });

        const validationLink = `${process.env.FRONT_URL}/validation?token=${token}`;

        await transporter.sendMail({
            from: `"MaCuisineConnectée" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: "Validez votre inscription",
            html: `<p>Bonjour ${prenom},</p>
             <p>Merci de vous inscrire sur notre plateforme. Cliquez sur ce lien pour valider votre compte :</p>
             <a href="${validationLink}">${validationLink}</a>`
        });

        return res.status(201).json({ message: "Inscription en attente de validation par email." });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("➡️ Tentative de connexion :", email);

        const user = await User.findOne({ email });
        if (!user) {
            console.log("❌ Utilisateur introuvable");
            return res.status(400).json({ message: 'Utilisateur introuvable' });
        }

        console.log("✅ Utilisateur trouvé :", user.email);

        if (!user.isValidated) {
            console.log("❌ Compte non validé");
            return res.status(403).json({ message: 'Votre compte n’est pas encore activé' });
        }


        const isMatch = await bcrypt.compare(password, user.password);
        console.log("🔍 Résultat comparaison mdp :", isMatch);

        if (!isMatch) {
            console.log("❌ Mot de passe incorrect");
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log("✅ Token généré");
        res.status(200).json({ token, user });

    } catch (err) {
        console.error("🔥 Erreur serveur :", err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET /api/validate?token=...
router.get('/validate', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: "Token manquant." });
        }

        // 🧠 1. Vérification et décodage du token
        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Token invalide ou expiré." });
        }

        const { personneId, email } = payload;

        // 🔍 2. Trouver l’utilisateur correspondant
        const user = await User.findOne({ personne: personneId, email });
        if (!user) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }

        // ✅ 3. Mise à jour de l’état de validation
        if (user.isValidated) {
            return res.status(200).json({ message: "Compte déjà validé." });
        }

        user.isValidated = true;
        await user.save();

        return res.status(200).json({ message: "Compte validé avec succès !" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Erreur serveur pendant la validation." });
    }
});


module.exports = router;
