import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import { registerController } from "./controller/registerController.js";
// import { loginController } from "./controller/loginController.js";
import { userAuth } from "./auth/auth.js";
import { createChallenge } from "./controller/createChallengeController.js";
import { verifyChallenge } from "./controller/verifyChallengeController.js";
import { initUserDB } from "./schemas/userSchema.js";
import { initCredentialDB } from "./schemas/credentialSchema.js";
import { loginOptionsController } from "./controller/loginOptionsContoller.js";
import { loginVerifyController } from "./controller/loginVerifyController.js";
import { initShareDB } from "./schemas/sharesSchema.js";
import { testRedis } from "./controller/redisController.js";
import { sendOptionController } from "./controller/sendOptionController.js";
import { sendVerifyController } from "./controller/sendVerifyController.js";
import { initKeyDB } from "./schemas/sessionKeysSchema.js";
const app = express();
app.use(express.json());
app.use(cors());
// only email needed from the frontend (and jwt wherever needed)
// signup/login
app.post("/api/v1/register", registerController);
// webauthn [registration]
app.get("/api/v1/register-options", userAuth, createChallenge);
app.post("/api/v1/register-verify", userAuth, verifyChallenge);
// webauthn [login]
app.post("/api/v1/login-options", loginOptionsController);
app.post("/api/v1/login-verify", userAuth, loginVerifyController);
// send transaction
app.post("/api/v1/send-options", userAuth, sendOptionController);
app.post("/api/v1/send-verify", userAuth, sendVerifyController);
app.listen(5000, async () => {
    await initUserDB();
    await initCredentialDB();
    await initShareDB();
    await initKeyDB();
    // await testRedis();
    console.log("server is running on port 5000");
});
//# sourceMappingURL=index.js.map