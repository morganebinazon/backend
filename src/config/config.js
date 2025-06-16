export default {
  JWT_SECRET: process.env.JWT_SECRET || "votre_secret_tres_securise",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
};
