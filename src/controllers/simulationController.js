// src/controllers/simulationController.js
const simulationService = require('../services/simulationService');

const simulateBrutToNet = async (req, res) => {
  try {
    const { grossSalary, country, familyStatus, children, otherAllowances } = req.body;

    if (grossSalary === undefined || !country) {
      return res.status(400).json({ message: "Le salaire brut et le pays sont requis." });
    }

    const simulationParams = {
      grossSalary: parseFloat(grossSalary),
      country,
      familyStatus,
      childrenCount: children ? parseInt(children) : 0,
      otherAllowances // ex: { transport: 25000, housing: 50000 }
    };

    // Appel au service qui contient la logique de calcul
    const result = await simulationService.calculateBrutToNet(simulationParams);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in simulateBrutToNet controller:", error);
    res.status(500).json({ message: error.message || "Erreur lors de la simulation." });
  }
};

// Vous ajouterez ici d'autres fonctions comme simulateNetToBrut, etc.
// const simulateNetToBrut = async (req, res) => { /* ... */ };

module.exports = {
  simulateBrutToNet,
  // simulateNetToBrut
};