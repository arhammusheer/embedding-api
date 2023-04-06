import { Router } from "express";
import userController from "../controllers/user.controller";
import { userMiddleware } from "../middlewares/user.middleware";

const userRoutes = Router();

userRoutes.post("/login", userController.login);
userRoutes.post("/register", userController.register);

userRoutes.use(userMiddleware);
userRoutes.get("/", userController.isLoggedIn);
userRoutes.get("/logout", userController.logout);

export default userRoutes;
