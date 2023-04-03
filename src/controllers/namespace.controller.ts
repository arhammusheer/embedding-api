import { NextFunction, Request, Response } from "express";
import NamespaceService from "../services/namespaces.service";
import { generateSlug } from "../utils/utils";

const NamespaceController = {
  getNamespaces: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.user.id;
      const namespaces = await req.user.getNamespaces();
      res.status(200).json({
        status: "success",
        data: namespaces,
      });
    } catch (error) {
      next(error);
    }
  },

  getNamespaceById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const namespace = await req.user.getNamespaceById(req.params.id);
      res.status(200).json({
        status: "success",
        data: namespace,
      });
    } catch (error) {
      next(error);
    }
  },

  createNamespace: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          status: "error",
          message: "Name is required",
        });
      }

      const namespace = await req.user.createNamespace(name);

      res.status(200).json({
        status: "success",
        data: namespace,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteNamespace: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const namespace = await req.user.deleteNamespace(req.params.id);
      res.status(200).json({
        status: "success",
        data: namespace,
      });
    } catch (error) {
      next(error);
    }
  },

  getFilesByNamespaceId: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const files = await NamespaceService.getFilesByNamespaceId(req.params.id);
      res.status(200).json({
        status: "success",
        data: files,
      });
    } catch (error) {
      next(error);
    }
  },

  uploadFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { file } = req;
      const { id } = req.params;

      if (!file) {
        return res.status(400).json({
          status: "error",
          message: "File is required",
        });
      }
      // Only txt and pdf files are allowed
      const allowedMimeTypes = ["text/plain", "application/pdf"];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
          status: "error",
          message: "Only txt and pdf files are allowed",
        });
      }

      const namespaceExists = await NamespaceService.namespaceExists(id);
      if (!namespaceExists) {
        return res.status(400).json({
          status: "error",
          message: "Namespace does not exist",
        });
      }

      const fileData = await NamespaceService.uploadFile(id, file);

      res.status(200).json({
        status: "success",
        data: fileData,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default NamespaceController;
