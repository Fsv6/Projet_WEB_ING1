const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const upload = require('../middleware/upload');

const User = require('../models/User');
const Famille = require('../models/Famille');
const Personne = require('../models/Personne');
const History = require('../models/History');

const router = express.Router();

require('dotenv').config(); // pour utiliser les variables d'env (comme JWT_SECRET)

// POST /api/register
router.post('/register', upload.single('photo'), async (req, res) => {
    try {
        console.log("📝 INSCRIPTION - Données reçues:", req.body);
        const { nom, prenom, login, email, password, codeFamille } = req.body;
        console.log("📝 INSCRIPTION - Email extrait:", email);

        // 1. Vérifications de base
        if (!nom || !prenom || !login || !email || !password || !codeFamille) {
            console.log("❌ INSCRIPTION - Champs manquants");
            return res.status(400).json({
                success: false,
                message: "Tous les champs sont obligatoires."
            });
        }

        // 2. Vérifier si login ou email existe déjà
        const existingUser = await User.findOne({
            $or: [
                { email: email },
                { login: login }
            ]
        });

        if (existingUser) {
            console.log("❌ INSCRIPTION - Utilisateur existant:", existingUser.email, existingUser.login);
            return res.status(409).json({
                success: false,
                message: existingUser.email === email 
                    ? "Cet email est déjà utilisé." 
                    : "Ce nom d'utilisateur est déjà utilisé."
            });
        }

        // 3. Vérifier la famille
        const famille = await Famille.findOne({ codeFamille });
        if (!famille) {
            console.log("❌ INSCRIPTION - Famille non trouvée:", codeFamille);
            return res.status(404).json({
                success: false,
                message: "Code famille invalide."
            });
        }
        console.log("✅ INSCRIPTION - Famille trouvée:", famille._id);

        // 4. Créer la personne
        console.log("🔄 INSCRIPTION - Création personne:", nom, prenom);
        const nouvellePers = await Personne.create({
            nom,
            prenom,
            dateNaissance: null,
            genre: 'Non spécifié',
        });
        console.log("✅ INSCRIPTION - Personne créée:", nouvellePers._id);

        // 5. Ajouter à la famille
        famille.membres.push({ personne: nouvellePers._id });
        await famille.save();
        console.log("✅ INSCRIPTION - Personne ajoutée à la famille");

        // 6. Créer l'utilisateur
        const hashedPassword = await bcrypt.hash(password, 10);
        const userData = {
            personne: nouvellePers._id,
            famille: famille._id,
            email: email,
            login: login,
            password: hashedPassword,
            isValidated: false,
            role: 'simple',
            niveau: 'débutant',
            points: 0,
            nom: nom,
            prenom: prenom
        };
        if (req.file) {
            userData.photo = req.file.buffer;
            userData.photoType = req.file.mimetype;
        }
        const newUser = new User(userData);
        await newUser.save();
        console.log("✅ INSCRIPTION - Utilisateur créé:", newUser._id);

        // 7. Générer le token de validation email
        const token = jwt.sign(
            { personneId: nouvellePers._id, email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 8. Envoi de l'email de validation
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
        console.log("✅ INSCRIPTION - Email de validation envoyé");

        // 9. Historique
        await History.create({
            user: newUser._id,
            action: 'creation_utilisateur',
            details: { nom, prenom, login, email }
        });
        console.log("✅ INSCRIPTION - Historique enregistré");

        // 10. Réponse
        return res.status(201).json({
            success: true,
            message: "Inscription réussie ! Vérifiez votre mail pour valider votre compte."
        });

    } catch (err) {
        console.error("❌ INSCRIPTION - Erreur détaillée:", err);
        return res.status(500).json({
            success: false,
            message: "Erreur lors de l'inscription. Veuillez réessayer."
        });
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
            return res.status(403).json({ message: "Votre compte n'est pas encore activé" });
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

        // Log historique connexion
        await History.create({
          user: user._id,
          action: 'connexion',
          details: { email: user.email, login: user.login },
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });

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

        // 🔍 2. Trouver l'utilisateur correspondant
        const user = await User.findOne({ personne: personneId, email });
        if (!user) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }

        // ✅ 3. Mise à jour de l'état de validation
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
