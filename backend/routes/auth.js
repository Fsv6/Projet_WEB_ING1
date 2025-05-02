const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const User = require('../models/User');
const Famille = require('../models/Famille');
const Personne = require('../models/Personne');
const History = require('../models/History');

const router = express.Router();

require('dotenv').config(); // pour utiliser les variables d'env (comme JWT_SECRET)

// POST /api/register
router.post('/register', async (req, res) => {
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
            genre: 'Autre'
        });
        console.log("✅ INSCRIPTION - Personne créée:", nouvellePers._id);

        // 5. Ajouter à la famille
        famille.membres.push({ personne: nouvellePers._id });
        await famille.save();
        console.log("✅ INSCRIPTION - Personne ajoutée à la famille");

        // 6. Créer l'utilisateur avec un document direct pour éviter toute transformation
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log("🔄 INSCRIPTION - Préparation de l'utilisateur avec email:", email);
        
        // Créer directement l'utilisateur sans passer par des variables intermédiaires
        const newUser = await mongoose.connection.db.collection('users').insertOne({
            personne: nouvellePers._id,
            famille: famille._id,
            email: email,
            login: login,
            password: hashedPassword,
            photo: null,
            isValidated: true,
            role: 'simple',
            niveau: 'débutant',
            points: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        const userId = newUser.insertedId;
        console.log("✅ INSCRIPTION - Utilisateur créé avec ID:", userId);
        console.log("✅ INSCRIPTION - Email enregistré:", email);

        // 7. Générer le token
        const token = jwt.sign(
            { id: userId, role: 'simple' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 8. Enregistrer dans l'historique
        await History.create({
            user: userId,
            action: 'creation_utilisateur',
            details: { nom, prenom, login, email }
        });
        console.log("✅ INSCRIPTION - Historique enregistré");

        // 9. Réponse
        console.log("✅ INSCRIPTION - Compte créé avec succès");
        return res.status(201).json({
            success: true,
            message: "Compte créé avec succès !",
            token,
            user: {
                _id: userId,
                login: login,
                email: email,
                role: 'simple',
                niveau: 'débutant'
            }
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
        const { login, password } = req.body;

        console.log("➡️ Tentative de connexion avec login:", login);

        // Recherche de l'utilisateur par login ou email
        const user = await User.findOne({ 
            $or: [
                { login: login?.toLowerCase() },
                { email: login?.toLowerCase() }
            ]
        });
        
        if (!user) {
            console.log("❌ Utilisateur introuvable avec cet identifiant");
            return res.status(400).json({ message: 'Identifiants incorrects' });
        }

        console.log("✅ Utilisateur trouvé :", user.login);

        if (!user.isValidated) {
            console.log("❌ Compte non validé");
            return res.status(403).json({ message: "Votre compte n'est pas encore activé" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("🔍 Résultat comparaison mdp :", isMatch);

        if (!isMatch) {
            console.log("❌ Mot de passe incorrect");
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Enregistrer la connexion dans l'historique
        await History.create({
            user: user._id,
            action: 'connexion',
            details: {
                login: user.login,
                email: user.email,
                role: user.role
            },
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        console.log("✅ Token généré");
        res.status(200).json({ 
            token, 
            user: {
                _id: user._id,
                login: user.login,
                email: user.email,
                role: user.role,
                niveau: user.niveau,
                points: user.points
            } 
        });

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

// ROUTES DE TEST POUR LA COLLECTION user_2

// POST /api/register2
router.post('/register2', async (req, res) => {
    try {
        const { nom, prenom, login, email, password, codeFamille } = req.body;
        if (!nom || !prenom || !login || !email || !password || !codeFamille) {
            return res.status(400).json({
                success: false,
                message: "Tous les champs sont obligatoires."
            });
        }
        // Vérifier si login ou email existe déjà dans user_2
        const existingUser = await mongoose.connection.db.collection('user_2').findOne({
            $or: [
                { email: email },
                { login: login }
            ]
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.email === email 
                    ? "Cet email est déjà utilisé." 
                    : "Ce nom d'utilisateur est déjà utilisé."
            });
        }
        // Vérifier la famille
        const famille = await Famille.findOne({ codeFamille });
        if (!famille) {
            return res.status(404).json({
                success: false,
                message: "Code famille invalide."
            });
        }
        // Créer la personne
        const nouvellePers = await Personne.create({
            nom,
            prenom,
            dateNaissance: null,
            genre: 'Autre'
        });
        famille.membres.push({ personne: nouvellePers._id });
        await famille.save();
        const hashedPassword = await bcrypt.hash(password, 10);
        // Créer l'utilisateur dans user_2
        const newUser = await mongoose.connection.db.collection('user_2').insertOne({
            personne: nouvellePers._id,
            famille: famille._id,
            email: email,
            login: login,
            password: hashedPassword,
            photo: null,
            isValidated: true,
            role: 'simple',
            niveau: 'débutant',
            points: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        const userId = newUser.insertedId;
        const token = jwt.sign(
            { id: userId, role: 'simple' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        return res.status(201).json({
            success: true,
            message: "Compte créé avec succès !",
            token,
            user: {
                _id: userId,
                login: login,
                email: email,
                role: 'simple',
                niveau: 'débutant'
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Erreur lors de l'inscription. Veuillez réessayer."
        });
    }
});

// POST /api/login2
router.post('/login2', async (req, res) => {
    try {
        const { login, password } = req.body;
        // Recherche de l'utilisateur par login ou email dans user_2
        const user = await mongoose.connection.db.collection('user_2').findOne({
            $or: [
                { login: login?.toLowerCase() },
                { email: login?.toLowerCase() }
            ]
        });
        if (!user) {
            return res.status(400).json({ message: 'Identifiants incorrects' });
        }
        if (!user.isValidated) {
            return res.status(403).json({ message: "Votre compte n'est pas encore activé" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.status(200).json({ 
            token, 
            user: {
                _id: user._id,
                login: user.login,
                email: user.email,
                role: user.role,
                niveau: user.niveau,
                points: user.points
            } 
        });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;
