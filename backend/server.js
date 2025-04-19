const express = require('express');
const connectDB = require('./db');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api', authRoutes);
app.get('/', (req, res) => {
    res.send('API MaCuisineConnectée est en ligne !');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
