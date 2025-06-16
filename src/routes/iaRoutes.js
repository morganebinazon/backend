import express from "express";
import { chatbot, getChatHistory } from "../controllers/iaController.js";

const router = express.Router();

// Route pour le chatbot
router.post("/chatbot", chatbot);

// Route pour récupérer l'historique des conversations (optionnel)
router.get("/history", getChatHistory);

export default router;