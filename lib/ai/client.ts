import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";

let client: GoogleGenAI | null = null;

/** Lazily-constructed Google Gemini client (server-side only). */
export function getGemini(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }
  return client;
}
