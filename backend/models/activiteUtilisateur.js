const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ActiviteUtilisateur = sequelize.define('ActiviteUtilisateur', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        utilisateur_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'utilisateurs',
                key: 'id'
            }
        },
        type_activite: {
            type: DataTypes.ENUM(
                'connexion',
                'deconnexion',
                'consultation_objet',
                'ajout_objet',
                'modification_profil',
                'signalement_incident',
                'modification_objet',
                'suppression_objet'
            ),
            allowNull: false
        },
        date_activite: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        details: {
            type: DataTypes.TEXT
        },
        points_gagnes: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        adresse_ip: {
            type: DataTypes.STRING(45)
        },
        objet_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'objets_connectes',
                key: 'id'
            }
        },
        ancien_etat: {
            type: DataTypes.TEXT
        },
        nouvel_etat: {
            type: DataTypes.TEXT
        }
    }, {
        tableName: 'activites_utilisateurs',
        timestamps: true
    });

    ActiviteUtilisateur.associate = (models) => {
        ActiviteUtilisateur.belongsTo(models.Utilisateur, {
            foreignKey: 'utilisateur_id',
            as: 'utilisateur'
        });
        ActiviteUtilisateur.belongsTo(models.ObjetConnecte, {
            foreignKey: 'objet_id',
            as: 'objet'
        });
    };

    return ActiviteUtilisateur;
};
