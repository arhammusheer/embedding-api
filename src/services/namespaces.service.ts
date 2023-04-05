import { VectorFromJSON } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import { Namespace, Prisma } from "@prisma/client";
import { prisma } from "../app";
import { BUCKET_NAME } from "../config";
import EmbeddingService from "./embedding.service";
import StorageService from "./gcs.service";
import LoaderService from "./loaders.service";

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
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        files: true,
      },
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

    // Delete embeddings from pinecone
    const embeddings = await prisma.embedding.findMany({
      where: { fileId },
    });

    const embeddingIds = embeddings.map((embedding) => embedding.id);

    const embed = new EmbeddingService();
    await embed.deleteEmbeddings(embeddingIds, namespaceId);

    // Delete embeddings from database
    await prisma.embedding.deleteMany({
      where: { fileId },
    });

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

  public static async fileExists(fileId: string): Promise<boolean> {
    const file = await prisma.files.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return false;
    }

    // Verify file exists in gcp
    const gcp = new StorageService(BUCKET_NAME);
    const fileExists = await gcp.fileExists(file.name);

    if (!fileExists) {
      // Delete file from database
      this.deleteFile(file.namespaceId, fileId);
      return false;
    }

    return !!file;
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

  public static async embedFile(fileId: string) {
    const file = await prisma.files.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error("File not found");
    }

    // Check if file is already embedded
    if (file.embedStatus) {
      throw new Error("File is already embedded");
    }

    const gcp = new StorageService(BUCKET_NAME);
    const fileExists = await gcp.fileExists(file.name);

    if (!fileExists) {
      this.deleteFile(file.namespaceId, fileId);
      return null;
    }

    const g_file = await gcp.getFile(file.name);
    const [metadata] = await g_file.getMetadata();
    const [fileContent] = await g_file.download();
    const loader = new LoaderService();
    const fileData = await loader.load(fileContent, metadata.contentType);

    const embedding = new EmbeddingService();
    const embeds = await embedding.generateEmbedding(fileData);
    const chunks = embedding.getChunks(fileData);

    const vectors = embeds.map((embed, i) => {
      const v = {
        id: `${fileId}-index-${i}`,
        values: embed,
        metadata: {
          fileName: file.name,
          index: i,
          text: chunks[i],
        },
      };

      const vector = VectorFromJSON(v);

      return vector;
    });

    const upsert = await embedding.upsertEmbedding(
      vectors,
      file.namespaceId,
      fileId
    );

    if (upsert) {
      await prisma.files.update({
        where: { id: fileId },
        data: {
          embedStatus: true,
        },
      });
    }

    return upsert;
  }

  public static async removeEmbeddings(fileId: string) {
    const embed = new EmbeddingService();
    const file = await prisma.files.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error("File not found");
    }

    const embeddings = await prisma.embedding.findMany({
      where: { fileId },
    });

    const embeddingIds = embeddings.map((embedding) => embedding.id);

    await embed.init();
    await embed.deleteEmbeddings(embeddingIds, file.namespaceId);

    await prisma.embedding.deleteMany({
      where: { fileId },
    });

    await prisma.files.update({
      where: { id: fileId },
      data: {
        embedStatus: false,
      },
    });

    return true;
  }

  public static async searchEmbedding(
    namespaceId: string,
    query: string,
    limit: number
  ) {
    const embedding = new EmbeddingService();

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Check if embedding.setup is true else wait
    if (!embedding.setup) {
      await wait(500);
    }

    const queryVector = await embedding.generateEmbedding(query);

    const searchQuery = Promise.all(
      queryVector.map(async (vector) => {
        const search = await embedding.searchEmbedding(
          vector,
          namespaceId,
          limit
        );
        return search;
      })
    );

    const results = await searchQuery;
    return results;
  }
}
