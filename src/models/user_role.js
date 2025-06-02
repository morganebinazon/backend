import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const UserRole = sequelize.define(
  "UserRole",
  {
    userId: {
      type: DataTypes.INTEGER,
      references: { model: "Users", key: "id" },
    },
    roleId: {
      type: DataTypes.INTEGER,
      references: { model: "Roles", key: "id" },
    },
  },
  { timestamps: false }
);

export default UserRole;
