import User from "./user.js";
import Role from "./roles.js";
import UserRole from "./user_role.js";

// Many-to-Many association
User.belongsToMany(Role, { through: UserRole, foreignKey: "userId" });
Role.belongsToMany(User, { through: UserRole, foreignKey: "roleId" });

export { User, Role, UserRole };
