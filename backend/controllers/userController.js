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
    const { amount } = req.body;

    console.log("➕ Tentative d'ajout de points");
    console.log("ID reçu:", userId);
    console.log("Montant reçu:", amount);

    if (!amount || isNaN(amount)) {
        return res.status(400).json({ error: 'Montant invalide ou manquant.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            console.log("❌ Utilisateur non trouvé.");
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }

        user.points += parseFloat(amount);
        await user.save();

        console.log(`✅ Points mis à jour : ${user.points}`);
        res.status(200).json({ message: 'Points ajoutés avec succès', points: user.points });

    } catch (err) {
        console.error("💥 Erreur serveur :", err.message);
        res.status(500).json({ error: 'Erreur serveur interne.' });
    }
}

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



