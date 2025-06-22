import { generatePassword } from "../utils/passwordGenerator.js";
import { sendWelcomeEmail } from "../services/emailService.js";
// import { createLog } from '../services/logService.js';
import Employee from "../models/employee.js";
import Compagny from "../models/compagny.js";
import User from "../models/user.js";
import sequelize from "../db.js";

/**
 * @desc    Créer un nouvel employé par une entreprise
 * @route   POST /api/companies/:companyId/employees
 * @access  Private (Entreprise authentifiée)
 */
export const createEmployee = async (req, res) => {
  const { companyId } = req.params;
  const { firstName, lastName, email, position, department, salary } = req.body;

  try {
    // 1. Validation des données d'entrée
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Les champs email, prénom et nom sont obligatoires",
      });
    }

    // 2. Vérifier que l'entreprise existe
    const company = await Compagny.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Entreprise non trouvée",
      });
    }

    // 3. Vérifier que l'email n'est pas déjà utilisé dans Employee, User ou Company
    const [existingEmployee, existingUser, existingCompany] = await Promise.all(
      [
        Employee.findOne({ where: { email } }),
        User.findOne({ where: { email } }),
        Compagny.findOne({ where: { email } }),
      ]
    );

    if (existingEmployee || existingUser || existingCompany) {
      return res.status(400).json({
        success: false,
        message:
          "Cet email est déjà utilisé par un employé, un utilisateur ou une entreprise",
      });
    }

    // 4. Générer un mot de passe temporaire
    const temporaryPassword = generatePassword(12);

    // 5. Création transaction pour s'assurer de l'intégrité des données
    const transaction = await sequelize.transaction();

    try {
      // 6. Créer l'employé dans la transaction
      const employee = await Employee.create(
        {
          firstName,
          lastName,
          email,
          password: temporaryPassword, // Le mot de passe sera hashé dans le hook beforeCreate
          position,
          department,
          salary,
          company_id: companyId,
          status: "active",
        },
        { transaction }
      );

      // 7. Envoyer l'email de bienvenue avec les infos de connexion
      try {
        await sendWelcomeEmail({
          to: email,
          subject: `Bienvenue chez ${company.name}`,
          firstName,
          lastName,
          email,
          temporaryPassword,
          companyName: company.name,
        });
      } catch (emailError) {
        // Annuler la transaction si l'email ne peut pas être envoyé
        await transaction.rollback();
        console.error("Erreur envoi email:", emailError);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'envoi de l'email de bienvenue",
        });
      }

      // 8. Valider la transaction si tout s'est bien passé
      await transaction.commit();

      // 9. Journaliser l'action
      // await createLog({
      //   action: 'EMPLOYEE_CREATED',
      //   description: `Nouvel employé créé: ${firstName} ${lastName}`,
      //   userId: req.user.id,
      //   companyId
      // });

      // 10. Retourner la réponse (sans le mot de passe)
      const employeeData = employee.toJSON();
      delete employeeData.password;

      return res.status(201).json({
        success: true,
        message: "Employé créé avec succès",
        data: employeeData,
      });
    } catch (error) {
      // Rollback en cas d'erreur pendant la transaction
      if (transaction.finished !== "commit") {
        await transaction.rollback();
      }
      throw error;
    }
  } catch (error) {
    console.error("Erreur création employé:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Récupérer la liste des employés d'une entreprise
 * @route   GET /api/companies/:companyId/employees
 * @access  Private (Entreprise authentifiée)
 */
export const getCompanyEmployees = async (req, res) => {
  const { companyId } = req.params;
  const {
    page = 1,
    limit = 10,
    sort = "lastName",
    order = "ASC",
    search = "",
    status,
  } = req.query;

  try {
    // 1. Vérifier que l'entreprise existe et que l'utilisateur y a accès
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Entreprise non trouvée",
      });
    }

    // 2. Vérifier les permissions (l'utilisateur doit appartenir à cette entreprise)
    if (req.user.companyId !== parseInt(companyId)) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé à accéder à ces ressources",
      });
    }

    // 3. Préparer les options de requête
    const offset = (page - 1) * limit;
    const whereClause = {
      company_id: companyId,
    };

    // Filtre par statut si spécifié
    if (status && ["active", "on_leave", "terminated"].includes(status)) {
      whereClause.status = status;
    }

    // Filtre de recherche
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { position: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // 4. Exécuter la requête avec pagination et tri
    const { count, rows } = await Employee.findAndCountAll({
      where: whereClause,
      attributes: {
        exclude: ["password"], // Ne pas retourner les mots de passe
      },
      order: [[sort, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // 5. Formater la réponse
    const totalPages = Math.ceil(count / limit);
    const currentPage = parseInt(page);

    // 6. Journaliser l'action
    // await createLog({
    //   action: 'EMPLOYEES_LISTED',
    //   description: `Liste des employés consultée - Page ${page}`,
    //   userId: req.user.id,
    //   companyId
    // });

    // 7. Retourner la réponse
    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage,
        itemsPerPage: parseInt(limit),
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        prevPage: currentPage > 1 ? currentPage - 1 : null,
      },
    });
  } catch (error) {
    console.error("Erreur récupération employés:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des employés",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
