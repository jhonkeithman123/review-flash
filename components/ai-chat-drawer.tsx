"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  Cloud,
  Compass,
  Copy,
  Cpu,
  Folder,
  History,
  HelpCircle,
  Layers,
  Lightbulb,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";
import {
  askStudyTutor,
  checkDITroyHealth,
  deleteAiConversationFromFirebase,
  loadAiMessagesFromFirebase,
  loadLearnedFactsFromFirebase,
  loadUserAiConversationsFromFirebase,
  StoredAiConversation,
} from "@/lib/ditroy";
import { fetchDecks, fetchUserStats } from "@/lib/flashcardService";
import { Deck, UserStats } from "@/types/flashcard";
import { AiMarkdownRenderer } from "./ai-markdown-renderer";


export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  cardContext?: {
    question?: string;
    answer?: string;
    deckTitle?: string;
  };
}

/**
 * Checks whether an AI reply appears abruptly cut off mid-sentence or mid-token.
 */
function isMessageTruncated(content: string): boolean {
  if (!content || content.length < 25) return false;
  const trimmed = content.trim();
  const terminalEndings = [".", "!", "?", "```", '"', "'", "”", "’", "*/", "}", ")", ">"];
  const lastChar = trimmed.slice(-1);
  if (["(", "[", "{", "-", ":", ",", "/", "\\", "—"].includes(lastChar)) {
    return true;
  }
  return !terminalEndings.some((end) => trimmed.endsWith(end));
}

export function AiChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<StoredAiConversation[]>([]);
  const [conversationId, setConversationId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rf_active_conv_id") || "session-main";
    }
    return "session-main";
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "👋 Hi! I'm **DITroy**, your personal AI Study Tutor for Review Flash.\n\nI can explain tough concepts, craft memory mnemonics, quiz you on topics, or give hints without spoiling answers. All our chats and facts are synchronized to **Firebase**!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [health, setHealth] = useState<{
    online: boolean;
    status?: string;
    model?: string;
    modelStatus?: string;
    message?: string;
  }>({ online: false });
  const [activeContext, setActiveContext] = useState<{
    question?: string;
    answer?: string;
    tags?: string[];
    difficulty?: number;
    deckTitle?: string;
    mode?: "review" | "test" | "general";
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live website context & library state
  const [siteDecks, setSiteDecks] = useState<Deck[]>([]);
  const [siteStats, setSiteStats] = useState<UserStats | null>(null);
  const [liveContext, setLiveContext] = useState<{
    page?: string;
    reviewProgress?: string;
    quizSummary?: string;
  }>({});

  // Command & Mention Autocomplete popup state
  const [commandMenu, setCommandMenu] = useState<{
    open: boolean;
    type: "@" | "/";
    query: string;
    selectedIndex: number;
  } | null>(null);

  // Animation state for smooth slide-over open and close transitions
  const [isDrawerRendered, setIsDrawerRendered] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsDrawerRendered(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsDrawerVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setIsDrawerVisible(false);
      const timer = setTimeout(() => {
        setIsDrawerRendered(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key handler to close chat drawer smoothly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Poll health on mount and every 30s
  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      const res = await checkDITroyHealth();
      if (mounted) setHealth(res);
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Load conversation messages from Firebase Firestore when conversationId changes
  useEffect(() => {
    let mounted = true;
    const loadMessages = async () => {
      setLoadingHistory(true);
      try {
        const stored = await loadAiMessagesFromFirebase(conversationId);
        if (mounted && stored.length > 0) {
          setMessages(stored);
        }
      } catch (err) {
        console.warn("Could not load messages from Firebase:", err);
      } finally {
        if (mounted) setLoadingHistory(false);
      }
    };

    loadMessages();
    return () => {
      mounted = false;
    };
  }, [conversationId]);

  // Load conversation list from Firebase
  const refreshConversations = async () => {
    try {
      const list = await loadUserAiConversationsFromFirebase();
      setConversations(list);
    } catch (err) {
      console.warn("Could not load conversations from Firebase:", err);
    }
  };

  // Load live site context & library data on drawer mount or open
  useEffect(() => {
    if (!isOpen) return;
    const loadSiteData = async () => {
      try {
        const [dList, uStats] = await Promise.all([fetchDecks(), fetchUserStats()]);
        setSiteDecks(dList);
        setSiteStats(uStats);
      } catch (err) {
        console.warn("Could not load site context data:", err);
      }
    };
    void loadSiteData();
    if (typeof window !== "undefined") {
      setLiveContext((prev) => ({ ...prev, page: window.location.pathname }));
    }
  }, [isOpen]);

  // Listen for real-time site context updates from review, test, or other views
  useEffect(() => {
    const handleContextUpdate = (event: CustomEvent) => {
      const detail = event.detail || {};
      if (detail.currentCard) {
        setActiveContext({
          question: detail.currentCard.question,
          answer: detail.currentCard.answer,
          tags: detail.currentCard.tags,
          difficulty: detail.currentCard.difficulty,
          deckTitle: detail.deckTitle,
          mode: detail.mode || "review",
        });
      }
      setLiveContext((prev) => ({
        ...prev,
        page: typeof window !== "undefined" ? window.location.pathname : prev.page,
        reviewProgress: detail.reviewProgress ?? prev.reviewProgress,
        quizSummary: detail.quizSummary ?? prev.quizSummary,
      }));
      if (detail.stats) {
        setSiteStats(detail.stats);
      }
    };

    window.addEventListener("update-ai-context" as any, handleContextUpdate as any);
    return () => window.removeEventListener("update-ai-context" as any, handleContextUpdate as any);
  }, []);

  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  const activeContextRef = useRef(activeContext);
  activeContextRef.current = activeContext;

  const activeRequestIdRef = useRef<number>(0);

  const handleSendMessage = async (
    textToSend?: string,
    overrideContext?: { question?: string; answer?: string; deckTitle?: string },
    force: boolean = false
  ) => {
    const query = (textToSend || input).trim();
    if (!query) return;
    if (loadingRef.current && !force) return;

    const ctx = overrideContext || activeContextRef.current || activeContext;
    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      cardContext: ctx?.question && ctx?.answer ? {
        question: ctx.question,
        answer: ctx.answer,
        deckTitle: ctx.deckTitle,
      } : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);
    loadingRef.current = true;

    // Inspect query for any explicit @mentions to assemble deep site context
    const hasCurrentCard = query.includes("@current-card") || query.includes("@card");
    const hasDeck = query.includes("@active-deck") || query.includes("@deck");
    const hasStats = query.includes("@stats") || query.includes("@my-stats");
    const hasReview = query.includes("@review") || query.includes("@review-progress");
    const hasQuiz = query.includes("@quiz") || query.includes("@test");
    const hasAllDecks = query.includes("@all-decks") || query.includes("@decks");
    const hasPage = query.includes("@page") || query.includes("@website");

    const mentionsList: string[] = [];
    if (hasCurrentCard) mentionsList.push("@current-card");
    if (hasDeck) mentionsList.push("@active-deck");
    if (hasStats) mentionsList.push("@stats");
    if (hasReview) mentionsList.push("@review-progress");
    if (hasQuiz) mentionsList.push("@quiz");
    if (hasAllDecks) mentionsList.push("@all-decks");
    if (hasPage) mentionsList.push("@page");

    const siteContextData = {
      page: typeof window !== "undefined" ? window.location.pathname : liveContext.page,
      stats: siteStats || undefined,
      decksSummary: siteDecks.map((d) => `"${d.title}" (${d.cards?.length || 0} cards)`),
      quizSummary: liveContext.quizSummary,
      reviewProgress: liveContext.reviewProgress,
      specificMention: mentionsList.length > 0 ? mentionsList.join(", ") : undefined,
    };

    const reqId = ++activeRequestIdRef.current;

    try {
      const reply = await askStudyTutor(
        query,
        ctx?.question && ctx?.answer
          ? {
              currentCard: { question: ctx.question, answer: ctx.answer },
              deckTitle: ctx.deckTitle,
              mode: activeContextRef.current?.mode || activeContext?.mode || "general",
              siteContext: siteContextData,
            }
          : {
              deckTitle: ctx?.deckTitle,
              mode: activeContextRef.current?.mode || activeContext?.mode || "general",
              siteContext: siteContextData,
            },
        conversationIdRef.current || conversationId
      );

      if (reqId === activeRequestIdRef.current) {
        const aiMsg: ChatMessage = {
          id: "ai-" + Date.now(),
          role: "assistant",
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        void refreshConversations();
      }
    } catch (err: any) {
      if (reqId === activeRequestIdRef.current) {
        const errorMsg: ChatMessage = {
          id: "ai-err-" + Date.now(),
          role: "assistant",
          content: `⚠️ **Connection Error:** ${err?.message || "Failed to reach DITroy AI backend."}\n\nBackend URL: \`https://ditroy.onrender.com\` (If this is the first request after being idle, Render may take ~30s to wake up).`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      if (reqId === activeRequestIdRef.current) {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  };

  const handleSendMessageRef = useRef(handleSendMessage);
  handleSendMessageRef.current = handleSendMessage;

  // Listen for global custom events to open AI chat with context
  useEffect(() => {
    const handleOpenTutor = (event: CustomEvent) => {
      const detail = event.detail || {};
      setIsOpen(true);
      if (detail.currentCard) {
        const newCtx = {
          question: detail.currentCard.question,
          answer: detail.currentCard.answer,
          deckTitle: detail.deckTitle,
          mode: detail.mode || "review",
        };
        setActiveContext(newCtx);
        activeContextRef.current = newCtx;
      }
      if (detail.prompt) {
        handleSendMessageRef.current(
          detail.prompt,
          {
            question: detail.currentCard?.question,
            answer: detail.currentCard?.answer,
            deckTitle: detail.deckTitle,
          },
          true // Always force new card prompts to trigger immediately on first click
        );
      }
    };

    window.addEventListener("open-ai-tutor" as any, handleOpenTutor as any);
    return () => window.removeEventListener("open-ai-tutor" as any, handleOpenTutor as any);
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  const handleContinueResponse = (lastContent?: string) => {
    if (!lastContent) {
      handleSendMessage("Please continue your explanation right where you left off.");
      return;
    }
    const trimmed = lastContent.trim();
    const snippet = trimmed.slice(-50).replace(/\n+/g, " ");
    handleSendMessage(
      `Please continue your explanation right from where you were cut off: "...${snippet}". Continue immediately with the remaining sections concisely without repeating previous text.`
    );
  };

  const handleQuickPrompt = (promptType: "explain" | "mnemonic" | "quiz" | "hint" | "summary") => {
    if (!activeContext?.question) {
      if (promptType === "quiz") {
        handleSendMessage("Quiz me with a multiple-choice question on whatever study deck I'm working on.");
      } else {
        handleSendMessage("Give me a study tip to improve memory retention using spaced repetition.");
      }
      return;
    }

    switch (promptType) {
      case "explain":
        handleSendMessage(
          `Explain the formal concept behind this card and connect it with an analogy. Keep it compact (no greeting, under 200 words so all 4 points fit):
Question: "${activeContext.question}" (Answer: "${activeContext.answer}")

1. **What is that?** (Formal definition, 1-2 sentences)
2. **How did it come to that?** (Mechanics & how it works, 2 concise bullets)
3. **Why is it like that?** (Purpose & rationale, 1-2 sentences)
4. **Intuitive Analogy**: (Relatable analogy linked to the mechanics, 1-2 sentences)`
        );
        break;
      case "mnemonic":
        handleSendMessage(
          `Create a catchy mnemonic, acronym, or visualization to help me memorize this easily: Question: "${activeContext.question}" -> Answer: "${activeContext.answer}"`
        );
        break;
      case "hint":
        handleSendMessage(
          `Give me a subtle hint to help me recall the answer to this question without giving it away directly: "${activeContext.question}"`
        );
        break;
      case "quiz":
        handleSendMessage(
          `Generate a follow-up test question with 4 multiple-choice options related to this topic: "${activeContext.question}"`
        );
        break;
      case "summary":
        handleSendMessage(
          `Summarize the key takeaways and why it matters for this concept: "${activeContext.question}"`
        );
        break;
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewSession = () => {
    const newId = "session-" + Date.now();
    setConversationId(newId);
    if (typeof window !== "undefined") {
      localStorage.setItem("rf_active_conv_id", newId);
    }
    setMessages([
      {
        id: "welcome-new-" + Date.now(),
        role: "assistant",
        content: "✨ New study thread started! What would you like to review or explore?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setShowHistory(false);
  };

  const handleSelectSession = (id: string) => {
    setConversationId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("rf_active_conv_id", id);
    }
    setShowHistory(false);
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteAiConversationFromFirebase(id);
    if (id === conversationId) {
      handleNewSession();
    } else {
      void refreshConversations();
    }
  };

  const mentionItems = useMemo(
    () => [
      {
        id: "current-card",
        tag: "@current-card",
        title: "Active Flashcard",
        description: activeContext?.question
          ? `"${activeContext.question.slice(0, 42)}..."`
          : "Active card question, answer & difficulty",
        icon: BookOpen,
        badge: activeContext?.question ? "Live Card" : "General",
        getContext: () =>
          activeContext?.question
            ? `Active Flashcard: Question: "${activeContext.question}", Answer: "${activeContext.answer}", Difficulty: ${activeContext.difficulty || 3}/5`
            : "No active card selected",
      },
      {
        id: "active-deck",
        tag: "@active-deck",
        title: "Active Deck",
        description: activeContext?.deckTitle
          ? `Study Set: "${activeContext.deckTitle}"`
          : "Currently selected flashcard deck",
        icon: Layers,
        badge: activeContext?.deckTitle || (siteDecks[0]?.title ?? "All Decks"),
        getContext: () =>
          `Active Study Deck: "${activeContext?.deckTitle || siteDecks[0]?.title || "All Decks"}"`,
      },
      {
        id: "stats",
        tag: "@stats",
        title: "Study Statistics",
        description: siteStats
          ? `${siteStats.reviewed} reviewed • ${siteStats.accuracy}% accuracy`
          : "User review accuracy, count & streak",
        icon: BarChart3,
        badge: `${siteStats?.accuracy ?? 100}% Accuracy`,
        getContext: () =>
          siteStats
            ? `User Stats: ${siteStats.reviewed} cards reviewed, ${siteStats.accuracy}% accuracy, ${siteStats.streakDays || 1}-day streak, ${siteStats.totalTests || 0} tests taken`
            : "Stats not available",
      },
      {
        id: "review-progress",
        tag: "@review-progress",
        title: "Review Progress",
        description: liveContext.reviewProgress || "Current card progression in take",
        icon: RotateCcw,
        badge: liveContext.reviewProgress || "Review Mode",
        getContext: () =>
          `Review Progress: ${liveContext.reviewProgress || "In review session"}`,
      },
      {
        id: "quiz",
        tag: "@quiz",
        title: "Quiz / Test Session",
        description: liveContext.quizSummary || "Test questions, score & adaptive difficulty",
        icon: Zap,
        badge: liveContext.quizSummary ? "In Quiz" : "Test Mode",
        getContext: () =>
          `Quiz / Test: ${liveContext.quizSummary || "Adaptive testing active"}`,
      },
      {
        id: "all-decks",
        tag: "@all-decks",
        title: "All Decks in Library",
        description: `${siteDecks.length} study decks saved in account`,
        icon: Folder,
        badge: `${siteDecks.length} Decks`,
        getContext: () =>
          `Library Decks (${siteDecks.length}): ${siteDecks.map((d) => `"${d.title}" (${d.cards?.length || 0} cards)`).join(", ")}`,
      },
      {
        id: "page",
        tag: "@page",
        title: "Current Webpage",
        description: `Route: ${liveContext.page || (typeof window !== "undefined" ? window.location.pathname : "/")}`,
        icon: Compass,
        badge: liveContext.page || "Page",
        getContext: () =>
          `Current Page Route: "${liveContext.page || (typeof window !== "undefined" ? window.location.pathname : "/")}"`,
      },
    ],
    [activeContext, siteDecks, siteStats, liveContext]
  );

  const commandItems = useMemo(
    () => [
      {
        id: "explain",
        cmd: "/explain",
        title: "Explain Concept",
        description: "Formal definition, mechanics, why it matters & analogy",
        icon: Lightbulb,
        badge: "Pedagogy",
        action: () => handleQuickPrompt("explain"),
      },
      {
        id: "mnemonic",
        cmd: "/mnemonic",
        title: "Memory Mnemonic",
        description: "Craft a memorable memory trick, acronym, or visualization",
        icon: Sparkles,
        badge: "Memory",
        action: () => handleQuickPrompt("mnemonic"),
      },
      {
        id: "quiz",
        cmd: "/quiz",
        title: "Quiz Me (4 Options)",
        description: "Generate a multiple-choice question to test recall",
        icon: Zap,
        badge: "Recall",
        action: () => handleQuickPrompt("quiz"),
      },
      {
        id: "hint",
        cmd: "/hint",
        title: "Subtle Hint",
        description: "Get a targeted clue without spoiling the answer",
        icon: HelpCircle,
        badge: "Clue",
        action: () => handleQuickPrompt("hint"),
      },
      {
        id: "summary",
        cmd: "/summary",
        title: "Deck Summary",
        description: "Summarize key concepts and takeaways from this deck",
        icon: BookOpen,
        badge: "Overview",
        action: () => handleQuickPrompt("summary"),
      },
      {
        id: "stats",
        cmd: "/stats",
        title: "Diagnose My Stats",
        description: "AI analysis of your review accuracy, streak, and focus areas",
        icon: BarChart3,
        badge: "Analytics",
        action: () => {
          const statsMsg = siteStats
            ? `Analyze my current study stats: ${siteStats.reviewed} cards reviewed, ${siteStats.accuracy}% accuracy, ${siteStats.streakDays}-day streak. Recommend a 3-step strategy to boost retention.`
            : "Analyze my study habits and give me recommendations to improve recall.";
          handleSendMessage(statsMsg);
        },
      },
      {
        id: "formula",
        cmd: "/formula",
        title: "Formula / Mechanics",
        description: "Step-by-step breakdown of core formulas or procedures",
        icon: Cpu,
        badge: "Deep Dive",
        action: () => {
          handleSendMessage(
            activeContext?.question
              ? `Break down the core formulas, mechanics, or step-by-step procedure behind this card: "${activeContext.question}" (Answer: "${activeContext.answer}")`
              : "Break down the core mechanics and formulas for the study topic we are discussing."
          );
        },
      },
      {
        id: "clear",
        cmd: "/clear",
        title: "New Study Thread",
        description: "Clear current conversation and start a clean study session",
        icon: RefreshCw,
        badge: "Reset",
        action: () => handleNewSession(),
      },
      {
        id: "help",
        cmd: "/help",
        title: "Command & Mention Cheatsheet",
        description: "View all available slash commands and @ mentions",
        icon: HelpCircle,
        badge: "Guide",
        action: () => {
          const helpText = `### 💡 DITroy AI Command & Context Cheatsheet\n\nUse **\`/\`** for rapid actions and **\`@\`** to bind live website context:\n\n#### ⚡ Slash Commands (\`/\`)\n- **/explain**: 4-part conceptual breakdown with relatable analogy.\n- **/mnemonic**: Creative acronyms & memory hooks.\n- **/quiz**: Interactive multiple-choice test question.\n- **/hint**: Subtle clue without spoiling answers.\n- **/summary**: Synthesis of current deck or topics.\n- **/stats**: AI diagnostic of your review performance & streak.\n- **/formula**: Mechanics, procedures & step-by-step derivation.\n- **/clear**: Start a fresh study conversation in Firebase.\n\n#### 📌 Live Site Mentions (\`@\`)\n- **@current-card**: Binds the active flashcard question & answer.\n- **@active-deck**: Binds the selected deck title & topic scope.\n- **@stats**: Injects your real-time review accuracy & streak metrics.\n- **@review-progress**: Injects current review session progress.\n- **@quiz**: Injects active quiz score, missed answers & adaptive difficulty.\n- **@all-decks**: Overview of all decks in your library.\n- **@page**: Current website route & view context.\n\n*Pro-Tip: You can combine them! For example: "Compare @current-card with the rest of @active-deck".*`;
          const helpMsg: ChatMessage = {
            id: "help-" + Date.now(),
            role: "assistant",
            content: helpText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, helpMsg]);
        },
      },
    ],
    [activeContext, siteStats]
  );

  const filteredMentions = useMemo(() => {
    if (!commandMenu || commandMenu.type !== "@") return [];
    const q = commandMenu.query.toLowerCase();
    if (!q) return mentionItems;
    return mentionItems.filter(
      (m) =>
        m.tag.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }, [commandMenu, mentionItems]);

  const filteredCommands = useMemo(() => {
    if (!commandMenu || commandMenu.type !== "/") return [];
    const q = commandMenu.query.toLowerCase();
    if (!q) return commandItems;
    return commandItems.filter(
      (c) =>
        c.cmd.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [commandMenu, commandItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    const sel = e.target.selectionStart;
    const textBefore = val.slice(0, sel);
    const match = textBefore.match(/(?:^|\s)([/@][a-zA-Z0-9_-]*)$/);

    if (match) {
      const trigger = match[1][0] as "@" | "/";
      const query = match[1].slice(1).toLowerCase();
      setCommandMenu({
        open: true,
        type: trigger,
        query,
        selectedIndex: 0,
      });
    } else {
      setCommandMenu(null);
    }
  };

  const handleSelectMention = (item: (typeof mentionItems)[0]) => {
    if (!inputRef.current) return;
    const sel = inputRef.current.selectionStart;
    const textBefore = input.slice(0, sel);
    const textAfter = input.slice(sel);
    const match = textBefore.match(/(?:^|\s)(@[a-zA-Z0-9_-]*)$/);

    if (match) {
      const matchStart = match.index! + (match[0].startsWith(" ") ? 1 : 0);
      const newInput = input.slice(0, matchStart) + item.tag + " " + textAfter;
      setInput(newInput);
    } else {
      setInput((prev) => (prev ? prev + " " + item.tag + " " : item.tag + " "));
    }

    setCommandMenu(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelectCommand = (cmd: (typeof commandItems)[0]) => {
    setCommandMenu(null);
    setInput("");
    cmd.action();
  };

  const renderFormattedUserContent = (content: string) => {
    const parts = content.split(/(\s+)/);
    return (
      <div className="whitespace-pre-wrap break-words text-xs leading-relaxed">
        {parts.map((part, pIdx) => {
          if (part.startsWith("@")) {
            return (
              <span
                key={pIdx}
                className="inline-flex items-center gap-0.5 rounded-md bg-cyan-400/20 px-1.5 py-0.5 text-[11px] font-bold text-cyan-200 border border-cyan-400/30 shadow-sm"
              >
                {part}
              </span>
            );
          }
          if (part.startsWith("/")) {
            return (
              <span
                key={pIdx}
                className="inline-flex items-center gap-0.5 rounded-md bg-purple-400/20 px-1.5 py-0.5 text-[11px] font-bold text-purple-200 border border-purple-400/30 shadow-sm"
              >
                {part}
              </span>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Trigger Button with smooth fade & scale */}
      <button
        onClick={() => {
          setIsOpen(true);
          void refreshConversations();
        }}
        className={`fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-2.5 sm:px-4 sm:py-3 text-white shadow-xl shadow-cyan-500/25 origin-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 cursor-pointer ${
          isOpen
            ? "opacity-0 scale-50 pointer-events-none"
            : "opacity-100 scale-100 translate-y-0 pointer-events-auto"
        }`}
        aria-label="Open DITroy AI Tutor"
      >
        <div className="relative flex items-center justify-center">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse text-amber-200" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full border-2 border-slate-950 ${
              health.online
                ? health.modelStatus === "degraded"
                  ? "bg-amber-400"
                  : "bg-emerald-400"
                : "bg-rose-500"
            }`}
          />
        </div>
        <span className="text-xs sm:text-sm font-semibold tracking-wide">DITroy AI</span>
        {activeContext?.question && (
          <span className="flex h-2 w-2 rounded-full bg-cyan-200 animate-ping" />
        )}
      </button>

      {/* Slide-over Chat Drawer growing directly out of the bottom-right trigger button */}
      {isDrawerRendered && (
        <div
          className={`fixed bottom-0 right-0 z-50 flex flex-col border-t border-l border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:right-6 sm:rounded-2xl sm:border max-h-[100dvh] origin-bottom-right transition-all duration-350 ease-[cubic-bezier(0.34,1.3,0.64,1)] ${
            isDrawerVisible
              ? "scale-100 opacity-100 pointer-events-auto"
              : "scale-[0.04] opacity-0 pointer-events-none translate-y-3 translate-x-3"
          } ${
            isExpanded
              ? "h-[92dvh] w-full sm:w-[640px]"
              : "h-[85dvh] w-full sm:h-[600px] sm:w-[440px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5 bg-slate-950/60 sm:rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
                <Sparkles className="h-4 w-4 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">DITroy AI Tutor</h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      health.online
                        ? health.modelStatus === "degraded"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        health.online
                          ? health.modelStatus === "degraded"
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                          : "bg-rose-400"
                      }`}
                    />
                    {health.online
                      ? health.modelStatus === "degraded"
                        ? "Degraded"
                        : "Online"
                      : "Offline"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-medium">
                  <Cloud size={11} className="text-cyan-400" />
                  <span>Firebase Cloud Memory Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  if (!showHistory) void refreshConversations();
                }}
                title="View Past Sessions in Firebase"
                className={`rounded-lg p-1.5 transition-colors ${
                  showHistory
                    ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <History className="h-4 w-4" />
              </button>
              <button
                onClick={handleNewSession}
                title="New Study Thread"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse" : "Expand"}
                className="hidden sm:flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Past Sessions History Panel */}
          {showHistory && (
            <div className="border-b border-slate-800 bg-slate-950/90 p-3 space-y-2 max-h-48 overflow-y-auto animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Cloud size={13} className="text-cyan-400" />
                  Saved Firebase Study Sessions
                </span>
                <button
                  onClick={handleNewSession}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  + New Session
                </button>
              </div>

              {conversations.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-2">
                  No previous sessions stored yet. Chat with DITroy and your study threads will appear here!
                </p>
              ) : (
                <div className="space-y-1.5">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectSession(conv.id)}
                      className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition cursor-pointer ${
                        conv.id === conversationId
                          ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 font-medium"
                          : "bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex-1 truncate pr-2">
                        <div className="truncate">{conv.title}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(conv.updatedAt).toLocaleDateString()} · {conv.messageCount} messages
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(e, conv.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete Session"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Context Banner */}
          {activeContext?.question && (
            <div className="flex items-center justify-between border-b border-cyan-500/20 bg-cyan-950/30 px-3.5 py-2 text-xs text-cyan-200">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <Zap className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                <span className="font-semibold text-cyan-300 shrink-0">Active Card:</span>
                <span className="truncate text-slate-300" title={activeContext.question}>
                  {activeContext.question}
                </span>
              </div>
              <button
                onClick={() => setActiveContext(null)}
                className="ml-2 text-[10px] text-cyan-400 underline hover:text-cyan-200 shrink-0"
              >
                Clear Context
              </button>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
                <Cloud size={14} className="animate-pulse text-cyan-400" />
                <span>Loading chat history from Firebase Firestore...</span>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600/30 border border-indigo-500/30 text-indigo-400">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`group relative max-w-[90%] sm:max-w-[88%] rounded-2xl px-4 py-3 shadow-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-br-none"
                        : "bg-slate-900/90 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-lg shadow-black/20"
                    }`}
                  >
                    {/* Context preview snippet for user queries */}
                    {msg.cardContext?.question && (
                      <div className="mb-2.5 rounded-lg bg-black/30 px-2.5 py-1 text-[11px] text-cyan-200 border border-cyan-400/20 truncate font-medium">
                        📌 Card: {msg.cardContext.question}
                      </div>
                    )}

                    {msg.role === "assistant" ? (
                      <AiMarkdownRenderer content={msg.content} />
                    ) : (
                      renderFormattedUserContent(msg.content)
                    )}

                    {/* Continuation Action for Cut-off or Incomplete Assistant Responses */}
                    {msg.role === "assistant" && idx === messages.length - 1 && !loading && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between gap-2">
                        {isMessageTruncated(msg.content) ? (
                          <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                            <span>⚠️</span>
                            <span>Response was cut off</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Need more details?</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleContinueResponse(msg.content)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded-lg border border-cyan-500/30 transition cursor-pointer"
                          title="Ask AI to continue generating from where it stopped"
                        >
                          <span>Continue response</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <div className="mt-1 flex items-center justify-between text-[10px] opacity-70">
                      <span>{msg.timestamp}</span>
                      {msg.role === "assistant" && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:text-white"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <Check className="h-3 w-3 text-emerald-400 inline" />
                          ) : (
                            <Copy className="h-3 w-3 inline" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600/30 border border-indigo-500/30 text-indigo-400">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-bl-none border border-slate-700/60 bg-slate-800/90 px-4 py-3 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-pink-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-slate-300 font-medium">DITroy is analyzing context & responding...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="border-t border-slate-800/80 bg-slate-950/40 px-3 py-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {/* @ Context & / Commands Quick Triggers */}
              <button
                type="button"
                onClick={() => {
                  setCommandMenu((prev) =>
                    prev?.type === "@" ? null : { open: true, type: "@", query: "", selectedIndex: 0 }
                  );
                  inputRef.current?.focus();
                }}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-cyan-300 hover:bg-cyan-500/20 transition-colors font-semibold text-[11px] cursor-pointer shadow-sm"
                title="Attach live website context (@card, @deck, @stats, @quiz)"
              >
                <span className="font-mono font-bold">@</span>
                <span>Context</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCommandMenu((prev) =>
                    prev?.type === "/" ? null : { open: true, type: "/", query: "", selectedIndex: 0 }
                  );
                  inputRef.current?.focus();
                }}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-purple-500/40 bg-purple-500/10 px-2 py-1 text-purple-300 hover:bg-purple-500/20 transition-colors font-semibold text-[11px] cursor-pointer shadow-sm"
                title="Run AI study command (/explain, /mnemonic, /quiz, /stats)"
              >
                <span className="font-mono font-bold">/</span>
                <span>Commands</span>
              </button>

              {messages.length > 0 && messages[messages.length - 1].role === "assistant" && !loading && (
                <button
                  onClick={() => {
                    const lastMsg = messages[messages.length - 1];
                    handleContinueResponse(lastMsg.content);
                  }}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-cyan-500/50 bg-cyan-500/15 px-2.5 py-1 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/25 transition-colors font-semibold shadow-sm"
                  title="Continue generating where the response stopped"
                >
                  <ArrowRight className="h-3 w-3 text-cyan-300" />
                  Continue ➡️
                </button>
              )}
              <button
                onClick={() => handleQuickPrompt("explain")}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-slate-300 hover:border-cyan-500/50 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
                title="Deep concept breakdown: What is that, How did it come to that, Why is it like that, and Analogy"
              >
                <Lightbulb className="h-3 w-3 text-amber-400" />
                Explain Concept
              </button>
              <button
                onClick={() => handleQuickPrompt("mnemonic")}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800 hover:text-indigo-300 transition-colors"
              >
                <Sparkles className="h-3 w-3 text-indigo-400" />
                Mnemonic
              </button>
              <button
                onClick={() => handleQuickPrompt("hint")}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800 hover:text-emerald-300 transition-colors"
              >
                <HelpCircle className="h-3 w-3 text-emerald-400" />
                Give Hint
              </button>
              <button
                onClick={() => handleQuickPrompt("quiz")}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-slate-300 hover:border-purple-500/50 hover:bg-slate-800 hover:text-purple-300 transition-colors"
              >
                <Zap className="h-3 w-3 text-purple-400" />
                Quiz Me
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className="relative border-t border-slate-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-slate-950/80 sm:rounded-b-2xl">
            {/* Command / Mention Autocomplete Popover */}
            {commandMenu?.open && (
              <div className="absolute bottom-full left-3 right-3 mb-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-700/80 bg-slate-900/98 p-1.5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800/80 mb-1">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    {commandMenu.type === "@" ? "Attach Live Website Context" : "Study Actions & Slash Commands"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ↑↓ navigate • Enter/Tab to select • Esc
                  </span>
                </div>

                {commandMenu.type === "@" ? (
                  filteredMentions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">No matching context tags</div>
                  ) : (
                    filteredMentions.map((item, idx) => {
                      const Icon = item.icon;
                      const isSelected = idx === commandMenu.selectedIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectMention(item)}
                          className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-cyan-500/20 border border-cyan-500/40 text-white"
                              : "hover:bg-slate-800/80 text-slate-200 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg ${isSelected ? "bg-cyan-500/30 text-cyan-300" : "bg-slate-800 text-slate-400"}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-cyan-300">{item.tag}</span>
                                <span className="text-[11px] text-slate-400 truncate font-medium">({item.title})</span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">{item.description}</p>
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-slate-800/90 border border-slate-700/60 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                            {item.badge}
                          </span>
                        </button>
                      );
                    })
                  )
                ) : filteredCommands.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">No matching commands</div>
                ) : (
                  filteredCommands.map((cmd, idx) => {
                    const Icon = cmd.icon;
                    const isSelected = idx === commandMenu.selectedIndex;
                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        onClick={() => handleSelectCommand(cmd)}
                        className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-purple-500/20 border border-purple-500/40 text-white"
                            : "hover:bg-slate-800/80 text-slate-200 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg ${isSelected ? "bg-purple-500/30 text-purple-300" : "bg-slate-800 text-slate-400"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-purple-300">{cmd.cmd}</span>
                              <span className="text-[11px] text-slate-400 truncate font-medium">({cmd.title})</span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">{cmd.description}</p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                          {cmd.badge}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (commandMenu?.open) {
                    const activeList = commandMenu.type === "@" ? filteredMentions : filteredCommands;
                    if (activeList.length > 0) {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setCommandMenu((prev) =>
                          prev ? { ...prev, selectedIndex: (prev.selectedIndex + 1) % activeList.length } : null
                        );
                        return;
                      }
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setCommandMenu((prev) =>
                          prev
                            ? { ...prev, selectedIndex: (prev.selectedIndex - 1 + activeList.length) % activeList.length }
                            : null
                        );
                        return;
                      }
                      if (e.key === "Enter" || e.key === "Tab") {
                        e.preventDefault();
                        const selected = activeList[commandMenu.selectedIndex];
                        if (selected) {
                          if (commandMenu.type === "@") {
                            handleSelectMention(selected as any);
                          } else {
                            handleSelectCommand(selected as any);
                          }
                        }
                        return;
                      }
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setCommandMenu(null);
                      return;
                    }
                  }

                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  activeContext?.question
                    ? "Ask about card or type @ for site context, / for commands..."
                    : "Ask DITroy anything... (Type @ for site context, / for commands)"
                }
                rows={1}
                className="max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40 transition-colors cursor-pointer"
                title="Send Message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
