import { NextFunction, Request, Response } from "express";
import NamespaceService from "../services/namespaces.service";
import ChainService from "../services/chain.service";

const chain = new ChainService();

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

  deleteFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, fileId } = req.params;

      const namespaceExists = await NamespaceService.namespaceExists(id);
      if (!namespaceExists) {
        return res.status(400).json({
          status: "error",
          message: "Namespace does not exist",
        });
      }

      const fileExists = await NamespaceService.fileExists(fileId);
      if (!fileExists) {
        return res.status(400).json({
          status: "error",
          message: "File does not exist",
        });
      }

      const file = await NamespaceService.deleteFile(id, fileId);

      res.status(200).json({
        status: "success",
        data: file,
      });
    } catch (error) {
      next(error);
    }
  },

  embedFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, fileId } = req.params;

      const namespaceExists = await NamespaceService.namespaceExists(id);
      if (!namespaceExists) {
        return res.status(400).json({
          status: "error",
          message: "Namespace does not exist",
        });
      }

      const fileExists = await NamespaceService.fileExists(fileId);
      if (!fileExists) {
        return res.status(400).json({
          status: "error",
          message: "File does not exist",
        });
      }

      const file = await NamespaceService.embedFile(fileId);

      res.status(200).json({
        status: "success",
        data: file,
      });
    } catch (error) {
      next(error);
    }
  },

  query: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { q, limit } = req.query;
      const l = limit ? parseInt(limit as string) : 10;

      if (!q) {
        return res.status(400).json({
          status: "error",
          message: "Query is required",
        });
      }

      const namespaceExists = await NamespaceService.namespaceExists(id);
      if (!namespaceExists) {
        return res.status(400).json({
          status: "error",
          message: "Namespace does not exist",
        });
      }

      const files = await NamespaceService.searchEmbedding(id, q as string, l);
      res.status(200).json({
        status: "success",
        data: files,
      });
    } catch (error) {
      next(error);
    }
  },

  removeEmbeddings: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, fileId } = req.params;

      const namespaceExists = await NamespaceService.namespaceExists(id);
      if (!namespaceExists) {
        return res.status(400).json({
          status: "error",
          message: "Namespace does not exist",
        });
      }

      const fileExists = await NamespaceService.fileExists(fileId);
      if (!fileExists) {
        return res.status(400).json({
          status: "error",
          message: "File does not exist",
        });
      }

      const file = await NamespaceService.removeEmbeddings(fileId);

      res.status(200).json({
        status: "success",
        data: file,
      });
    } catch (error) {
      next(error);
    }
  },

  chat: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const namespaceExists = await NamespaceService.namespaceExists(id);
      if (!namespaceExists) {
        return res.status(400).json({
          status: "error",
          message: "Namespace does not exist",
        });
      }

      const messages = req.body.messages;

      if (!messages) {
        return res.status(400).json({
          status: "error",
          message: "Messages are required",
        });
      }

      // Check if message is {content: string, role: "user" | "assistant" | "system"}
      const validMessages = messages.every((message: any) => {
        return (
          message.content &&
          typeof message.content === "string" &&
          message.role &&
          ["user", "assistant", "system"].includes(message.role)
        );
      });

      if (!validMessages) {
        return res.status(400).json({
          status: "error",
          message:
            "Messages must be an array of {content: string, role: 'user' | 'assistant' | 'system'}",
        });
      }

      // Add system message if first message is not from system
      if (messages[0].role !== "system") {
        messages.unshift({
          content: "You are a helpful assistant.",
          role: "system",
        });
      }

      const response = await chain.chat(messages, "gpt-4", id);

      res.status(200).json({
        status: "success",
        data: response,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default NamespaceController;
