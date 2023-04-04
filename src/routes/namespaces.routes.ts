import { Router } from "express";
import multer from "multer";
import NamespaceController from "../controllers/namespace.controller";

const upload = multer({
  storage: multer.memoryStorage(),
});

const namespacesRoutes = Router();

namespacesRoutes.get("/", NamespaceController.getNamespaces);
namespacesRoutes.post("/", NamespaceController.createNamespace);
namespacesRoutes.get("/:id/search", NamespaceController.query);

namespacesRoutes.get("/:id", NamespaceController.getNamespaceById);
namespacesRoutes.delete("/:id", NamespaceController.deleteNamespace);

namespacesRoutes.get("/:id/files", NamespaceController.getFilesByNamespaceId);
namespacesRoutes.post(
  "/:id/files",
  upload.single("file"),
  NamespaceController.uploadFile
);
namespacesRoutes.delete("/:id/files/:fileId", NamespaceController.deleteFile);

namespacesRoutes.post(
  "/:id/files/:fileId/embed",
  NamespaceController.embedFile
);

namespacesRoutes.delete(
  "/:id/files/:fileId/embed",
  NamespaceController.removeEmbeddings
);

export default namespacesRoutes;
