const { configDotenv } = require("dotenv");

configDotenv();

const dbConfig = {
  host: process.env.DB_HOST,
  dialect: process.env.DB_CONNECTION,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
};

module.exports = {
  development: {
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    host: dbConfig.host,
    dialect: dbConfig.dialect,
  },
  test: {
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    host: dbConfig.host,
    dialect: dbConfig.dialect,
  },
  production: {
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    host: dbConfig.host,
    dialect: dbConfig.dialect,
  },
};
