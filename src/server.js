require('dotenv').config();
const app = require('./app');
// const connectDB = require('./config/db'); // Si vous avez un fichier pour la connexion DB

const PORT = process.env.PORT || 5001; // Port différent de votre React app

// connectDB(); // Connexion à la base de données

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});