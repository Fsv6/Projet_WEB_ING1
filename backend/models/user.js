const mongoose = require('mongoose');

// Supprimer l'ancien modèle s'il existe
delete mongoose.models.User;

// Créer le nouveau schéma User
const userSchema = new mongoose.Schema({
    personne: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Personne', 
        required: true 
    },
    famille: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Famille' 
    },
    email: { 
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    login: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true 
    },
    photo: { 
        type: String, 
        default: null 
    },
    isValidated: { 
        type: Boolean, 
        default: false 
    },
    role: { 
        type: String, 
        enum: ['visiteur', 'simple', 'complexe', 'admin'], 
        default: 'simple' 
    },
    niveau: { 
        type: String, 
        enum: ['débutant', 'intermédiaire', 'avancé', 'expert'], 
        default: 'débutant' 
    },
    points: { 
        type: Number, 
        default: 0 
    }
}, {
    // Ajouter les timestamps (createdAt, updatedAt)
    timestamps: true
});

// Middleware pour s'assurer que l'email et le login sont en minuscules avant la sauvegarde
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  if (this.isModified('login')) {
    this.login = this.login.toLowerCase();
  }
  next();
});

// Créer et exporter le nouveau modèle
const User = mongoose.model('User', userSchema);
module.exports = User;

