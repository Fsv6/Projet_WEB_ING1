const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Settings = sequelize.define('settings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'settings',
        timestamps: true
    });

    return Settings;
}; 