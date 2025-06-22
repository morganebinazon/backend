import { Router } from "express";
import authRoutes from "./authRoutes.js";
import iaRoutes from "./iaRoutes.js";
import employeeRoutes from "./employee.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/ia", iaRoutes);
router.use("/employee", employeeRoutes);

export default router;