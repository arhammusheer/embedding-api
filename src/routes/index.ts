import { Router } from "express";
import namespacesRoutes from "./namespaces.routes";
import userRoutes from "./user.routes";
import { userMiddleware } from "../middlewares/user.middleware";
import filesRoutes from "./files.routes";

const router = Router();

router.use("/user", userRoutes);

router.use(userMiddleware); // Protect all routes below this middleware
router.use("/namespaces", namespacesRoutes);
router.use("/files", filesRoutes);

export default router;
