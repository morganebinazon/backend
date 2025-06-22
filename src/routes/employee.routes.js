import express from "express";
import {
  createEmployee,
  getCompanyEmployees,
} from "../controllers/employee.controller.js";
// import { protect, checkCompany } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/:companyId/employees", createEmployee);
router.get("/:companyId/employees", getCompanyEmployees);
export default router;
