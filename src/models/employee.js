import { DataTypes } from "sequelize";
import sequelize from "../db.js";
import Compagny from "./compagny.js";
import bcrypt from "bcrypt";

const Employee = sequelize.define(
  "employee",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        // Hash automatiquement le mot de passe avant sauvegarde
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(value, salt);
        this.setDataValue("password", hash);
      },
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
    },
    hireDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    salary: {
      type: DataTypes.DECIMAL(15, 2), // ✅ Changé de (10, 2) à (15, 2)
      allowNull: false,
      // ✅ Ajout d'une validation pour éviter les valeurs négatives
      validate: {
        min: 0,
        max: 9999999999999.99, // 13 chiffres avant la virgule + 2 après
      },
    },
    status: {
      type: DataTypes.ENUM("active", "on_leave", "terminated"),
      defaultValue: "active",
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "compagnies", // <-- match the actual table name
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    timestamps: true, // Ajoute createdAt et updatedAt automatiquement
    paranoid: true, // Active la suppression douce (soft delete)
  }
);

// Relations (à définir dans un fichier séparé ou après la définition des modèles)
// Employee.belongsTo(Company, { foreignKey: 'company_id' });

Employee.prototype.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

export default Employee;

Compagny.hasMany(Employee, { foreignKey: "company_id" });
Employee.belongsTo(Compagny, { foreignKey: "company_id" });