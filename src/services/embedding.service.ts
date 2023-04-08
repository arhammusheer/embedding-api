import { PineconeClient, Vector } from "@pinecone-database/pinecone";
import {
  OPENAI_API_KEY,
  PINECONE_API_KEY,
  PINECONE_ENVIRONMENT,
} from "../config";
import OpenAIService from "./openai.service";
import { prisma } from "../app";

export default class EmbeddingService {
  client: PineconeClient;
  indexName: string = "";
  openAiClient: OpenAIService;
  setup: boolean = false;

  constructor() {
    this.client = new PineconeClient();
    this.setIndex("gpt-4-langchain-docs");
    this.init();
    this.openAiClient = new OpenAIService(OPENAI_API_KEY);
  }

  async init() {
    if (!this.client) {
      this.client = new PineconeClient();
    }

    await this.client.init({
      apiKey: PINECONE_API_KEY,
      environment: PINECONE_ENVIRONMENT,
    });

    const indexes = await this.listIndexes();
    if (indexes.length === 0) {
      await this.createIndex("gpt-4-langchain-docs", 1536);
    }

    console.log(indexes);

    this.setup = true;
  }

  async createIndex(name: string, dimension: number) {
    const index = await this.client.createIndex({
      createRequest: {
        name,
        dimension,
      },
    });

    return index;
  }

  async listIndexes() {
    const indexes = await this.client.listIndexes();
    return indexes;
  }

  async deleteIndex(name: string) {
    const index = await this.client.deleteIndex({
      indexName: name,
    });
    return index;
  }

  async setIndex(indexName: string) {
    this.indexName = indexName;
  }

  async generateEmbedding(data: any) {
    const chunks = this.openAiClient.createChunks(data, 200);

    const batchSizes = 5;
    const batches = Math.ceil(chunks.length / batchSizes);

    let embeddings = [] as number[][];
    for (let i = 0; i < batches; i++) {
      const batch = chunks.slice(i * batchSizes, (i + 1) * batchSizes);
      const batchEmbeddings = await Promise.all(
        batch.map(async (chunk) => {
          try {
            const response = await this.openAiClient.createEmbedding(chunk);
            return response.data.data[0].embedding;
          } catch (error) {
            console.log(error);
            return [];
          }
        })
      );

      embeddings = [...embeddings, ...batchEmbeddings];
    }

    return embeddings;
  }

  getChunks(data: any) {
    const chunks = this.openAiClient.createChunks(data, 200);
    return chunks;
  }

  async upsertEmbedding(data: Vector[], namespace: string, fileId: string) {
    const index = this.client.Index(this.indexName);

    const response = await index.upsert({
      upsertRequest: {
        vectors: data,
        namespace,
      },
    });

    await Promise.all(
      data.map(async (vector) => {
        const meta = vector.metadata as any;
        const content = meta.content;

        await prisma.embedding.create({
          data: {
            id: vector.id,
            value: vector.values,
            content: content || "",
            file: {
              connect: {
                id: fileId,
              },
            },
          },
        });
      })
    );

    return response;
  }

  async searchEmbedding(
    data: number[],
    namespace: string,
    limit: number = 10
  ) {
    const index = this.client.Index(this.indexName);
    const response = await index.query({
      queryRequest: {
        vector: data,
        namespace,
        topK: limit,
        includeMetadata: true,
      },
    });

    return response
  }

  async deleteEmbeddings(vectorIds: string[], namespace: string) {
    const index = this.client.Index(this.indexName);
    const response = await index.delete1({
      ids: vectorIds,
      namespace,
    });

    return response;
  }
}
