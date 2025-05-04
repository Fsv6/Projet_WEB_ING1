const User = require('../models/user');
const bcrypt = require('bcrypt')

// 🔁 PUT /users/me/photo
exports.updatePhoto = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" })

        if (!req.file) return res.status(400).json({ message: "Aucun fichier envoyé" });
        user.photo = req.file.buffer;
        user.photoType = req.file.mimetype;
        await user.save()

        res.json({ message: "Photo mise à jour" })
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

// Fonction pour mettre à jour le niveau et le rôle en fonction des points (alignée avec le frontend)
const updateUserNiveauAndRole = (points) => {
    let niveau = 'débutant';
    let role = 'simple';

    if (points >= 7) {
        niveau = 'expert';
        role = 'admin';
    } else if (points >= 5) {
        niveau = 'avancé';
        role = 'complexe';
    } else if (points >= 3) {
        niveau = 'intermédiaire';
        role = 'complexe';
    }

    return { niveau, role };
};

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

        // Vérifier si les champs requis sont présents
        if (!user.nom || !user.prenom) {
            try {
                // Utiliser directement des valeurs par défaut
                user.nom = user.nom || "Utilisateur";
                user.prenom = user.prenom || "Sans Nom";
            } catch (error) {
                console.error("Erreur lors de la gestion des noms par défaut:", error);
                // Continuer malgré l'erreur
            }
        }

        // Calculer les nouveaux points
        const oldPoints = user.points;
        user.points += parseFloat(amount);

        // Mise à jour automatique du niveau en fonction des points
        const updatedNiveauRole = updateUserNiveauAndRole(user.points);

        const oldNiveau = user.niveau;
        const oldRole = user.role;

        // Mettre à jour uniquement le niveau selon les points
        user.niveau = updatedNiveauRole.niveau;
        // user.role reste inchangé

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

        // Réponse au frontend pour confirmer la réussite
        res.status(200).json({
            message: "Points mis à jour avec succès",
            points: user.points,
            niveau: user.niveau,
            role: user.role
        });
    } catch (error) {
        console.error("Erreur lors de l'ajout de points :", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message, stack: error.stack });
    }
}

exports.getFamilyMembers = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Récupérer les membres de la famille
        const familyMembers = await User.find({ 
            _id: { $in: user.familyMembers, $ne: user._id } // Combiner les filtres correctement
        }).select('-password'); // Ne pas exclure photo et photoType

        res.json(familyMembers);
    } catch (error) {
        console.error("Erreur lors de la récupération des membres de la famille:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
};