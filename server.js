import express from "express";
import dotenv from "dotenv";
import cors from "./startup/cors.js";
import routes from "./startup/routes.js";
import dbConnection from "./startup/db-connection.js";
import config from "./startup/config.js";
import validation from "./startup/validation.js";

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

// Startup
cors(app);
routes(app);
dbConnection();
config();
validation();

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
