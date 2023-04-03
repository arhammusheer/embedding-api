import { NextFunction, Request, Response } from "express";
import NamespaceService from "../services/namespaces.service";
import { generateSlug } from "../utils/utils";

const NamespaceController = {
  getNamespaces: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const namespaces = await NamespaceService.getNamespaces();
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
      const namespace = await NamespaceService.getNamespaceById(req.params.id);
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

      const namespace = await NamespaceService.createNamespace({
        name,
        slug: generateSlug(name),
      });

      res.status(200).json({
        status: "success",
        data: namespace,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default NamespaceController;
