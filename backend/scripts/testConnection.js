const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' }); // <-- très précis


const testConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connexion à MongoDB réussie !');
        await mongoose.connection.close();
        console.log('✅ Connexion fermée proprement.');
    } catch (error) {
        console.error('❌ Échec de connexion à MongoDB :', error.message);
        process.exit(1);
    }
};

testConnection();