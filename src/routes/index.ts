import { Router } from "express";
import namespacesRoutes from "./namespaces.routes";

const router = Router();

router.use("/namespaces", namespacesRoutes);

export default router;
