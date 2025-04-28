const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // middleware pour vérifier le token
const User = require('../models/user');
const Personne = require('../models/Personne');
const userController = require('../controllers/userController');
const bcrypt = require('bcrypt');
const upload = require('../middleware/upload')

// GET /api/users/me – récupérer son profil
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('personne');
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// PUT /api/users/me – modifier son profil
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

router.post('/:id/points', userController.addPoints);

// GET /api/users – liste publique des utilisateurs connectés
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find({}, 'login photo niveau personne')
            .populate({
                path: 'personne',
                select: 'typeMembre genre dateNaissance age'
            })

        res.json(users)
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error })
    }
})
// GET /api/users – liste publique (sans données sensibles)
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find({}, 'login photo niveau personne')
            .populate({
                path: 'personne',
                select: 'typeMembre genre dateNaissance age'
            })
        res.json(users)
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error })
    }
})


// Mise à jour de photo (multipart/form-data)
router.put('/me/photo', auth, upload.single('photo'), userController.updatePhoto)

// Mise à jour du mot de passe
router.put('/me', auth, userController.updatePassword)


module.exports = router;
