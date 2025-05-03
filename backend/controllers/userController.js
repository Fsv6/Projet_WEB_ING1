const User = require('../models/user');
const bcrypt = require('bcrypt')

// 🔁 PUT /users/me/photo
exports.updatePhoto = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" })

        user.photo = `/uploads/${req.file.filename}`
        await user.save()

        res.json({ message: "Photo mise à jour", photo: user.photo })
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error })
    }
}

// 🔁 PUT /users/me (mot de passe uniquement)
exports.updatePassword = async (req, res) => {
    try {
        const { oldPassword, password } = req.body
        const user = await User.findById(req.user.id)

        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" })

        const match = await bcrypt.compare(oldPassword, user.password)
        if (!match) return res.status(403).json({ message: "Ancien mot de passe incorrect" })

        const hashed = await bcrypt.hash(password, 10)
        user.password = hashed
        await user.save()

        res.json({ message: "Mot de passe mis à jour" })
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error })
    }
}

exports.addPoints = async (req, res) => {
    const userId = req.params.id;
    const { amount, reason } = req.body;

    console.log("➕ Tentative d'ajout de points");
    console.log("ID reçu:", userId);
    console.log("Montant reçu:", amount);
    console.log("Raison:", reason || "Non spécifiée");

    if (!amount || isNaN(amount)) {
        return res.status(400).json({ error: 'Montant invalide ou manquant.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            console.log("❌ Utilisateur non trouvé.");
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }

        // Calculer les nouveaux points
        const oldPoints = user.points;
        user.points += parseFloat(amount);

        // Mise à jour automatique du niveau et du rôle en fonction des points
        const updatedNiveauRole = updateUserNiveauAndRole(user.points);

        const oldNiveau = user.niveau;
        const oldRole = user.role;

        // Mettre à jour le niveau et le rôle uniquement si l'utilisateur n'est pas admin
        if (user.role !== 'admin') {
            user.niveau = updatedNiveauRole.niveau;
            user.role = updatedNiveauRole.role;
        }

        await user.save();

        // Ajouter à l'historique
        const History = require('../models/History');
        const historyDetails = {
            userId: userId,
            email: user.email,
            pointsAvant: oldPoints,
            pointsApres: user.points,
            montant: parseFloat(amount),
            raison: reason || "Non spécifiée"
        };

        // Ajouter les informations de changement de niveau/rôle à l'historique si applicable
        if (oldNiveau !== user.niveau || oldRole !== user.role) {
            historyDetails.niveauAvant = oldNiveau;
            historyDetails.niveauApres = user.niveau;
            historyDetails.roleAvant = oldRole;
            historyDetails.roleApres = user.role;
        }

        const newHistory = new History({
            user: req.user ? req.user.id : userId, // Si req.user est défini, c'est un admin qui fait l'action
            action: 'ajout_points',
            details: historyDetails,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        await newHistory.save();

        console.log(`✅ Points mis à jour : ${user.points}`);
        console.log(`✅ Niveau: ${user.niveau}, Rôle: ${user.role}`);

        res.status(200).json({
            message: 'Points ajoutés avec succès',
            points: user.points,
            niveau: user.niveau,
            role: user.role,
            niveauChanged: oldNiveau !== user.niveau,
            roleChanged: oldRole !== user.role
        });

    } catch (err) {
        console.error("💥 Erreur serveur :", err.message);
        res.status(500).json({ error: 'Erreur serveur interne.' });
    }
};

exports.upgradeLevel = async (req, res) => {
    const userId = req.params.id;
    const { niveau } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        console.log(`🔁 Changement demandé : ${user.niveau} ➡️ ${niveau}`);

        user.niveau = niveau;

        // Mise à jour du rôle automatiquement
        if (niveau === 'avancé') user.role = 'complexe';
        else if (niveau === 'expert') user.role = 'admin';
        else user.role = 'simple';

        await user.save();

        console.log('✅ Utilisateur mis à jour :', user.niveau, user.role);

        res.status(200).json({ niveau: user.niveau, role: user.role });

    } catch (err) {
        console.error('❌ Erreur serveur upgrade :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

/**
 * Fonction pour déterminer le niveau et le rôle d'un utilisateur en fonction des points
 * @param {Number} points - Nombre de points de l'utilisateur
 * @returns {Object} Nouveau niveau et rôle
 */
function updateUserNiveauAndRole(points) {
    let niveau, role;

    if (points <= 0) {
        niveau = null;
        role = 'visiteur';
    }else if (points < 3) {
        niveau = 'débutant';
        role = 'simple';
    } else if (points < 5) {
        niveau = 'intermédiaire';
        role = 'simple';
    } else if (points < 7) {
        niveau = 'avancé';
        role = 'complexe';
    } else {
        niveau = 'expert';
        role = 'admin';
    }

    return { niveau, role };
}

/**
 * Get family members of the authenticated user
 */
exports.getFamilyMembers = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'famille',
            populate: {
                path: 'membres.personne',
                model: 'Personne',
            },
        });

        if (!user || !user.famille) {
            return res.status(404).json({ message: 'Famille non trouvée pour cet utilisateur.' });
        }

        const familyMembers = await Promise.all(
            user.famille.membres.map(async (member) => {
                const relatedUser = await User.findOne({ personne: member.personne._id }).select('role niveau points');
                return {
                    id: member.personne._id,
                    nom: member.personne.nom,
                    prenom: member.personne.prenom,
                    role: relatedUser ? relatedUser.role : 'Non spécifié',
                    niveau: relatedUser ? relatedUser.niveau : 'Non spécifié',
                    points: relatedUser ? relatedUser.points : 0,
                };
            })
        );

        res.status(200).json(familyMembers);
    } catch (error) {
        console.error('Erreur lors de la récupération des membres de la famille:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};



