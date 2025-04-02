const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ObjetConnecte = sequelize.define('ObjetConnecte', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        categorie: {
            type: DataTypes.STRING(50)
        },
        statut: {
            type: DataTypes.ENUM('actif', 'inactif', 'maintenance'),
            defaultValue: 'actif'
        },
        emplacement: {
            type: DataTypes.STRING(100)
        },
        date_ajout: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        derniere_mise_a_jour: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        marque: {
            type: DataTypes.STRING(50)
        },
        type: {
            type: DataTypes.STRING(50)
        },
        connectivite: {
            type: DataTypes.STRING(50)
        },
        etat_batterie: {
            type: DataTypes.INTEGER,
            validate: {
                min: 0,
                max: 100
            }
        },
        piece_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'pieces',
                key: 'id'
            }
        },
        type_outil: {
            type: DataTypes.ENUM('capteur', 'thermostat', 'gestion_transport', 'signalement_incident', 'gestion_acces')
        },
        description_outil: {
            type: DataTypes.TEXT
        },
        capacite: {
            type: DataTypes.INTEGER
        },
        consommation_energie: {
            type: DataTypes.FLOAT
        },
        niveau_de_bruit: {
            type: DataTypes.INTEGER,
            validate: {
                min: 0,
                max: 100
            }
        }
    }, {
        tableName: 'objets_connectes',
        timestamps: true
    });

    ObjetConnecte.associate = (models) => {
        ObjetConnecte.belongsTo(models.Utilisateur, {
            foreignKey: 'utilisateur_id',
            as: 'utilisateur'
        });
        ObjetConnecte.belongsTo(models.Piece, {
            foreignKey: 'piece_id',
            as: 'piece'
        });
        ObjetConnecte.hasMany(models.DonneeObjet, {
            foreignKey: 'objet_id',
            as: 'donnees'
        });
        ObjetConnecte.hasMany(models.Incident, {
            foreignKey: 'objet_id',
            as: 'incidents'
        });
    };

    return ObjetConnecte;
};
