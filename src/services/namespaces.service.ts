import { Namespace, Prisma } from "@prisma/client";
import { prisma } from "../app";
import StorageService from "./gcs.service";
import { BUCKET_NAME } from "../config";

export default class NamespaceService {
  // Get all namespaces
  public static async getNamespaces(userId?: string): Promise<Namespace[]> {
    // Get namespace by user / if no userid, get all namespaces
    if (!userId) {
      const namespaces = await prisma.namespace.findMany();
      return namespaces;
    }

    const namespaces = await prisma.namespace.findMany({
      include: {
        user: {
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return namespaces;
  }

  // Get a namespace by id
  public static async getNamespaceById(id: string): Promise<Namespace | null> {
    const namespace = await prisma.namespace.findUnique({
      where: { id },
    });
    return namespace;
  }

  // Create a namespace
  public static async createNamespace(
    data: Prisma.NamespaceCreateInput
  ): Promise<Namespace> {
    const namespace = await prisma.namespace.create({
      data,
    });
    return namespace;
  }

  // Delete a namespace
  public static async deleteNamespace(id: string): Promise<Namespace> {
    // Cleanup all files in the namespace
    const files = await prisma.files.findMany({
      where: { namespaceId: id },
    });

    const gcp = new StorageService(BUCKET_NAME);

    files.forEach(async (file) => {
      await gcp.deleteFile(file.name);
    });

    // Delete the files in the namespace
    await prisma.files.deleteMany({
      where: { namespaceId: id },
    });

    // Delete the namespace
    const namespace = await prisma.namespace.delete({
      where: { id },
    });
    return namespace;
  }

  // Check if a namespace exists
  public static async namespaceExists(id: string): Promise<boolean> {
    const namespace = await prisma.namespace.findUnique({
      where: { id },
    });
    return !!namespace;
  }

  // Get all files in a namespace
  public static async getFilesByNamespaceId(
    id: string
  ): Promise<Namespace | null> {
    const namespace = await prisma.namespace.findUnique({
      where: { id },
      include: {
        files: true,
      },
    });
    return namespace;
  }

  // Upload a file to a namespace
  public static async uploadFile(
    namespaceId: string,
    data: Express.Multer.File
  ): Promise<Namespace | null> {
    const gcp = new StorageService(BUCKET_NAME);

    const filename = `/files/${namespaceId}/${data.originalname}`;
    const url = `/files/${namespaceId}/${data.originalname}`;
    const file = data.buffer;

    // Add file to database
    const namespace = await prisma.namespace.update({
      where: { id: namespaceId },
      data: {
        files: {
          create: {
            name: filename,
            url,
            bucket: BUCKET_NAME,
            embedStatus: false,
          },
        },
      },
      include: {
        files: true,
      },
    });

    // Add file to GCP
    await gcp.uploadFile(filename, file, {
      contentType: data.mimetype,
    });

    return namespace;
  }

  // Delete a file from a namespace
  public static async deleteFile(
    namespaceId: string,
    fileId: string
  ): Promise<Namespace | null> {
    // Delete file from GCP
    const file = await prisma.files.findUnique({
      where: { id: fileId },
    });

    if (file) {
      const gcp = new StorageService(BUCKET_NAME);
      await gcp.deleteFile(file.name);
    }

    // Delete file from database
    const namespace = await prisma.namespace.update({
      where: { id: namespaceId },
      data: {
        files: {
          delete: {
            id: fileId,
          },
        },
      },
      include: {
        files: true,
      },
    });

    return namespace;
  }

  public static async doesUserOwnNamespace(
    userId: string,
    namespaceId: string
  ): Promise<boolean> {
    const namespace = await prisma.namespace.findUnique({
      where: { id: namespaceId },
      include: {
        user: true,
      },
    });

    if (!namespace) {
      return false;
    }

    // if namespace.user array has userId, return true
    const nsUser = namespace.user.find((user) => user.id === userId);

    if (!nsUser) {
      return false;
    }

    return true;
  }
}
