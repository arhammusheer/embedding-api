import { Configuration, OpenAIApi } from "openai";

const EMBEDDING_ENGINE = "text-embedding-ada-002";

export interface OpenAIMessage {
  content: string;
  role: "user" | "assistant" | "system";
}

export type AvailableModels = "gpt-3.5-turbo" | "gpt-4";

export default class OpenAIService {
  API_KEY: string = "";
  client: OpenAIApi;

  constructor(API_KEY: string) {
    this.API_KEY = API_KEY;

    const config = new Configuration({
      apiKey: this.API_KEY,
    });

    this.client = new OpenAIApi(config);
  }

  createEmbedding(chunk: string) {
    const response = this.client.createEmbedding({
      input: chunk,
      model: EMBEDDING_ENGINE,
    });

    return response;
  }

  createChunks(text: string, chunkSize: number): string[] {
    const chunks = [];
    const words = text.split(" ");

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(" ");
      chunks.push(chunk);
    }

    return chunks;
  }

  async chat(messages: OpenAIMessage[], model: AvailableModels) {
    const response = await this.client.createChatCompletion({
      messages,
      model,
    });

    return response;
  }
}
