import { Router } from "express";
import authRoutes from "./authRoutes.js";
import iaRoutes from "./iaRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/ia", iaRoutes);

export default router;