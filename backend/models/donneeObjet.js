const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DonneeObjet = sequelize.define('DonneeObjet', {
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
        type_donnee: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        valeur: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        date_relevee: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        unite_mesure: {
            type: DataTypes.STRING(20)
        }
    }, {
        tableName: 'donnees_objets',
        timestamps: true
    });

    DonneeObjet.associate = (models) => {
        DonneeObjet.belongsTo(models.ObjetConnecte, {
            foreignKey: 'objet_id',
            as: 'objet'
        });
    };

    return DonneeObjet;
};
