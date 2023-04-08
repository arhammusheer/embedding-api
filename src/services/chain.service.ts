import { OPENAI_API_KEY } from "../config";
import EmbeddingService from "./embedding.service";
import OpenAIService, {
  AvailableModels,
  OpenAIMessage,
} from "./openai.service";

export default class ChainService {
  private openai: OpenAIService;
  private embedding: EmbeddingService;

  constructor() {
    this.openai = new OpenAIService(OPENAI_API_KEY);
    this.embedding = new EmbeddingService();
  }

  public async chat(
    messages: OpenAIMessage[],
    model: AvailableModels,
    namespace: string
  ) {
    const primer = `You are Q&A bot. A highly intelligent system that answers
		user questions based on the information provided by the user above
		each question. If the information can not be found in the information
		provided by the user you truthfully say "RETRY". If the information
		can be found you answer the question truthfully. You are a Q&A bot.`;

    const getContextQuery = await this.conversationalSummarization(
      messages,
      model
    );
    
    if (!getContextQuery) return null;
    const context = await this.getContext(getContextQuery, namespace);

    const contexualizedMessage = await this.contexualizeMessage(
      messages[messages.length - 1].content,
      context
    );

    // Replace the last message with the contexualized message
    messages[messages.length - 1].content = contexualizedMessage;

    // Remove top system message
    messages.shift();

    // Add primer
    messages.unshift({
      content: primer,
      role: "system",
    });

    const response = await this.openai.chat(messages, model);

    return response.data.choices[0].message?.content;
  }

  public async conversationalSummarization(
    messages: OpenAIMessage[],
    model: AvailableModels
  ) {
    const primer =
      "You are a conversation summarizer. You will summarize all past conversation into a one line summary to be a search query";
    // Remove top system message
    messages.shift();
    // Add primer
    messages.unshift({
      content: primer,
      role: "system",
    });
    const response = await this.openai.chat(messages, model);

    console.log(response)

    return response.data.choices[0].message?.content;
  }

  public async getContext(query: string, namespace: string) {
    const queryVector = await this.embedding.generateEmbedding(query);
    const context = await this.embedding.searchEmbedding(
      queryVector[0],
      namespace,
      3
    );

    if (!context.matches) return [];

    const contextArray = context.matches.map((match) => {
      const text = match.metadata ? (match.metadata as any)["text"] : "";
      const source = match.metadata ? (match.metadata as any)["fileName"] : "";
      return {
        score: match.score,
        content: text,
        source: source,
      };
    });

    return contextArray;
  }

  public async contexualizeMessage(
    message: string,
    context: {
      score: number | undefined;
      content: any;
      source: any;
    }[]
  ) {
    const contextString = context
      .map((context) => {
        return `Context:
				score: ${context.score}
				source: ${context.source}
				content: ${context.content}
				---
				`;
      })
      .join("\n");

    const messageString = `Message:
			${message}`;

    return contextString + messageString;
  }
}
