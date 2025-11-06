import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { getFormattedHistory } from "./chat-memory";
import { geminiAgent } from "./gemini-agent";

// Initialize Google Generative AI with your API key
// This is kept as a backup in case the agent is not available
const getGeminiModel = () => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY environment variable is not set");
  }
  
  return new ChatGoogleGenerativeAI({
    apiKey,
    modelName: "gemini-2.0-flash",
    maxOutputTokens: 2048,
    temperature: 0.7,
  });
};

// Create a system prompt template for e-commerce assistant
// This is kept for backward compatibility but now we'll primarily use the agent
const systemPromptTemplate = PromptTemplate.fromTemplate(`
You are NBDAStore's AI shopping assistant for a clothing e-commerce store. 
Your goal is to provide helpful, friendly, and concise responses to customer inquiries.

Store information:
- NBDAStore specializes in trendy clothing and fashion accessories
- We offer worldwide shipping with free shipping on orders over $100
- Our return policy allows returns within 30 days of delivery
- We accept all major credit/debit cards, PayPal, and bank transfers
- Customer support is available Monday-Friday, 9am-5pm EST
- Since our shop is 100% online, we have a virtual try-on feature to help you try on clothes before buying.

Current user: {userName}
User question: {question}

{conversationHistory}

Respond in a friendly, helpful tone. Keep responses concise but informative.
If you don't know something specific about the store's inventory or policies beyond what's provided, 
acknowledge that and offer to connect the user with customer support for more detailed information.
`);

// Create a chain that combines the prompt template with the model
export const createChatChain = () => {
  const model = getGeminiModel();
  const outputParser = new StringOutputParser();
  
  return RunnableSequence.from([
    systemPromptTemplate,
    model,
    outputParser,
  ]);
};

// Function to generate a response using the GeminiAgent
export async function generateAIResponse(
  question: string,
  userName: string = "Customer",
  sessionId: string = "default"
): Promise<{
  response: string;
  used_database: boolean;
  context?: string;
}> {
  try {
    // Get the conversation history
    const conversationHistory = getFormattedHistory(sessionId);
    console.log(`Using conversation history for session ${sessionId}:`,
      conversationHistory ? "History available" : "No history yet");
    
    // Add conversation history as context for better responses
    const enhancedQuestion = conversationHistory
      ? `${question}\n\nPrevious conversation:\n${conversationHistory}`
      : question;

    // Process the query through the GeminiAgent
    const result = await geminiAgent.processQuery(enhancedQuestion);

    // Return the full result object
    return result;
  } catch (error) {
    console.error("Error generating AI response:", error);
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
    }

    // Fallback to the old method if the agent fails
    try {
      console.log("Falling back to standard Gemini model...");
      const chain = createChatChain();
      const conversationHistory = getFormattedHistory(sessionId);

      const response = await chain.invoke({
        question,
        userName,
        conversationHistory: conversationHistory
          ? `\nConversation history:\n${conversationHistory}\n`
          : ""
      });

      // Return in the same format as the agent for compatibility
      return {
        response,
        used_database: false,
        context: undefined
      };
    } catch (fallbackError) {
      return {
        response: "I'm sorry, I'm having trouble processing your request right now. Please try again later or contact our customer support team for assistance.",
        used_database: false,
        context: undefined
      };
    }
  }
}
