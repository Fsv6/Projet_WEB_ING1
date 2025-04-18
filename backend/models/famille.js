const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Famille = sequelize.define('Famille', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom_famille: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        code_famille: {
            type: DataTypes.STRING(20),
            unique: true,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        date_creation: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'familles',
        timestamps: false
    });

    Famille.associate = (models) => {
        Famille.hasMany(models.Utilisateur, {
            foreignKey: 'famille_id',
            as: 'membres',
            onDelete: 'CASCADE'
        });
    };

    // Méthode pour générer un code famille unique
    Famille.generateFamilyCode = async () => {
        const prefix = 'FAM';
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const potentialCode = `${prefix}${randomNum}`;
        
        // Vérifier si le code existe déjà
        const existingFamily = await Famille.findOne({
            where: { code_famille: potentialCode }
        });

        if (existingFamily) {
            // Si le code existe, générer un nouveau
            return Famille.generateFamilyCode();
        }

        return potentialCode;
    };

    return Famille;
}; 