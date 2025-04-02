const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Piece = sequelize.define('Piece', {
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
        }
    }, {
        tableName: 'pieces',
        timestamps: true
    });

    Piece.associate = (models) => {
        Piece.hasMany(models.ObjetConnecte, {
            foreignKey: 'piece_id',
            as: 'objets'
        });
    };

    return Piece;
};
