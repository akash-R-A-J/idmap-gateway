import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

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

const app = express();
app.use(express.json());
app.use(cors());

// only email needed from the frontend (and jwt token wherever needed)

// webauthn [registration]
app.get("/api/v1/register-options", userAuth, registerOptionController);
app.post("/api/v1/register-verify", userAuth, registerVerifyController);

// webauthn [login]
app.post("/api/v1/login-options", loginOptionsController);
app.post("/api/v1/login-verify", userAuth, loginVerifyController);

// send transaction
app.post("/api/v1/send-options", userAuth, sendOptionController);
app.post("/api/v1/send-verify", userAuth, sendVerifyController);

app.listen(5000, async () => {
  await initUserDB();
  await initCredentialDB();
  await initKeyDB();
  console.log("server is running on port 5000");
});
