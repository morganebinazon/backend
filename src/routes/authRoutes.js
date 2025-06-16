import express from "express";
import authController from "../controllers/authController.js";
const { register, login } = authController;
const router = express.Router();

router.post("/register", register);
router.post("/login", login);

export default router;
