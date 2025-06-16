// src/controllers/authController.ts
import bcrypt from 'bcrypt';
import { generateAuthToken } from '../utils/auth';
import User from '../models/user.js';
import Compagny from '../models/compagny.js';

export const register = async (req, res) => {
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

    // Validation de base
    if (!email || !password || !phone) {
      return res.status(400).json({ 
        success: false,
        message: 'Email, mot de passe et téléphone sont requis' 
      });
    }

    // Vérification de l'unicité de l'email
    const existingUser = await User.findOne({ where: { email } });
    const existingCompany = await Compagny.findOne({ where: { email } });

    if (existingUser || existingCompany) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà utilisé',
      });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    if (role === 'client') {
      // Inscription d'un client particulier
      if (!firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'Le prénom et le nom sont requis pour un compte client',
        });
      }

      const newUser = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        country,
      });

      // Génération du token JWT
      const token = generateAuthToken({
        id: newUser.id,
        email: newUser.email,
        role: 'client',
      });

      return res.status(201).json({
        success: true,
        message: 'Compte client créé avec succès',
        data: {
          id: newUser.id,
          name: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email,
          phone: newUser.phone,
          role: 'client',
          token,
        },
      });
    } else if (role === 'entreprise') {
      // Inscription d'une entreprise
      if (!companyName || !taxId) {
        return res.status(400).json({
          success: false,
          message: 'Le nom de l\'entreprise et le numéro fiscal sont requis',
        });
      }

      const newCompany = await Compagny.create({
        name: companyName,
        email,
        password: hashedPassword,
        phone,
        tax_identification_number: taxId,
        country,
      });

      // Génération du token JWT
      const token = generateAuthToken({
        id: newCompany.id,
        email: newCompany.email,
        role: 'entreprise',
      });

      return res.status(201).json({
        success: true,
        message: 'Compte entreprise créé avec succès',
        data: {
          id: newCompany.id,
          name: newCompany.name,
          email: newCompany.email,
          phone: newCompany.phone,
          taxId: newCompany.tax_identification_number,
          role: 'entreprise',
          token,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Type de compte invalide',
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de l\'inscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe sont requis',
      });
    }

    // Recherche de l'utilisateur ou de l'entreprise
    const user = await User.findOne({ where: { email } });
    const company = await Compagny.findOne({ where: { email } });

    const account = user || company;
    const accountType = user ? 'user' : 'company';

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects',
      });
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects',
      });
    }

    // Préparation du payload JWT
    const payload = {
      id: account.id,
      email: account.email,
      role: accountType === 'user' ? 'client' : 'entreprise',
      name: accountType === 'user' 
        ? `${account.firstName} ${account.lastName}`
        : account.name,
    };

    // Génération du token avec durée variable selon rememberMe
    const tokenExpiry = rememberMe ? '30d' : '1d';
    const token = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: tokenExpiry,
    });

    // Réponse réussie
    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        token,
        user: {
          id: account.id,
          email: account.email,
          name: payload.name,
          role: payload.role,
          ...(accountType === 'company' && {
            companyName: account.name,
            taxId: account.tax_identification_number,
          }),
        },
      },
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la connexion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};