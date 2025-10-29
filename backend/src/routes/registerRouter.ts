import { Router } from "express";
import { registerController } from "../controller/registerController.js";

const registerRouter = Router();

registerRouter.post("/", registerController);