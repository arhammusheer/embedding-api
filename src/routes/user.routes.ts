import { Router } from "express";
import userController from "../controllers/user.controller";

const userRoutes = Router();

userRoutes.post("/login", userController.login);
userRoutes.post("/register", userController.register);

export default userRoutes;
