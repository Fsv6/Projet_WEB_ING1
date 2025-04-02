const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    const Utilisateur = sequelize.define('Utilisateur', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom_utilisateur: {
            type: DataTypes.STRING(50),
            unique: true,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(100),
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        mot_de_passe: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                isBcryptHash(value) {
                    // Vérifie si c'est un hash bcrypt (commence par $2a$ ou $2b$)
                    if (!value.match(/^\$2[ab]\$\d+\$/)) {
                        throw new Error('Le mot de passe doit être hashé avec bcrypt');
                    }
                }
            }
        },
        role: {
            type: DataTypes.ENUM('visiteur', 'simple', 'complexe', 'admin'),
            defaultValue: 'simple'
        },
        age: {
            type: DataTypes.INTEGER,
            validate: {
                min: 0
            }
        },
        genre: {
            type: DataTypes.STRING(20)
        },
        date_naissance: {
            type: DataTypes.DATE
        },
        type_membre: {
            type: DataTypes.STRING(50)
        },
        photo_profil: {
            type: DataTypes.STRING(255)
        },
        date_creation: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        nom: {
            type: DataTypes.STRING(100)
        },
        prenom: {
            type: DataTypes.STRING(100)
        },
        niveau: {
            type: DataTypes.ENUM('debutant', 'intermediaire', 'avance', 'expert'),
            defaultValue: 'debutant'
        },
        points_experience: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        is_private_email: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        is_private_name: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'utilisateurs',
        timestamps: true,
        hooks: {
            beforeCreate: async (utilisateur) => {
                // Si le mot de passe n'est pas déjà hashé
                if (!utilisateur.mot_de_passe.startsWith('$2')) {
                    utilisateur.mot_de_passe = await bcrypt.hash(utilisateur.mot_de_passe, 10);
                }
            },
            beforeUpdate: async (utilisateur) => {
                // Si le mot de passe a changé et n'est pas déjà hashé
                if (utilisateur.changed('mot_de_passe') && !utilisateur.mot_de_passe.startsWith('$2')) {
                    utilisateur.mot_de_passe = await bcrypt.hash(utilisateur.mot_de_passe, 10);
                }
            }
        }
    });

    Utilisateur.associate = (models) => {
        Utilisateur.hasMany(models.ObjetConnecte, {
            foreignKey: 'utilisateur_id',
            as: 'objets'
        });
        Utilisateur.hasMany(models.Incident, {
            foreignKey: 'utilisateur_id',
            as: 'incidents'
        });
        Utilisateur.hasMany(models.ActiviteUtilisateur, {
            foreignKey: 'utilisateur_id',
            as: 'activites'
        });
    };

    return Utilisateur;
};
