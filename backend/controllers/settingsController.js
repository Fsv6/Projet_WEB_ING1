const sequelize = require('../config/database');
const { Op } = require('sequelize');
const Settings = require('../models/settings')(sequelize);

// Récupérer les paramètres d'apparence
exports.getAppearanceSettings = async (req, res) => {
    try {
        // Récupérer tous les paramètres d'apparence
        const settings = await Settings.findAll({
            where: {
                key: {
                    [Op.like]: 'appearance_%'
                }
            }
        });

        // Formater les données pour le frontend
        const formattedSettings = {
            theme: {
                mode: 'light' // valeur par défaut
            },
            font: {
                fontFamily: "'Open Sans', sans-serif" // valeur par défaut
            }
        };

        // Traiter chaque paramètre
        settings.forEach(setting => {
            if (setting.key === 'appearance_theme_mode') {
                formattedSettings.theme.mode = setting.value;
            }
            else if (setting.key === 'appearance_font_family') {
                formattedSettings.font.fontFamily = setting.value;
            }
        });

        res.status(200).json(formattedSettings);
    } catch (err) {
        console.error('Erreur lors de la récupération des paramètres d\'apparence:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des paramètres d\'apparence' });
    }
};

// Mettre à jour les paramètres d'apparence
exports.updateAppearanceSettings = async (req, res) => {
    try {
        const { theme, font } = req.body;

        // Mise à jour en transaction pour garantir la cohérence
        await sequelize.transaction(async (t) => {
            // Mise à jour du thème
            if (theme && theme.mode) {
                await Settings.upsert({
                    key: 'appearance_theme_mode',
                    value: theme.mode,
                    description: 'Mode du thème (clair ou sombre)'
                }, { transaction: t });
            }

            // Mise à jour de la police
            if (font && font.fontFamily) {
                await Settings.upsert({
                    key: 'appearance_font_family',
                    value: font.fontFamily,
                    description: 'Police de caractères globale'
                }, { transaction: t });
            }
        });

        res.status(200).json({ message: 'Paramètres d\'apparence mis à jour avec succès' });
    } catch (err) {
        console.error('Erreur lors de la mise à jour des paramètres d\'apparence:', err);
        res.status(500).json({ message: 'Erreur lors de la mise à jour des paramètres d\'apparence' });
    }
}; 