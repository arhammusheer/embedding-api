import { Router } from "express";
import filesController from "../controllers/files.controller";

const filesRoutes = Router();

filesRoutes.get("/*", filesController.getFileByPath);

export default filesRoutes;
