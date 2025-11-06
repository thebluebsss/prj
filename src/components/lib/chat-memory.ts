import { prisma } from "@/lib/prisma";

// Define types for our chat memory
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  userId?: string;
}

// In-memory store for chat sessions (will be lost on server restart)
// For production, consider using Redis or a database
const chatSessions = new Map<string, ChatSession>();

/**
 * Get or create a chat session
 */
export function getChatSession(sessionId: string, userId?: string): ChatSession {
  if (!chatSessions.has(sessionId)) {
    chatSessions.set(sessionId, {
      id: sessionId,
      messages: [],
      userId
    });
  }
  
  return chatSessions.get(sessionId)!;
}

/**
 * Add a message to a chat session
 */
export function addMessageToSession(
  sessionId: string, 
  message: Omit<ChatMessage, "timestamp">,
  userId?: string
): ChatSession {
  const session = getChatSession(sessionId, userId);
  
  session.messages.push({
    ...message,
    timestamp: new Date()
  });
  
  // Limit history to last 10 messages to prevent context from getting too large
  if (session.messages.length > 20) {
    session.messages = session.messages.slice(-20);
  }
  
  return session;
}

/**
 * Get the conversation history formatted for the LLM
 */
export function getFormattedHistory(sessionId: string): string {
  const session = getChatSession(sessionId);
  
  if (session.messages.length === 0) {
    return "";
  }
  
  return session.messages
    .map(msg => `${msg.role === "user" ? "Customer" : "Assistant"}: ${msg.content}`)
    .join("\n\n");
}

/**
 * Clear a chat session
 */
export function clearChatSession(sessionId: string): void {
  chatSessions.delete(sessionId);
}
