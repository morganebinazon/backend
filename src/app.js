const express = require('express');
const cors = require('cors');

// Importer vos routeurs
// const simulationRoutes = require('./routes/simulationRoutes');
// const authRoutes = require('./routes/authRoutes');

const app = express();

// Options CORS (ajustez selon vos besoins en production)
const corsOptions = {
  origin: 'http://localhost:5173', // L'URL de votre frontend React (Vite par défaut)
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json()); // Pour parser le corps des requêtes en JSON

// Utiliser vos routes
// app.use('/api/simulation', simulationRoutes);
// app.use('/api/auth', authRoutes);
// ... autres routes pour les employés, entreprises, etc.

app.get('/', (req, res) => { // Route de test
  res.send('PayeAfrique Backend is running!');
});

// Middleware de gestion d'erreurs (à ajouter)

// Dans src/app.js
const simulationRoutes = require('./routes/simulationRoutes');
app.use('/api/simulation', simulationRoutes);

// src/app.js
// ...

// ...

module.exports = app;