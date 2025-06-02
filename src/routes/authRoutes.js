import express from "express";
import {
  register,
  login,
  me,
  logout,
  changePassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", me);

router.post("/logout", logout);

router.post("/change-password", changePassword);

export default router;
