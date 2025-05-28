// src/routes/simulationRoutes.js
const express = require('express');
const simulationController = require('../controllers/simulationController'); // Mettez à jour le chemin si nécessaire
// const authMiddleware = require('../middlewares/authMiddleware'); // Décommentez si authentification requise

const router = express.Router();

// POST /api/simulation/brut-to-net
router.post('/brut-to-net', simulationController.simulateBrutToNet);

// POST /api/simulation/net-to-brut (à implémenter)
// router.post('/net-to-brut', simulationController.simulateNetToBrut);

module.exports = router;