const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  personne: { type: mongoose.Schema.Types.ObjectId, ref: 'Personne', required: true },
  login : { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  photo: { type: String, default: null },
  isValidated: { type: Boolean, default: false },
  role: { type: String, enum: ['simple', 'complexe', 'admin'], default: 'simple' },
  niveau: { type: String, enum: ['débutant', 'intermédiaire', 'avancé', 'expert'], default: 'débutant' },
  points: { type: Number, default: 0 }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

