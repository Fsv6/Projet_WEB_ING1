const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const objetsRoutes = require('./routes/objets');
const recettesRoutes = require('./routes/recettes');
const userRoutes = require('./routes/users');
const historyRoutes = require('./routes/history');







const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'))
app.use('/api/familles', require('./routes/famille'));
app.use('/api/history', historyRoutes);

connectDB();

app.use('/api/users', userRoutes)
app.use('/api/auth', authRoutes);
app.use('/api/objets', objetsRoutes);
app.use('/api/recettes', recettesRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.send('API MaCuisineConnectée est en ligne !');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
