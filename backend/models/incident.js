const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Incident = sequelize.define('Incident', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        objet_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'objets_connectes',
                key: 'id'
            }
        },
        utilisateur_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'utilisateurs',
                key: 'id'
            }
        },
        date_incident: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        statut: {
            type: DataTypes.ENUM('ouvert', 'fermé', 'en cours'),
            defaultValue: 'ouvert'
        }
    }, {
        tableName: 'incidents',
        timestamps: true
    });

    Incident.associate = (models) => {
        Incident.belongsTo(models.ObjetConnecte, {
            foreignKey: 'objet_id',
            as: 'objet'
        });
        Incident.belongsTo(models.Utilisateur, {
            foreignKey: 'utilisateur_id',
            as: 'utilisateur'
        });
    };

    return Incident;
};
