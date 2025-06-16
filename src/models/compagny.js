import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const Compagny = sequelize.define("compagny", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  secteur: { type: DataTypes.STRING, allowNull: true },
  ifu: { type: DataTypes.STRING, allowNull: true },
  tax_identification_number: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
});

export default Compagny;
