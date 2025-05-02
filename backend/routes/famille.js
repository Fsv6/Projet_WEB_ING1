const express = require('express');
const router = express.Router();
const Famille = require('../models/Famille');
const Personne = require('../models/Personne');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const History = require('../models/History');
const mongoose = require('mongoose');

// Récupérer toutes les familles (admin uniquement)
router.get('/', [auth, isAdmin], async (req, res) => {
    try {
        const familles = await Famille.find().populate('membres.personne');
        res.json(familles);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des familles", error: error.message });
    }
});

// Récupérer une famille par ID
router.get('/:id', [auth, isAdmin], async (req, res) => {
    try {
        const famille = await Famille.findById(req.params.id).populate('membres.personne');
        if (!famille) {
            return res.status(404).json({ message: "Famille non trouvée" });
        }
        res.json(famille);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération de la famille", error: error.message });
    }
});

// Récupérer tous les membres d'une famille avec détails
router.get('/:id/membres', [auth, isAdmin], async (req, res) => {
    try {
        console.log(`Récupération des membres pour la famille ID: ${req.params.id}`);
        const famille = await Famille.findById(req.params.id).populate('membres.personne');
        
        if (!famille) {
            console.log('Famille non trouvée');
            return res.status(404).json({ message: "Famille non trouvée" });
        }

        console.log(`Famille trouvée: ${famille.codeFamille}, nombre de membres: ${famille.membres?.length || 0}`);

        // Filtrer les membres dont la personne associée existe
        const membresValides = famille.membres.filter(membre => membre.personne != null);
        console.log(`Nombre de membres valides: ${membresValides.length}`);

        // Extraire les IDs des personnes
        const personneIds = membresValides.map(membre => membre.personne._id);
        console.log(`IDs des personnes: ${personneIds.join(', ')}`);
        
        // Récupérer les informations utilisateur associées aux personnes
        const users = await User.find({ personne: { $in: personneIds } });
        console.log(`Nombre d'utilisateurs trouvés: ${users.length}`);
        
        // Créer un map des données utilisateur par ID de personne
        const userMap = users.reduce((map, user) => {
            map[user.personne.toString()] = {
                _id: user._id,
                login: user.login,
                role: user.role,
                niveau: user.niveau
            };
            return map;
        }, {});
        
        // Construire la liste des membres avec les détails
        const membres = membresValides.map(membre => {
            const personne = membre.personne;
            const user = userMap[personne._id.toString()];
            
            return {
                _id: personne._id,
                nom: personne.nom,
                prenom: personne.prenom,
                genre: personne.genre,
                dateNaissance: personne.dateNaissance,
                ...(user || {}) // Utiliser un objet vide si l'utilisateur n'existe pas
            };
        });
        
        console.log(`Nombre de membres envoyés: ${membres.length}`);
        res.json(membres);
    } catch (error) {
        console.error('Erreur lors de la récupération des membres:', error);
        res.status(500).json({ message: "Erreur lors de la récupération des membres", error: error.message });
    }
});

// Créer une nouvelle famille
router.post('/', [auth, isAdmin], async (req, res) => {
    try {
        const { codeFamille, nom, description, membres } = req.body;
        
        // Vérifier si la famille existe déjà
        const existingFamille = await Famille.findOne({ codeFamille });
        if (existingFamille) {
            return res.status(400).json({ message: "Une famille avec ce code existe déjà" });
        }
        
        const famille = new Famille({
            codeFamille,
            nom: nom || '',
            description: description || '',
            membres: membres || []
        });
        
        await famille.save();
        
        // Enregistrer l'action dans l'historique
        const historyEntry = new History({
            user: req.user.id,
            action: 'creation_famille',
            details: {
                codeFamille: famille.codeFamille,
                nom: famille.nom,
                description: famille.description
            },
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        await historyEntry.save();
        
        res.status(201).json(famille);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la création de la famille", error: error.message });
    }
});

// Mettre à jour une famille
router.put('/:id', [auth, isAdmin], async (req, res) => {
    try {
        const { codeFamille, nom, description } = req.body;
        
        // Vérifier si la famille existe
        const famille = await Famille.findById(req.params.id);
        if (!famille) {
            return res.status(404).json({ message: "Famille non trouvée" });
        }
        
        // Si le code famille est modifié, vérifier qu'il n'existe pas déjà
        if (codeFamille !== famille.codeFamille) {
            const existingFamille = await Famille.findOne({ codeFamille });
            if (existingFamille && existingFamille._id.toString() !== req.params.id) {
                return res.status(400).json({ message: "Une famille avec ce code existe déjà" });
            }
        }
        
        // Sauvegarder les anciennes valeurs pour l'historique
        const oldValues = {
            codeFamille: famille.codeFamille,
            nom: famille.nom,
            description: famille.description
        };
        
        // Mettre à jour les champs
        famille.codeFamille = codeFamille;
        famille.nom = nom || '';
        famille.description = description || '';
        
        await famille.save();
        
        // Enregistrer l'action dans l'historique
        const historyEntry = new History({
            user: req.user.id,
            action: 'modification_famille',
            details: {
                familleId: famille._id,
                codeFamille: famille.codeFamille,
                avant: oldValues,
                apres: {
                    codeFamille,
                    nom: nom || '',
                    description: description || ''
                }
            },
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        await historyEntry.save();
        
        res.json(famille);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour de la famille", error: error.message });
    }
});

// Supprimer une famille
router.delete('/:id', [auth, isAdmin], async (req, res) => {
    try {
        // Récupérer la famille avant de la supprimer
        const famille = await Famille.findById(req.params.id);
        if (!famille) {
            return res.status(404).json({ message: "Famille non trouvée" });
        }
        
        // Vérifier si le paramètre de suppression forcée est présent
        const { forcerSuppression, conserverPersonnes } = req.query;
        
        // Vérifier si des utilisateurs sont encore associés à cette famille
        const usersCount = await User.countDocuments({ famille: req.params.id });
        
        if (usersCount > 0 && forcerSuppression !== 'true') {
            return res.status(400).json({ 
                message: "Impossible de supprimer cette famille car des utilisateurs y sont encore associés. Utilisez l'option forcer pour supprimer malgré tout.",
                count: usersCount,
                hasUsers: true
            });
        }
        
        // Si on supprime avec force et qu'il y a des utilisateurs, mettre à jour les utilisateurs
        if (usersCount > 0 && forcerSuppression === 'true') {
            await User.updateMany(
                { famille: req.params.id }, 
                { $unset: { famille: "" } }
            );
        }
        
        // Si on choisit de ne pas conserver les personnes, les supprimer
        if (conserverPersonnes !== 'true' && famille.membres && famille.membres.length > 0) {
            // Récupérer les IDs des personnes à supprimer
            const personneIds = famille.membres
                .filter(membre => membre.personne)
                .map(membre => membre.personne);
            
            if (personneIds.length > 0) {
                // Supprimer les personnes qui ne sont pas utilisées par d'autres familles
                for (const personneId of personneIds) {
                    // Vérifier si cette personne est membre d'autres familles
                    const autreFamilles = await Famille.find({
                        _id: { $ne: req.params.id },
                        'membres.personne': personneId
                    });
                    
                    if (autreFamilles.length === 0) {
                        // Si la personne n'est pas membre d'autres familles, on peut la supprimer
                        await Personne.findByIdAndDelete(personneId);
                    }
                }
            }
        }
        
        // Supprimer la famille
        await Famille.findByIdAndDelete(req.params.id);
        
        // Enregistrer l'action dans l'historique
        const historyEntry = new History({
            user: req.user.id,
            action: 'suppression_famille',
            details: {
                codeFamille: famille.codeFamille,
                nom: famille.nom,
                membresCount: famille.membres?.length || 0,
                forcerSuppression: forcerSuppression === 'true',
                conserverPersonnes: conserverPersonnes === 'true',
                usersCount: usersCount
            },
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        await historyEntry.save();
        
        res.json({ 
            message: "Famille supprimée avec succès",
            membresCount: famille.membres?.length || 0,
            usersCount: usersCount,
            personnesConservees: conserverPersonnes === 'true'
        });
    } catch (error) {
        console.error("Erreur lors de la suppression de la famille:", error);
        res.status(500).json({ 
            message: "Erreur lors de la suppression de la famille", 
            error: error.message 
        });
    }
});

// Ajouter un membre à une famille
router.put('/:id/membres', [auth, isAdmin], async (req, res) => {
    try {
        const { personneId } = req.body;
        const famille = await Famille.findById(req.params.id);
        
        if (!famille) {
            return res.status(404).json({ message: "Famille non trouvée" });
        }
        
        // Vérifier si la personne existe
        const personne = await Personne.findById(personneId);
        if (!personne) {
            return res.status(404).json({ message: "Personne non trouvée" });
        }
        
        // Vérifier si la personne est déjà membre de la famille
        const isAlreadyMember = famille.membres.some(membre => 
            membre.personne.toString() === personneId
        );
        
        if (isAlreadyMember) {
            return res.status(400).json({ message: "Cette personne est déjà membre de la famille" });
        }
        
        // Vérifier si la personne appartient déjà à une autre famille
        const autreFamille = await Famille.findOne({
            _id: { $ne: req.params.id },
            'membres.personne': personneId
        });
        
        if (autreFamille) {
            // Retirer la personne de l'autre famille
            autreFamille.membres = autreFamille.membres.filter(membre => 
                membre.personne.toString() !== personneId
            );
            await autreFamille.save();
            
            // Enregistrer l'action dans l'historique
            const historyEntryRemove = new History({
                user: req.user.id,
                action: 'retrait_membre_famille',
                details: {
                    familleId: autreFamille._id,
                    codeFamille: autreFamille.codeFamille,
                    personneId: personne._id,
                    nom: personne.nom,
                    prenom: personne.prenom,
                    raison: "Changement de famille"
                },
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
            await historyEntryRemove.save();
        }
        
        // Ajouter la personne à la nouvelle famille
        famille.membres.push({
            personne: personneId
        });
        await famille.save();
        
        // Mettre à jour le document utilisateur si existant
        const user = await User.findOne({ personne: personneId });
        if (user) {
            user.famille = famille._id;
            await user.save();
            
            // Enregistrer l'action de mise à jour de l'utilisateur
            const historyEntryUpdateUser = new History({
                user: req.user.id,
                action: 'modification_utilisateur',
                details: {
                    userId: user._id,
                    login: user.login,
                    champ: 'famille',
                    ancienneValeur: autreFamille ? autreFamille._id : 'aucune',
                    nouvelleValeur: famille._id
                },
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
            await historyEntryUpdateUser.save();
        }
        
        // Enregistrer l'action dans l'historique
        const historyEntry = new History({
            user: req.user.id,
            action: 'ajout_membre_famille',
            details: {
                familleId: famille._id,
                codeFamille: famille.codeFamille,
                personneId: personne._id,
                nom: personne.nom,
                prenom: personne.prenom
            },
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        await historyEntry.save();
        
        res.json({ 
            message: autreFamille 
                ? `Membre transféré de la famille ${autreFamille.codeFamille} à la famille ${famille.codeFamille}` 
                : "Membre ajouté à la famille",
            famille 
        });
    } catch (error) {
        console.error("Erreur lors de l'ajout du membre:", error);
        res.status(500).json({ message: "Erreur lors de l'ajout du membre", error: error.message });
    }
});

// Retirer un membre d'une famille
router.delete('/:id/membres/:personneId', [auth, isAdmin], async (req, res) => {
    try {
        const famille = await Famille.findById(req.params.id);
        
        if (!famille) {
            return res.status(404).json({ message: "Famille non trouvée" });
        }
        
        // Récupérer les informations de la personne avant de la retirer
        const personne = await Personne.findById(req.params.personneId);
        if (!personne) {
            return res.status(404).json({ message: "Personne non trouvée" });
        }
        
        // Vérifier le paramètre conserverPersonne (par défaut à true)
        const conserverPersonne = req.query.conserverPersonne !== 'false';
        
        // Filtrer pour retirer le membre
        famille.membres = famille.membres.filter(membre => 
            membre.personne.toString() !== req.params.personneId
        );
        
        // Vérifier si c'était le dernier membre
        const estDernier = famille.membres.length === 0;
        
        // Mettre à jour le document utilisateur si existant
        const user = await User.findOne({ personne: req.params.personneId });
        if (user) {
            // Supprimer la référence à la famille
            user.famille = undefined;
            await user.save();
            
            // Enregistrer l'action de mise à jour de l'utilisateur
            const historyEntryUpdateUser = new History({
                user: req.user.id,
                action: 'modification_utilisateur',
                details: {
                    userId: user._id,
                    login: user.login,
                    champ: 'famille',
                    ancienneValeur: famille._id,
                    nouvelleValeur: 'aucune'
                },
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
            await historyEntryUpdateUser.save();
        }
        
        // Enregistrer l'action dans l'historique pour le retrait du membre
        const historyEntryMembre = new History({
            user: req.user.id,
            action: 'retrait_membre_famille',
            details: {
                familleId: famille._id,
                codeFamille: famille.codeFamille,
                personneId: personne._id,
                nom: personne.nom,
                prenom: personne.prenom,
                personneConservee: conserverPersonne
            },
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        await historyEntryMembre.save();
        
        // Si l'option de ne pas conserver la personne est choisie, la supprimer
        if (!conserverPersonne) {
            // Vérifier si la personne est utilisée dans d'autres familles
            const autreFamilles = await Famille.find({
                _id: { $ne: req.params.id },
                'membres.personne': req.params.personneId
            });
            
            if (autreFamilles.length === 0 && !user) {
                // Si la personne n'est pas utilisée ailleurs, on peut la supprimer
                await Personne.findByIdAndDelete(req.params.personneId);
                
                // Enregistrer l'action de suppression de la personne
                const historyEntryPersonne = new History({
                    user: req.user.id,
                    action: 'suppression_personne',
                    details: {
                        personneId: personne._id,
                        nom: personne.nom,
                        prenom: personne.prenom
                    },
                    ip: req.ip,
                    userAgent: req.headers['user-agent']
                });
                await historyEntryPersonne.save();
            } else if (user) {
                // Si la personne a un compte utilisateur, on ne peut pas la supprimer
                return res.status(400).json({
                    message: "Impossible de supprimer cette personne car elle possède un compte utilisateur",
                    familleDeleted: estDernier,
                    remainingMembers: famille.membres.length
                });
            }
        }
        
        if (estDernier) {
            // Si c'est le dernier membre, supprimer la famille complètement
            await Famille.findByIdAndDelete(req.params.id);
            
            // Enregistrer l'action de suppression de la famille
            const historyEntryFamille = new History({
                user: req.user.id,
                action: 'suppression_famille',
                details: {
                    familleId: famille._id,
                    codeFamille: famille.codeFamille,
                    nom: famille.nom,
                    raison: "Suppression automatique après retrait du dernier membre"
                },
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
            await historyEntryFamille.save();
            
            return res.json({ 
                message: conserverPersonne ? 
                    "Membre retiré et famille supprimée car c'était le dernier membre" :
                    "Membre supprimé et famille supprimée car c'était le dernier membre",
                familleDeleted: true,
                remainingMembers: 0
            });
            
        } else {
            // Sinon, sauvegarder la famille mise à jour
            await famille.save();
            
            return res.json({ 
                message: conserverPersonne ?
                    "Membre retiré avec succès" :
                    "Membre supprimé avec succès",
                familleDeleted: false,
                remainingMembers: famille.membres.length
            });
        }
    } catch (error) {
        console.error("Erreur lors du retrait du membre:", error);
        res.status(500).json({ message: "Erreur lors du retrait du membre", error: error.message });
    }
});

// Nettoyer les membres invalides d'une famille
router.post('/:id/clean-membres', [auth, isAdmin], async (req, res) => {
    try {
        const famille = await Famille.findById(req.params.id);
        
        if (!famille) {
            return res.status(404).json({ message: "Famille non trouvée" });
        }
        
        // Sauvegarder le nombre original de membres
        const membresBefore = famille.membres.length;
        
        // Garder une trace des membres invalides qui ont été retirés
        const membresInvalides = [];
        
        // Vérifier quels membres ont des personnes non existantes
        for (const membre of famille.membres) {
            if (!membre.personne) {
                membresInvalides.push(membre);
            } else {
                // Vérifier si la personne existe dans la base de données
                const personneExists = await Personne.findById(membre.personne);
                if (!personneExists) {
                    membresInvalides.push(membre);
                }
            }
        }
        
        // Filtrer les membres dont la personne associée existe
        famille.membres = famille.membres.filter(membre => 
            membre.personne && mongoose.Types.ObjectId.isValid(membre.personne)
        );
        
        // Sauvegarder les modifications
        await famille.save();
        
        // Enregistrer l'action dans l'historique
        const historyEntry = new History({
            user: req.user.id,
            action: 'retrait_membre_famille',
            details: {
                familleId: famille._id,
                codeFamille: famille.codeFamille,
                membresBeforeCount: membresBefore,
                membresAfterCount: famille.membres.length,
                membresRetiresCount: membresBefore - famille.membres.length
            },
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        await historyEntry.save();
        
        res.json({ 
            message: "Nettoyage des membres effectué avec succès",
            membresBeforeCount: membresBefore,
            membresAfterCount: famille.membres.length,
            membresRetiresCount: membresBefore - famille.membres.length
        });
    } catch (error) {
        console.error('Erreur lors du nettoyage des membres:', error);
        res.status(500).json({ message: "Erreur lors du nettoyage des membres", error: error.message });
    }
});

// Récupérer le nombre de membres valides par famille
router.get('/membres-count', [auth, isAdmin], async (req, res) => {
    try {
        // Récupérer toutes les familles avec leurs membres
        const familles = await Famille.find().populate('membres.personne');
        
        // Créer un objet qui contiendra l'ID de famille -> nombre de membres valides
        const membresValidesCount = {};
        
        // Pour chaque famille, compter les membres valides
        for (const famille of familles) {
            // Filtrer les membres dont la personne associée existe
            const membresValides = famille.membres.filter(membre => 
                membre.personne != null && membre.personne._id
            );
            
            // Stocker le nombre de membres valides pour cette famille
            membresValidesCount[famille._id.toString()] = membresValides.length;
        }
        
        res.json(membresValidesCount);
    } catch (error) {
        console.error('Erreur lors du comptage des membres:', error);
        res.status(500).json({ message: "Erreur lors du comptage des membres", error: error.message });
    }
});

// Récupérer sa propre famille (accessible à tous)
router.get('/my', auth, async (req, res) => {
    console.log('>>> [API] /familles/my appelée');
    try {
        console.log('--- [API] /familles/my ---');
        console.log('req.user.id =', req.user && req.user.id);
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Token invalide ou utilisateur non authentifié.' });
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            console.log('Utilisateur introuvable pour id =', req.user.id);
            return res.status(401).json({ message: 'Utilisateur introuvable.' });
        }
        if (!user.famille) {
            return res.status(404).json({ message: "Vous n'êtes pas associé à une famille" });
        }
        const famille = await Famille.findById(user.famille);
        if (!famille) {
            return res.status(404).json({ message: "Famille non trouvée" });
        }
        res.json(famille);
    } catch (error) {
        console.error('Erreur lors de la récupération de votre famille:', error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// Récupérer les membres de sa propre famille (accessible à tous)
router.get('/my/membres', auth, async (req, res) => {
    try {
        console.log(`Récupération des membres de la famille pour l'utilisateur: ${req.user.id}`);
        
        // Récupérer l'utilisateur avec sa famille
        const user = await User.findById(req.user.id);
        
        if (!user || !user.famille) {
            console.log(`L'utilisateur ${req.user.id} n'est pas associé à une famille`);
            return res.status(404).json({ message: "Vous n'êtes pas associé à une famille" });
        }
        
        console.log(`Famille trouvée: ${user.famille}`);
        
        // Récupérer la famille avec ses membres
        const famille = await Famille.findById(user.famille).populate('membres.personne');
        
        if (!famille) {
            console.log('Famille non trouvée dans la base de données');
            return res.status(404).json({ message: "Famille non trouvée" });
        }

        console.log(`Famille récupérée: ${famille.codeFamille}, nombre de membres: ${famille.membres?.length || 0}`);

        // Filtrer les membres dont la personne associée existe
        const membresValides = famille.membres.filter(membre => membre.personne != null);
        console.log(`Nombre de membres valides: ${membresValides.length}`);

        // Extraire les IDs des personnes
        const personneIds = membresValides.map(membre => membre.personne._id);
        console.log(`IDs des personnes: ${personneIds.join(', ')}`);
        
        // Récupérer les informations utilisateur associées aux personnes
        const users = await User.find({ personne: { $in: personneIds } });
        console.log(`Nombre d'utilisateurs trouvés: ${users.length}`);
        
        // Créer un map des données utilisateur par ID de personne
        const userMap = users.reduce((map, user) => {
            map[user.personne.toString()] = {
                _id: user._id,
                login: user.login,
                role: user.role,
                niveau: user.niveau,
                points: user.points,
                photo: user.photo
            };
            return map;
        }, {});
        
        // Construire la liste des membres avec les détails
        const membres = membresValides.map(membre => {
            const personne = membre.personne;
            const user = userMap[personne._id.toString()];
            
            return {
                _id: user?._id || personne._id,
                personne: {
                    _id: personne._id,
                    nom: personne.nom,
                    prenom: personne.prenom,
                    genre: personne.genre,
                    age: personne.age,
                    typeMembre: personne.typeMembre,
                    dateNaissance: personne.dateNaissance
                },
                login: user?.login,
                role: user?.role,
                niveau: user?.niveau,
                points: user?.points || 0,
                photo: user?.photo
            };
        });
        
        console.log(`Nombre de membres envoyés: ${membres.length}`);
        res.json(membres);
    } catch (error) {
        console.error('Erreur lors de la récupération des membres de votre famille:', error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

module.exports = router; 