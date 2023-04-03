import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const BUCKET_NAME = process.env.BUCKET_NAME || "croissant-file-uploads";
export const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
export const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT || "dev";

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";