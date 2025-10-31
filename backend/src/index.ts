import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Load environment variables
dotenv.config();

// Import middleware and controllers
import logger from "./config/logger.js";
import { userAuth } from "./auth/auth.js";
import { registerOptionController } from "./controller/registerOptionController.js";
import { registerVerifyController } from "./controller/registerVerifyController.js";
import { initUserDB } from "./schemas/userSchema.js";
import { initCredentialDB } from "./schemas/credentialSchema.js";
import { loginOptionsController } from "./controller/loginOptionsContoller.js";
import { loginVerifyController } from "./controller/loginVerifyController.js";
import { sendOptionController } from "./controller/sendOptionController.js";
import { sendVerifyController } from "./controller/sendVerifyController.js";
import { initKeyDB } from "./schemas/sessionKeysSchema.js";
import { getRedisClient } from "./config/redis.js";

// ---------------------------------------------------------------------
// Express App Setup
// ---------------------------------------------------------------------
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["https://www.id-map.shop", "http://localhost:5173"], // or "*" if no credentials
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
  })
);

// ---------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------

// WebAuthn Registration
app.post("/api/v1/register-options", registerOptionController);
app.post("/api/v1/register-verify", registerVerifyController); // TODO: decide if userAuth is required

// WebAuthn Login
app.post("/api/v1/login-options", loginOptionsController);
app.post("/api/v1/login-verify", userAuth, loginVerifyController);

// Transaction Signing
app.post("/api/v1/send-options", userAuth, sendOptionController);
app.post("/api/v1/send-verify", userAuth, sendVerifyController);

// TODO: add one endpoint to return all the user transactions, transaction table needs to be created

// ---------------------------------------------------------------------
// Server Initialization
// ---------------------------------------------------------------------
getRedisClient();

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    logger.info("Initializing databases...");

    await initUserDB();
    await initCredentialDB();
    await initKeyDB();

    logger.info("All databases initialized successfully");
    logger.info(`Server started successfully on port ${PORT}`);
  } catch (err) {
    logger.error({ err }, "Failed to initialize application");
    process.exit(1); // exit process on critical startup failure
  }
});
