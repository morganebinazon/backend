// src/controllers/authController.ts
import bcrypt from "bcrypt";
import User from "../models/user.js";
import Compagny from "../models/compagny.js";
import { generateAuthToken } from "../utils/auth.js";
import sequelize from "../db.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import Employee from "../models/employee.js";

export const register = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      name,
      email,
      password,
      phone,
      country,
      role,
      firstName,
      lastName,
      companyName,
      taxId,
    } = req.body;

    if (!email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "Email, mot de passe et téléphone sont requis",
      });
    }

    const existingUser = await User.findOne({ where: { email }, transaction });
    const existingCompany = await Compagny.findOne({
      where: { email },
      transaction,
    });

    if (existingUser || existingCompany) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    if (role === "client") {
      if (!firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: "Le prénom et le nom sont requis pour un compte client",
        });
      }

      const newUser = await User.create(
        {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          phone,
          country,
        },
        { transaction }
      );

      const token = generateAuthToken({
        id: newUser.id,
        email: newUser.email,
        role: "client",
      });

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: "Compte client créé avec succès",
        data: {
          id: newUser.id,
          name: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email,
          phone: newUser.phone,
          role: "client",
          token,
        },
      });
    } else if (role === "entreprise") {
      if (!companyName || !taxId) {
        return res.status(400).json({
          success: false,
          message: "Le nom de l'entreprise et le numéro fiscal sont requis",
        });
      }

      const newCompany = await Compagny.create(
        {
          name: companyName,
          email,
          password: hashedPassword,
          phone,
          tax_identification_number: taxId,
          country,
        },
        { transaction }
      );

      const token = generateAuthToken({
        id: newCompany.id,
        email: newCompany.email,
        role: "entreprise",
      });

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: "Compte entreprise créé avec succès",
        data: {
          id: newCompany.id,
          name: newCompany.name,
          email: newCompany.email,
          phone: newCompany.phone,
          taxId: newCompany.tax_identification_number,
          role: "entreprise",
          token,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Type de compte invalide",
      });
    }
  } catch (error) {
    await transaction.rollback();
    console.error("Erreur lors de l'inscription:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'inscription",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe sont requis",
      });
    }

    // Recherche de l'utilisateur ou de l'entreprise
    const user = await User.findOne({ where: { email } });
    const company = await Compagny.findOne({ where: { email } });
    const employee = await Employee.findOne({ where: { email } });

    const account = user || company || employee;
    let accountType;
    if (user) {
      accountType = "user";
    } else if (company) {
      accountType = "company";
    } else if (employee) {
      accountType = "employee";
    } else {
      accountType = null;
    }

    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
      });
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
      });
    }

    // Préparation du payload JWT
    const payload = {
      id: account.id,
      email: account.email,
      role:
        accountType === "user"
          ? "client"
          : accountType === "company"
          ? "entreprise"
          : "employee",
      name:
        accountType === "user"
          ? `${account.firstName} ${account.lastName}`
          : accountType === "company"
          ? account.name
          : `${account.firstName} ${account.lastName}`,
    };

    // Génération du token avec durée variable selon rememberMe
    const tokenExpiry = rememberMe ? "30d" : "1d";
    const token = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: tokenExpiry,
    });

    // Réponse réussie
    res.json({
      success: true,
      message: "Connexion réussie",
      data: {
        token,
        user: {
          id: account.id,
          email: account.email,
          name: payload.name,
          role: payload.role,
          ...(accountType === "company" && {
            companyName: account.name,
            taxId: account.tax_identification_number,
          }),
          ...(accountType === "employee" && {
            position: account.position,
            department: account.department,
            companyId: account.company_id,
          }),
        },
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la connexion",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
