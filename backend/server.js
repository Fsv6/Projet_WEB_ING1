const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const objetsRoutes = require('./routes/objets');
const recettesRoutes = require('./routes/recettes');
const userRoutes = require('./routes/users');
const historyRoutes = require('./routes/history');
const familleRoutes = require('./routes/famille');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'))

connectDB();

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/objets', objetsRoutes);
app.use('/api/recettes', recettesRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/familles', familleRoutes);

app.get('/', (req, res) => {
    res.send('API MaCuisineConnectée est en ligne !');
});

// Route temporaire pour afficher tous les utilisateurs
app.get('/api/test-users', async (req, res) => {
    try {
        const users = await require('./models/User').find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs', error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
