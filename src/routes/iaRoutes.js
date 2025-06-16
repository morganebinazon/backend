import express from "express";
import { chatbot, getChatHistory, clearHistory } from "../controllers/iaController.js";

const router = express.Router();

// Route pour le chatbot
router.post("/chatbot", chatbot);

// Route pour récupérer l'historique des conversations (optionnel)
router.get("/history", getChatHistory);

// Route pour effacer l'historique
router.delete("/history", clearHistory);

export default router;