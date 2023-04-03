import { Router } from "express";
import NamespaceController from "../controllers/namespace.controller";
import { generateSlug } from "../utils/utils";

const namespacesRoutes = Router();

namespacesRoutes.get("/", NamespaceController.getNamespaces);
namespacesRoutes.get("/:id", NamespaceController.getNamespaceById);

namespacesRoutes.post("/", NamespaceController.createNamespace);

export default namespacesRoutes;
