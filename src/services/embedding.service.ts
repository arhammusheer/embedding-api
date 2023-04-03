import { PineconeClient } from "@pinecone-database/pinecone";
import {
  OPENAI_API_KEY,
  PINECONE_API_KEY,
  PINECONE_ENVIRONMENT,
} from "../config";
import OpenAIService from "./openai.service";

export default class EmbeddingService {
  client: PineconeClient;
  indexName: string = "";
  openAiClient: OpenAIService;

  constructor() {
    this.client = new PineconeClient();

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
    const chunks = this.openAiClient.createChunks(data, 1000);

    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const response = await this.openAiClient.createEmbedding(chunk);
        return response.data;
      })
    );
		
  }
}
