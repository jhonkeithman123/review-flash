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

/**
 * Smart Heuristic Distractor Generator
 * Produces logically relative, domain-accurate alternatives based on question/answer semantics
 * (e.g. function keys, ports, years, numbers, booleans, or closely scored deck sibling terms).
 */
export function generateHeuristicSmartDistractors(
  card: { question: string; answer: string; tags?: string[] },
  poolCards: Array<{ id?: string; answer: string; tags?: string[]; difficulty?: number }> = [],
  difficultyLevel: number = 1
): string[] {
  const ans = card.answer.trim();
  const q = card.question.trim().toLowerCase();

  // 1. BIOS Keys & Keyboard shortcuts (e.g., "F5", "F2", "Del", "Esc", "F12")
  if (/^F([1-9]|1[0-2])$/i.test(ans) || /^(Del|Delete|Esc|Escape|Enter|Tab|F2|F12|F8|F10)$/i.test(ans)) {
    const biosKeys = ["F2", "Del", "F12", "F10", "F1", "F8", "Esc", "Tab", "F11", "Enter", "Pause"];
    const filtered = biosKeys.filter((k) => k.toLowerCase() !== ans.toLowerCase());
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  // 2. Common Networking Ports (e.g., "80", "443", "22", "21", "53", "3306", "8080")
  if (/^(80|443|22|21|23|25|53|110|143|3306|5432|8080|3000|27017|6379)$/.test(ans)) {
    const ports = ["80", "443", "22", "21", "25", "53", "3306", "5432", "8080", "110", "143", "23"];
    const filtered = ports.filter((p) => p !== ans);
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  // 3. HTTP Status Codes (e.g., "404", "200", "500", "401", "403")
  if (/^(1\d\d|2\d\d|3\d\d|4\d\d|5\d\d)$/.test(ans) || /(status code|http)/i.test(q)) {
    const httpCodes = ["200", "201", "301", "302", "400", "401", "403", "404", "409", "500", "502", "503"];
    const filtered = httpCodes.filter((c) => c !== ans && !ans.includes(c));
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  // 4. Pure Numbers & Integer Offsets
  const numMatch = ans.match(/^-?\d+(\.\d+)?$/);
  if (numMatch) {
    const val = parseFloat(ans);
    const deltas =
      difficultyLevel >= 3
        ? [-1, 1, 2, -2]
        : difficultyLevel === 2
        ? [-5, 5, 2, -2, 10, -10]
        : [-10, 10, 20, 50, -20, 100];
    const generated = deltas
      .map((d) => (Number.isInteger(val) ? String(Math.round(val + d)) : (val + d).toFixed(2)))
      .filter((n) => n !== ans && parseFloat(n) >= 0);
    if (generated.length >= 3) {
      return [...new Set(generated)].slice(0, 3);
    }
  }

  // 5. 4-Digit Years
  if (/^\d{4}$/.test(ans)) {
    const year = parseInt(ans, 10);
    const diffs = difficultyLevel >= 3 ? [-1, 1, 2, -2] : [-4, 4, 10, -10, 2, -2];
    return diffs.map((d) => String(year + d)).slice(0, 3);
  }

  // 6. Boolean / Binary terms
  if (/^(true|false|yes|no)$/i.test(ans)) {
    const isTrue = /^(true|yes)$/i.test(ans);
    return isTrue ? ["False", "Null", "Undefined"] : ["True", "Null", "Undefined"];
  }

  // 7. Semantic matching from pool cards
  const candidates = poolCards.filter(
    (c) => c.answer.trim().toLowerCase() !== ans.toLowerCase()
  );

  const scored = candidates.map((cand) => {
    let score = Math.random();

    // Shared tags boost
    const sharedTags = (cand.tags || []).filter((t) => (card.tags || []).includes(t)).length;
    score += sharedTags * 5;

    // Difficulty similarity boost
    const diffDelta = Math.abs((cand.difficulty || 3) - 3);
    score += (5 - diffDelta) * 1.5;

    // Length similarity boost (so multiple choice options look balanced)
    const lenDelta = Math.abs(cand.answer.length - ans.length);
    if (lenDelta < 15) score += 3.5;
    if (lenDelta < 6) score += 2.5;

    return { answer: cand.answer.trim(), score };
  });

  scored.sort((a, b) => b.score - a.score);

  const distractorAnswers: string[] = [];
  for (const s of scored) {
    if (!distractorAnswers.includes(s.answer) && s.answer.toLowerCase() !== ans.toLowerCase()) {
      distractorAnswers.push(s.answer);
    }
    if (distractorAnswers.length >= 3) break;
  }

  // Fallback domain-consistent phrases if pool is small
  const fallbackGeneric = [
    "Alternative standard configuration",
    "Inverse functional parameter",
    "Secondary contextual condition",
    "External protocol specification",
  ];
  let fIdx = 0;
  while (distractorAnswers.length < 3) {
    const f = fallbackGeneric[fIdx % fallbackGeneric.length];
    if (!distractorAnswers.includes(f) && f.toLowerCase() !== ans.toLowerCase()) {
      distractorAnswers.push(f);
    }
    fIdx++;
  }

  return distractorAnswers.slice(0, 3);
}

/**
 * Generates 3 intelligent, plausible, and logically relative multiple-choice distractor options
 * for a flashcard using DITroy AI with caching and graceful heuristic fallback.
 *
 * Difficulty levels:
 * - Level 1: Standard (plausible options in the general domain)
 * - Level 2: Close Concepts (same sub-category, related sibling items)
 * - Level 3: Advanced Near-Misses (highly nuanced, tricky edge cases, commonly confused sibling terms)
 */
export async function generateSmartDistractorsWithAI(
  card: { id?: string; question: string; answer: string; tags?: string[] },
  options?: {
    difficultyLevel?: number;
    deckTitle?: string;
    poolCards?: Array<{ id?: string; answer: string; tags?: string[]; difficulty?: number }>;
  }
): Promise<string[]> {
  const level = options?.difficultyLevel || 1;
  const cacheKey = `rf_ai_dist_${card.id || card.question.slice(0, 30)}_${level}`;

  // 1. Check local cache
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          return parsed.slice(0, 3);
        }
      }
    } catch {}
  }

  const levelDescription =
    level >= 3
      ? "Level 3 (Advanced / Hard: Highly nuanced near-misses, tricky edge cases, commonly confused sibling concepts, highly plausible alternatives)"
      : level === 2
      ? "Level 2 (Medium / Close Concepts: Same immediate sub-category, closely related sibling terms of the exact same type/format)"
      : "Level 1 (Standard: Plausible options in the same general subject domain)";

  const prompt = `You are DITroy, an expert educational assessment engine for Review Flash.
Generate exactly 3 SMART, PLAUSIBLE, and LOGICALLY RELATIVE multiple-choice DISTRACTOR options (wrong answers) for this flashcard question.

Context / Subject: "${options?.deckTitle || "Study Set"}"
Question: "${card.question}"
Correct Answer: "${card.answer}"
Target Difficulty: ${levelDescription}

CRITICAL RULES:
1. The 3 distractors MUST match the EXACT concept category, logical type, and formatting of the correct answer:
   - If the answer is a keyboard key (e.g., "F5"), distractors MUST be real keyboard keys (e.g., ["F2", "Del", "F12"]).
   - If the answer is an organelle (e.g., "Mitochondria"), distractors MUST be real organelles (e.g., ["Ribosome", "Golgi apparatus", "Endoplasmic reticulum"]).
   - If the answer is a command (e.g., "chmod"), distractors MUST be real related commands (e.g., ["chown", "ls -l", "umask"]).
   - If the answer is a number/year, distractors MUST be realistic close values in the same context.
2. None of the 3 distractors may be synonymous with or equivalent to the correct answer.
3. Return ONLY a valid JSON array of 3 strings: ["Option 1", "Option 2", "Option 3"]`;

  try {
    const response = await ditroyClient.chat({
      message: prompt,
      conversation_id: "distractors-" + (card.id || Date.now()),
    });

    const parsed = extractJsonFromReply(response.reply);
    if (Array.isArray(parsed) && parsed.length >= 3) {
      const cleaned = parsed
        .map((p) => String(p).trim())
        .filter((p) => p.length > 0 && p.toLowerCase() !== card.answer.trim().toLowerCase())
        .slice(0, 3);

      if (cleaned.length === 3) {
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(cleaned));
          } catch {}
        }
        return cleaned;
      }
    }
  } catch (err) {
    console.warn("DITroy AI distractor fallback triggered:", err);
  }

  // 2. Fallback to smart heuristic if AI call fails or is offline
  return generateHeuristicSmartDistractors(card, options?.poolCards || [], level);
}

/**
 * Batch generates smart distractors for multiple cards in 1 efficient AI request.
 */
export async function generateBatchSmartDistractorsWithAI(
  cards: Array<{ id: string; question: string; answer: string; tags?: string[] }>,
  options?: {
    difficultyLevel?: number;
    deckTitle?: string;
    poolCards?: Array<{ id?: string; answer: string; tags?: string[]; difficulty?: number }>;
  }
): Promise<Record<string, string[]>> {
  const level = options?.difficultyLevel || 1;
  const results: Record<string, string[]> = {};
  const uncachedCards: Array<{ id: string; question: string; answer: string; tags?: string[] }> = [];

  // Check cache for each card
  for (const card of cards) {
    const cacheKey = `rf_ai_dist_${card.id}_${level}`;
    let hit = false;
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length >= 3) {
            results[card.id] = parsed.slice(0, 3);
            hit = true;
          }
        }
      } catch {}
    }
    if (!hit) {
      uncachedCards.push(card);
    }
  }

  if (uncachedCards.length === 0) {
    return results;
  }

  // Target up to 8 cards per batch for optimal token and response speed
  const targetCards = uncachedCards.slice(0, 8);
  const prompt = `You are DITroy, an expert educational assessment engine.
Generate exactly 3 SMART, PLAUSIBLE, and LOGICALLY RELATIVE multiple-choice DISTRACTOR options (wrong answers) for each of the following cards.

Subject/Deck: "${options?.deckTitle || "Study Set"}"
Target Difficulty: Level ${level} (Distractors MUST be of the EXACT SAME concept category, format, and syntax as the correct answer).

Cards to process:
${targetCards
  .map((c, i) => `[Card ${i + 1}] ID: "${c.id}" | Question: "${c.question}" | Correct Answer: "${c.answer}"`)
  .join("\n")}

CRITICAL: Return ONLY a valid JSON object mapping each Card ID to an array of 3 distractor strings:
{
  "${targetCards[0]?.id || "id"}": ["Distractor A", "Distractor B", "Distractor C"]
}`;

  try {
    const response = await ditroyClient.chat({
      message: prompt,
      conversation_id: "batch-distractors-" + Date.now(),
    });

    const parsed = extractJsonFromReply(response.reply);
    if (parsed && typeof parsed === "object") {
      for (const card of targetCards) {
        const item = parsed[card.id] || parsed[card.question];
        if (Array.isArray(item) && item.length >= 3) {
          const cleaned = item
            .map((s: any) => String(s).trim())
            .filter((s) => s.length > 0 && s.toLowerCase() !== card.answer.trim().toLowerCase())
            .slice(0, 3);

          if (cleaned.length === 3) {
            results[card.id] = cleaned;
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(`rf_ai_dist_${card.id}_${level}`, JSON.stringify(cleaned));
              } catch {}
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Batch DITroy AI distractor generation fallback triggered:", err);
  }

  // Fill any missing cards with smart heuristic
  for (const card of cards) {
    if (!results[card.id] || results[card.id].length < 3) {
      results[card.id] = generateHeuristicSmartDistractors(card, options?.poolCards || [], level);
    }
  }

  return results;
}



import {
  loadLearnedFactsFromFirebase,
  saveAiMessageToFirebase,
  saveLearnedFactToFirebase,
  StoredAiMessage,
} from "./aiMemoryService";

export interface StudyTutorContext {
  currentCard?: { question: string; answer: string; tags?: string[]; difficulty?: number };
  deckTitle?: string;
  mode?: "review" | "test" | "general";
  siteContext?: {
    page?: string;
    stats?: { reviewed: number; correct: number; accuracy: number; streakDays?: number; totalTests?: number };
    decksSummary?: string[];
    quizSummary?: string;
    reviewProgress?: string;
    specificMention?: string;
  };
}

/**
 * Ask DITroy Study Tutor for guidance, mnemonics, hints, or explanations.
 * Automatically synchronizes context and message history with Firebase Firestore.
 */
export async function askStudyTutor(
  userQuery: string,
  context?: StudyTutorContext,
  conversationId: string = "review-flash-tutor"
): Promise<string> {
  let contextPrompt = "";

  if (context?.currentCard) {
    contextPrompt += `\n[Current Flashcard Context:
- Question: "${context.currentCard.question}"
- Answer: "${context.currentCard.answer}"
${context.currentCard.tags?.length ? `- Tags: ${context.currentCard.tags.join(", ")}` : ""}
${context.currentCard.difficulty ? `- Difficulty Level: ${context.currentCard.difficulty}/5` : ""}
${context.deckTitle ? `- Deck: "${context.deckTitle}"` : ""}
${context.mode ? `- Mode: ${context.mode}` : ""}
]\n`;
  }

  if (context?.siteContext) {
    const sc = context.siteContext;
    contextPrompt += `\n[Live Website & Session Context:
${sc.page ? `- Current Webpage: ${sc.page}` : ""}
${sc.reviewProgress ? `- Review Session Progress: ${sc.reviewProgress}` : ""}
${sc.stats ? `- Student Stats: ${sc.stats.reviewed} cards reviewed, ${sc.stats.accuracy}% accuracy, ${sc.stats.streakDays || 1}-day streak` : ""}
${sc.quizSummary ? `- Active Quiz Context: ${sc.quizSummary}` : ""}
${sc.decksSummary?.length ? `- User Deck Library (${sc.decksSummary.length} decks): ${sc.decksSummary.slice(0, 8).join(", ")}` : ""}
${sc.specificMention ? `- Targeted Focus (@mention): ${sc.specificMention}` : ""}
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

  const isReviewMode = context?.mode === "review";

  const pedagogyGuidelines = isReviewMode
    ? `
STUDY TUTOR PEDAGOGICAL FRAMEWORK (REVIEW MODE):
When explaining flashcard concepts, provide deep conceptual grounding while strictly adhering to these length constraints to prevent response truncation:

CRITICAL OUTPUT RULES:
- NO conversational preambles or greetings (DO NOT say "Hello again!", "I'm DITroy...", or "Let's dive in"). Start IMMEDIATELY with section 1.
- DO NOT use markdown tables or HTML tags (<br>), which consume excessive tokens. Use clean, compact bullet points instead.
- Keep each section concise (1-2 sentences or 2 short bullet points). Total response MUST be under 220 words so all 4 sections complete cleanly.

REQUIRED 4-PART BREAKDOWN:
1. 📖 **What is that? (Formal Concept & Definition)**:
   - 1-2 sentences stating the formal academic/technical definition and essential terminology.
2. ⚙️ **How did it come to that? (Mechanics & Origin)**:
   - 2-3 concise bullet points explaining how it works under the hood, derivation, or process.
3. 🎯 **Why is it like that? (Rationale & Purpose)**:
   - 1-2 punchy sentences explaining the core problem it solves, why it exists, and why it matters.
4. 💡 **Intuitive Analogy & Practical Anchor**:
   - 1-2 vivid sentences providing a relatable analogy that explicitly maps back to the formal mechanics above.`
    : `
STUDY TUTOR EXPLANATION GUIDELINES:
- Skip pleasantries and conversational filler; start directly with the content.
- Avoid large markdown tables or excessive formatting that hit token limits. Use concise bullet points.
- Provide a solid conceptual foundation first (what it is formally, how it works, and why it exists) followed by a relatable analogy.
- Keep total length under 220 words to ensure complete generation.`;

  const systemInstruction = `You are DITroy, an intelligent, rigorous, and supportive personal AI Study Tutor for Review Flash.
Your goal is to help the student achieve genuine conceptual mastery, active recall, and long-term memory retention.
${pedagogyGuidelines}
Keep your response well-structured using markdown bolding, clear section headings, and compact bullet points. Ensure ALL sections are completed.

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

