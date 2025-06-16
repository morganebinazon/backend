import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import sequelize from "./db.js";
import router from "./routes/index.js";
// import swaggerSetup from './src/swagger.js';
import { fileURLToPath } from "url";
import path from "path";
// import ErrorHandingMiddleware from './src/middleware/ErrorHandingMiddleware.js';

const PORT = process.env.PORT || 5000;
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Apply CORS middleware
app.use(cors());

// HTTP request logging
app.use(morgan("dev"));

// Parse JSON bodies
app.use(express.json());

// Static file serving
// app.use('/api/v1/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use('/api/v1/apks', express.static(path.join(__dirname, 'apks')));

// API routes
app.use("/api/v1", router);

// Swagger documentation
// swaggerSetup(app);

// Error handling middleware
// app.use(ErrorHandingMiddleware);

// Connect to database and start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    sequelize
      .sync({ alter: true })
      .then(() => {
        console.log("Base synchronisée");
      })
      .catch((err) => {
        console.error("Erreur de synchronisation :", err);
      });
    app.listen(PORT, () => {
      if (process.env.NODE_ENV === "development") {
        process.stdout.write(`Server running on port ${PORT}\n`);
      }
    });
  } catch (error) {
    process.stderr.write(`Database connection error: ${error.message}\n`);
    process.exit(1);
  }
};

startServer();
