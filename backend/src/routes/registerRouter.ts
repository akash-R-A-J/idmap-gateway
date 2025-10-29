import { Router } from "express";
import { registerController } from "../utils/registerController.js";

const registerRouter = Router();

registerRouter.post("/", registerController);