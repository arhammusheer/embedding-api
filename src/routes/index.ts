import { Router } from "express";
import namespacesRoutes from "./namespaces.routes";
import userRoutes from "./user.routes";
import { userMiddleware } from "../middlewares/user.middleware";

const router = Router();

router.use("/user", userRoutes);

router.use(userMiddleware); // Protect all routes below this middleware
router.use("/namespaces", namespacesRoutes);

export default router;
