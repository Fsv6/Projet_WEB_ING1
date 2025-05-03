const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth').authenticate;
const isAdmin = require('../middleware/isAdmin');
const upload = require('../middleware/upload');
const userController = require('../controllers/userController');
const getFamilyMembers = require('../controllers/userController').getFamilyMembers;

const User = require('../models/user');
const Personne = require('../models/Personne');
const Famille = require('../models/Famille');
const bcrypt = require('bcrypt');

// Récupérer son propre profil
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('personne');
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// Modifier son propre profil
router.put('/me', auth, async (req, res) => {
    try {
        const { login, photo, password, personne } = req.body;
        const user = await User.findById(req.user.id).populate('personne');
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        if (login) user.login = login;
        if (photo) user.photo = photo;
        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            user.password = hashed;
        }

        if (personne) {
            const p = await Personne.findById(user.personne._id);
            if (personne.nom) p.nom = personne.nom;
            if (personne.prenom) p.prenom = personne.prenom;
            if (personne.age) p.age = personne.age;
            if (personne.genre) p.genre = personne.genre;
            if (personne.dateNaissance) p.dateNaissance = personne.dateNaissance;
            if (personne.typeMembre) p.typeMembre = personne.typeMembre;
            await p.save();
        }

        await user.save();
        res.json({ message: "Profil mis à jour" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// Mettre à jour la photo
router.put('/me/photo', auth, upload.single('photo'), userController.updatePhoto);

// Mettre à jour le mot de passe
router.put('/me/password', auth, userController.updatePassword);

// Ajouter des points à un utilisateur
router.post('/:id/points', userController.addPoints);

// Changer de niveau
router.post('/:id/upgrade', auth, async (req, res) => {
    try {
        const { niveau } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        const niveaux = ['débutant', 'intermédiaire', 'avancé', 'expert'];
        const seuils = {
            'intermédiaire': 3,
            'avancé': 5,
            'expert': 7
        };

        if (!niveaux.includes(niveau)) {
            return res.status(400).json({ error: 'Niveau invalide.' });
        }

        if (seuils[niveau] && user.points < seuils[niveau]) {
            return res.status(400).json({
                error: `Points insuffisants pour passer au niveau ${niveau}. Minimum requis: ${seuils[niveau]} points.`
            });
        }

        const oldNiveau = user.niveau;
        user.niveau = niveau;

        if (user.role !== 'admin') {
            if (niveau === 'expert') {
                user.role = 'admin';
            } else if (niveau === 'avancé') {
                user.role = 'complexe';
            } else {
                user.role = 'simple'; // pour débutant & intermédiaire
            }
        }


        await user.save();

        const History = require('../models/History');
        const newHistory = new History({
            user: req.user.id,
            action: 'upgrade_niveau',
            details: {
                userId: req.params.id,
                niveauAvant: oldNiveau,
                niveauApres: user.niveau,
                points: user.points
            },
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        await newHistory.save();

        res.status(200).json({
            message: 'Niveau mis à jour avec succès',
            niveau: user.niveau,
            role: user.role
        });

    } catch (error) {
        console.error("Erreur lors de la mise à jour du niveau:", error);
        res.status(500).json({ error: 'Erreur serveur interne.' });
    }
});

// Liste des utilisateurs (admin uniquement)
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find({}, 'login photo niveau personne')
            .populate({
                path: 'personne',
                select: 'typeMembre genre dateNaissance age'
            });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// Créer un utilisateur (admin uniquement)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès non autorisé" });
        }

        const {
            nom, prenom, genre, dateNaissance, codeFamille,
            login, password, role = 'simple', niveau = 'débutant',
            typeMembre, age
        } = req.body;

        const existingUser = await User.findOne({ login });
        if (existingUser) return res.status(400).json({ message: "Login déjà utilisé" });

        let famille = null;
        if (codeFamille) {
            famille = await Famille.findOne({ codeFamille });
            if (!famille) return res.status(404).json({ message: "Famille non trouvée" });
        }

        const newPersonne = new Personne({
            nom,
            prenom,
            genre: genre && genre.trim() !== "" ? genre : "Non spécifié",
            dateNaissance: dateNaissance || new Date(),
            typeMembre: typeMembre || 'membre',
            age: age || null
        });
        const savedPersonne = await newPersonne.save();

        if (famille) {
            famille.membres.push({ personne: savedPersonne._id });
            await famille.save();
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            personne: savedPersonne._id,
            famille: famille ? famille._id : null,
            login,
            password: hashedPassword,
            role,
            niveau,
            points: 0,
            isValidated: true
        });

        const savedUser = await newUser.save();

        const userWithDetails = await User.findById(savedUser._id)
            .populate('personne')
            .populate('famille')
            .select('-password');

        res.status(201).json({ user: userWithDetails });

    } catch (error) {
        console.error("Erreur lors de la création de l'utilisateur:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// Supprimer un utilisateur (admin uniquement)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès non autorisé" });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        if (user.personne) {
            await Personne.findByIdAndDelete(user.personne);
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Utilisateur supprimé avec succès" });

    } catch (error) {
        console.error("Erreur lors de la suppression de l'utilisateur:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// Rechercher des utilisateurs (admin uniquement)
router.get('/search', [auth, isAdmin], async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) {
            return res.status(400).json({ message: "La requête doit contenir au moins 2 caractères" });
        }

        const searchRegex = new RegExp(query, 'i');
        const users = await User.find().populate('personne').populate('famille');

        const filteredUsers = users.filter(user => {
            if (!user.personne) return false;
            return (
                user.login.match(searchRegex) ||
                user.personne.nom.match(searchRegex) ||
                user.personne.prenom.match(searchRegex)
            );
        });

        const results = filteredUsers.map(user => ({
            _id: user._id,
            login: user.login,
            email: user.email,
            personne: user.personne._id,
            nom: user.personne.nom,
            prenom: user.personne.prenom,
            genre: user.personne.genre,
            famille: user.famille ? user.famille.codeFamille : null
        }));

        res.json(results);
    } catch (error) {
        console.error("Erreur lors de la recherche d'utilisateurs:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// Obtenir les membres de la famille de l'utilisateur connecté
router.get('/family-members', auth, getFamilyMembers);

module.exports = router;



