import { Router } from "express";
import NamespaceController from "../controllers/namespace.controller";
import { generateSlug } from "../utils/utils";

const namespacesRoutes = Router();

namespacesRoutes.get("/", NamespaceController.getNamespaces);
namespacesRoutes.post("/", NamespaceController.createNamespace);

namespacesRoutes.get("/:id", NamespaceController.getNamespaceById);
namespacesRoutes.delete("/:id", NamespaceController.deleteNamespace);

export default namespacesRoutes;
