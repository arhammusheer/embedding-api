import { Router } from "express";
import NamespaceController from "../controllers/namespace.controller";
import { generateSlug } from "../utils/utils";
import multer from "multer";

const upload = multer();

const namespacesRoutes = Router();

namespacesRoutes.get("/", NamespaceController.getNamespaces);
namespacesRoutes.post("/", NamespaceController.createNamespace);

namespacesRoutes.get("/:id", NamespaceController.getNamespaceById);
namespacesRoutes.delete("/:id", NamespaceController.deleteNamespace);

namespacesRoutes.get("/:id/files", NamespaceController.getFilesByNamespaceId);
namespacesRoutes.post("/:id/files", upload.single("file"), NamespaceController.uploadFile);

export default namespacesRoutes;
