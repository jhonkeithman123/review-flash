import { DitroyClient, HealthStatus } from "@131fgh/ditroy-client";

export const DITROY_RENDER_URL = "https://ditroy.onrender.com";

/**
 * Resolves the active DITroy API endpoint.
 * Auto-corrects typo 'ditroy-ai.onrender.com' to 'ditroy.onrender.com'.
 */
export function getResolvedDitroyUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_DITROY_API_URL || process.env.DITROY_API_URL;
  if (!envUrl || envUrl.trim() === "" || envUrl.includes("ditroy-ai.onrender.com")) {
    return DITROY_RENDER_URL;
  }
  return envUrl.trim();
}

/**
 * Universal DITroy AI client instance for Review Flash.
 * Connects to the cloud DITroy AI backend on Render (https://ditroy.onrender.com) or custom override.
 */
export const ditroyClient = new DitroyClient({
  baseUrl: getResolvedDitroyUrl(),
  timeoutMs: 90000,
});


export interface GeneratedFlashcard {
  question: string;
  answer: string;
  tags?: string[];
  difficulty?: number; // 1 to 5
}

export interface FlashcardGenerationResult {
  cards: GeneratedFlashcard[];
  rawReply: string;
  isAiGenerated: boolean;
  error?: string;
}

/**
 * Check DITroy AI health and model status.
 */
export async function checkDITroyHealth(): Promise<{
  online: boolean;
  status?: string;
  model?: string;
  modelStatus?: string;
  message?: string;
}> {
  try {
    const health = await ditroyClient.getHealth();
    return {
      online: health.status === "ok" || Boolean(health.service),
      status: health.status,
      model: health.model,
      modelStatus: health.model_status,
      message: health.message,
    };
  } catch (error: any) {
    return {
      online: false,
      message: error?.message || "DITroy AI backend unreachable",
    };
  }
}

/**
 * Robustly parses JSON from LLM output (handles markdown code blocks, backticks, conversational preamble).
 */
function extractJsonFromReply(reply: string): any {
  if (!reply) return null;

  // 1. Try direct JSON parse
  try {
    return JSON.parse(reply);
  } catch {}

  // 2. Try extracting from ```json ... ``` or ``` ... ```
  const codeBlockMatch = reply.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  // 3. Try finding the outer JSON array [ ... ]
  const arrayMatch = reply.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {}
  }

  // 4. Try finding the outer JSON object { ... }
  const objMatch = reply.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {}
  }

  return null;
}

/**
 * Smart AI Parser with dual modes:
 * - "detect-qa": Finds, extracts, and cleans existing questions and answers in messy or irregular text.
 * - "from-context": Reads raw notes, lecture transcripts, or textbook chapters and synthesizes new Q&A cards covering key concepts.
 */
export async function smartAutoDetectWithAI(
  rawContent: string,
  mode: "detect-qa" | "from-context" = "from-context",
  options?: {
    topic?: string;
    cardCount?: number;
    tags?: string[];
  }
): Promise<FlashcardGenerationResult> {
  const cardCount = options?.cardCount || 5;
  const topic = options?.topic ? `Topic / Subject: "${options.topic}"\n` : "";

  let taskInstruction = "";
  if (mode === "detect-qa") {
    taskInstruction = `Your task is to AUTO-DETECT and EXTRACT existing Question & Answer pairs from the following unformatted, reviewer, or irregular text.
Carefully separate what is being asked (Question) from what the correct response, definition, or answer is (Answer).
Extract up to ${cardCount} clean Question and Answer pairs.`;
  } else {
    taskInstruction = `Your task is to READ AND SYNTHESIZE exactly ${cardCount} comprehensive, high-yield flashcard Question & Answer pairs from the provided context, notes, or lecture excerpt.
Extract the most important core definitions, key principles, comparison points, and testable facts from the context.`;
  }

  const prompt = `You are DITroy, an expert educational AI flashcard creator.
${taskInstruction}

${topic}Input Content:
"""
${rawContent.slice(0, 5000)}
"""

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON array of objects without conversational filler or markdown preamble.
- Each object MUST follow this schema:
  - "question": clear question prompt or definition query (string)
  - "answer": accurate, complete, concise answer or term (string)
  - "difficulty": integer from 1 (easy) to 5 (hard) (number)
  - "tags": array of 1 to 3 relevant topic keywords (string[])

Example JSON output:
[
  {
    "question": "What is the primary function of mitochondria?",
    "answer": "To generate most of the chemical energy (ATP) for cellular processes.",
    "difficulty": 2,
    "tags": ["Biology", "Cell"]
  }
]`;

  try {
    const response = await ditroyClient.chat({
      message: prompt,
      conversation_id: "smart-detect-" + Date.now(),
    });

    const parsed = extractJsonFromReply(response.reply);

    if (Array.isArray(parsed) && parsed.length > 0) {
      const validCards: GeneratedFlashcard[] = parsed
        .filter((item) => item && (item.question || item.q) && (item.answer || item.a))
        .map((item) => ({
          question: String(item.question || item.q).trim(),
          answer: String(item.answer || item.a).trim(),
          tags: Array.isArray(item.tags)
            ? item.tags.map((t: any) => String(t).trim()).filter(Boolean)
            : options?.tags || ["AI-Detected"],
          difficulty:
            typeof item.difficulty === "number" && item.difficulty >= 1 && item.difficulty <= 5
              ? Math.round(item.difficulty)
              : 3,
        }));

      if (validCards.length > 0) {
        return {
          cards: validCards,
          rawReply: response.reply,
          isAiGenerated: true,
        };
      }
    } else if (parsed && typeof parsed === "object" && Array.isArray(parsed.cards)) {
      const validCards: GeneratedFlashcard[] = parsed.cards
        .filter((item: any) => item && (item.question || item.q) && (item.answer || item.a))
        .map((item: any) => ({
          question: String(item.question || item.q).trim(),
          answer: String(item.answer || item.a).trim(),
          tags: Array.isArray(item.tags)
            ? item.tags.map((t: any) => String(t).trim()).filter(Boolean)
            : options?.tags || ["AI-Detected"],
          difficulty:
            typeof item.difficulty === "number" && item.difficulty >= 1 && item.difficulty <= 5
              ? Math.round(item.difficulty)
              : 3,
        }));

      if (validCards.length > 0) {
        return {
          cards: validCards,
          rawReply: response.reply,
          isAiGenerated: true,
        };
      }
    }

    // Fallback heuristic parsing of raw reply if model didn't return strict JSON
    const lines = response.reply.split("\n").map((l) => l.trim()).filter(Boolean);
    const fallbackCards: GeneratedFlashcard[] = [];
    let currentQ = "";

    for (const line of lines) {
      const qMatch = line.match(/^(?:Q(?:uestion)?\s*[:\.\d\-]*\s*)(.+)/i);
      const aMatch = line.match(/^(?:A(?:nswer)?\s*[:\.\d\-]*\s*)(.+)/i);

      if (qMatch) {
        currentQ = qMatch[1].trim();
      } else if (aMatch && currentQ) {
        fallbackCards.push({
          question: currentQ,
          answer: aMatch[1].trim(),
          tags: options?.tags || ["AI-Detected"],
          difficulty: 3,
        });
        currentQ = "";
      }
    }

    if (fallbackCards.length > 0) {
      return {
        cards: fallbackCards,
        rawReply: response.reply,
        isAiGenerated: true,
      };
    }

    return {
      cards: [],
      rawReply: response.reply,
      isAiGenerated: false,
      error: "Could not extract flashcard pairs from AI reply",
    };
  } catch (err: any) {
    return {
      cards: [],
      rawReply: "",
      isAiGenerated: false,
      error: err?.message || "Failed to reach DITroy AI service",
    };
  }
}

/**
 * Generates structured flashcards from unstructured text, lecture notes, or study topics.
 */
export async function generateFlashcardsWithAI(
  rawContent: string,
  options?: {
    topic?: string;
    cardCount?: number;
    tags?: string[];
  }
): Promise<FlashcardGenerationResult> {
  return smartAutoDetectWithAI(rawContent, "from-context", options);
}



import {
  loadLearnedFactsFromFirebase,
  saveAiMessageToFirebase,
  saveLearnedFactToFirebase,
  StoredAiMessage,
} from "./aiMemoryService";

/**
 * Ask DITroy Study Tutor for guidance, mnemonics, hints, or explanations.
 * Automatically synchronizes context and message history with Firebase Firestore.
 */
export async function askStudyTutor(
  userQuery: string,
  context?: {
    currentCard?: { question: string; answer: string; tags?: string[]; difficulty?: number };
    deckTitle?: string;
    mode?: "review" | "test" | "general";
  },
  conversationId: string = "review-flash-tutor"
): Promise<string> {
  let contextPrompt = "";

  if (context?.currentCard) {
    contextPrompt = `\n[Current Flashcard Context:
- Question: "${context.currentCard.question}"
- Answer: "${context.currentCard.answer}"
${context.deckTitle ? `- Deck: "${context.deckTitle}"` : ""}
${context.mode ? `- Mode: ${context.mode}` : ""}
]\n`;
  }

  // Retrieve persistent study facts stored in Firebase Firestore
  let learnedFactsPrompt = "";
  try {
    const facts = await loadLearnedFactsFromFirebase();
    if (facts.length > 0) {
      learnedFactsPrompt = `\n[Learned Facts & Student Profile from Firebase Memory:\n${facts.slice(-10).map((f) => `• ${f}`).join("\n")}\n]\n`;
    }
  } catch (err) {
    console.warn("Could not load learned facts from Firebase:", err);
  }

  const systemInstruction = `You are DITroy, an intelligent and friendly personal AI Study Tutor for Review Flash.
Your goal is to help the student learn effectively using spaced repetition, active recall, clear explanations, relatable analogies, and memory mnemonics.
Keep your responses helpful, concise, well-formatted, and encouraging.

${learnedFactsPrompt}${contextPrompt}
Student Query: "${userQuery}"`;

  // 1. Save user query to Firebase Firestore
  const userMsgId = "user-" + Date.now();
  void saveAiMessageToFirebase(conversationId, {
    id: userMsgId,
    role: "user",
    content: userQuery,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    createdAt: Date.now(),
    cardContext: context?.currentCard ? {
      question: context.currentCard.question,
      answer: context.currentCard.answer,
      deckTitle: context.deckTitle,
    } : undefined,
  }, context?.deckTitle ? `${context.deckTitle} Tutor Session` : undefined);

  try {
    const response = await ditroyClient.chat({
      message: systemInstruction,
      conversation_id: conversationId,
    });

    const reply = response.reply;

    // 2. Save AI reply to Firebase Firestore
    const aiMsgId = "ai-" + Date.now();
    void saveAiMessageToFirebase(conversationId, {
      id: aiMsgId,
      role: "assistant",
      content: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: Date.now(),
    });

    // 3. If the user shared a fact or card concept, persist to long-term Firebase memory
    if (context?.currentCard?.question && context?.currentCard?.answer) {
      void saveLearnedFactToFirebase(
        `Concept: ${context.currentCard.question} = ${context.currentCard.answer}`
      );
    }

    return reply;
  } catch (error: any) {
    throw new Error(error?.message || "Failed to get reply from DITroy AI Tutor.");
  }
}

export * from "./aiMemoryService";
export * from "@131fgh/ditroy-client";

