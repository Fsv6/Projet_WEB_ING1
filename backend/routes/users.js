const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // middleware pour vérifier le token
const User = require('../models/User');
//const User = require('../models/user');
const Personne = require('../models/Personne');
const userController = require('../controllers/userController');
const bcrypt = require('bcrypt');
const upload = require('../middleware/upload')
const Famille = require('../models/Famille');
const { isAdmin } = require('../middleware/admin');
const { getFamilyMembers } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// GET /api/users/me – récupérer son profil
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('personne');
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        
        // On s'assure que toutes les données nécessaires sont présentes
        const userData = {
            _id: user._id,
            email: user.email,
            role: user.role,
            photo_profil: user.photo_profil,
            personne: user.personne ? {
                nom: user.personne.nom,
                prenom: user.personne.prenom,
                age: user.personne.age,
                genre: user.personne.genre,
                typeMembre: user.personne.typeMembre
            } : null
        };
        
        res.json(userData);
    } catch (error) {
        console.error("Erreur dans /users/me:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
});

// PUT /api/users/:id – modifier un utilisateur par un admin
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès non autorisé" });
        }

        const user = await User.findById(req.params.id).populate('personne');
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        const { login, password, role, niveau, personne, codeFamille } = req.body;

        // Mise à jour de la famille si spécifiée
        if (codeFamille) {
            const famille = await Famille.findOne({ codeFamille });
            if (!famille) {
                return res.status(404).json({ message: "Famille non trouvée" });
            }
            user.famille = famille._id;

            // Ajouter la personne à la nouvelle famille si elle n'y est pas déjà
            const membreExiste = famille.membres.some(m => m.personne.equals(user.personne._id));
            if (!membreExiste) {
                famille.membres.push({
                    personne: user.personne._id
                });
                await famille.save();
            }
        }

        if (login) user.login = login;
        if (role) user.role = role;
        if (niveau) user.niveau = niveau;
        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            user.password = hashed;
        }

        if (personne) {
            const p = await Personne.findById(user.personne._id);
            if (p) {
                if (personne.nom) p.nom = personne.nom;
                if (personne.prenom) p.prenom = personne.prenom;
                if (personne.age) p.age = personne.age;
                if (personne.genre !== undefined) {
                    p.genre = personne.genre && personne.genre.trim() !== "" ? personne.genre : "Non spécifié";
                }
                if (personne.dateNaissance) p.dateNaissance = personne.dateNaissance;
                if (personne.typeMembre) p.typeMembre = personne.typeMembre;
                await p.save();
            }
        }

        await user.save();

        res.json({ message: "Utilisateur mis à jour avec succès" });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// POST /api/users/:id/points - Ajouter/retirer des points à un utilisateur
router.post('/:id/points', auth, async (req, res) => {
    try {
        // Ajout de logs pour debug
        console.log('🔒 [DEBUG] req.user:', req.user);
        console.log('🔒 [DEBUG] req.params.id:', req.params.id);
        // Autoriser l'utilisateur à ajouter des points à lui-même OU un admin
        if (req.user.role !== 'admin' && req.user.id !== req.params.id && req.user._id !== req.params.id) {
            return res.status(403).json({ message: "Accès non autorisé" });
        }
        return userController.addPoints(req, res);
    } catch (error) {
        console.error("Erreur lors de l'ajout de points:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// POST /api/users/:id/upgrade - Mettre à jour le niveau de l'utilisateur
router.post('/:id/upgrade', auth, async (req, res) => {
    try {
        // Vérifier si l'utilisateur qui fait la demande est bien celui concerné ou un admin
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès non autorisé" });
        }
        
        const { niveau } = req.body;
        
        if (!niveau) {
            return res.status(400).json({ error: 'Niveau manquant.' });
        }
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }
        
        // Vérifier si l'utilisateur a assez de points pour le niveau demandé
        const niveaux = ['débutant', 'intermédiaire', 'avancé', 'expert'];
        const seuils = {
          'intermédiaire': 3,
          'avancé': 9,
          'expert': 15
        };
        
        // Vérifier que le niveau demandé existe
        if (!niveaux.includes(niveau)) {
            return res.status(400).json({ error: 'Niveau invalide.' });
        }
        
        // Vérifier que l'utilisateur a assez de points pour le niveau demandé
        if (seuils[niveau] && user.points < seuils[niveau]) {
            return res.status(400).json({ 
                error: `Points insuffisants pour passer au niveau ${niveau}. 
                        Minimum requis: ${seuils[niveau]} points.` 
            });
        }
        
        // Sauvegarder l'ancien niveau pour l'historique
        const oldNiveau = user.niveau;
        
        // Mettre à jour le niveau
        user.niveau = niveau;
        
        // Mise à jour du rôle en fonction du niveau
        if (user.role !== 'admin') {  // Ne pas changer le rôle d'un admin
            if (niveau === 'avancé') {
                user.role = 'complexe';
            } else if (niveau === 'expert') {
                user.role = 'complexe'; // Ou tout autre rôle associé à expert
            }
        }
        
        await user.save();
        
        // Ajouter à l'historique
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

// GET /api/users - Liste de tous les utilisateurs (pour admin)
router.get('/', auth, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès non autorisé" });
        }

        const users = await User.find()
            .populate({
                path: 'personne',
                model: 'Personne',
                select: 'nom prenom genre dateNaissance'
            })
            .populate('famille')
            .select('login role niveau points photo personne famille');

        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

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

// POST /api/users - Créer un nouvel utilisateur (admin uniquement)
router.post('/', auth, async (req, res) => {
    try {
        // Vérifie que seul un admin peut ajouter un utilisateur
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès non autorisé" });
        }

        const {
            nom,
            prenom,
            genre,
            dateNaissance,
            codeFamille,
            login,
            password,
            role = 'simple',
            niveau = 'débutant',
            typeMembre,
            age
        } = req.body;

        // Vérification unicité du login
        const existingUser = await User.findOne({ login });
        if (existingUser) {
            return res.status(400).json({ message: "Login déjà utilisé" });
        }

        // Recherche de la famille
        let famille = null;
        if (codeFamille) {
            famille = await Famille.findOne({ codeFamille });
            if (!famille) {
                return res.status(404).json({ message: "Famille non trouvée" });
            }
        }

        // Création de la Personne
        const newPersonne = new Personne({
            nom,
            prenom,
            genre: genre && genre.trim() !== "" ? genre : "Non spécifié",
            dateNaissance: dateNaissance || new Date(),
            typeMembre: typeMembre || 'membre',
            age: age || null
        });
        const savedPersonne = await newPersonne.save();

        // Si une famille est spécifiée, ajouter la personne à la famille
        if (famille) {
            famille.membres.push({
                personne: savedPersonne._id
            });
            await famille.save();
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Création de l'utilisateur
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

        // Retourner l'utilisateur créé (sans mot de passe)
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

// DELETE /api/users/:id - Supprimer un utilisateur (admin uniquement)
router.delete('/:id', auth, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès non autorisé" });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Supprimer la personne associée
        if (user.personne) {
            await Personne.findByIdAndDelete(user.personne);
        }

        // Supprimer l'utilisateur
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
      return res.status(400).json({ message: "La requête de recherche doit contenir au moins 2 caractères" });
    }
    
    // Préparer l'expression régulière pour la recherche insensible à la casse
    const searchRegex = new RegExp(query, 'i');
    
    // Chercher les utilisateurs avec leurs détails de personne
    const users = await User.find().populate('personne').populate('famille');
    
    // Filtrer les utilisateurs qui correspondent aux critères
    const filteredUsers = users.filter(user => {
      if (!user.personne) return false;
      
      return (
        user.login.match(searchRegex) || 
        user.personne.nom.match(searchRegex) || 
        user.personne.prenom.match(searchRegex)
      );
    });
    
    // Transformer les résultats pour renvoyer seulement les informations nécessaires
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
    res.status(500).json({ message: "Erreur lors de la recherche d'utilisateurs", error: error.message });
  }
});

// Route to get family members of the authenticated user
router.get('/family-members', authMiddleware, getFamilyMembers);

module.exports = router;




