import { Namespace, Prisma } from "@prisma/client";
import { prisma } from "../app";

export default class NamespaceService {
  // Get all namespaces
  public static async getNamespaces(): Promise<Namespace[]> {
    const namespaces = await prisma.namespace.findMany();
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
}
