"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Cloud,
  Copy,
  History,
  HelpCircle,
  Lightbulb,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
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
    deckTitle?: string;
    mode?: "review" | "test" | "general";
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Listen for global custom events to open AI chat with context
  useEffect(() => {
    const handleOpenTutor = (event: CustomEvent) => {
      const detail = event.detail || {};
      setIsOpen(true);
      if (detail.currentCard) {
        setActiveContext({
          question: detail.currentCard.question,
          answer: detail.currentCard.answer,
          deckTitle: detail.deckTitle,
          mode: detail.mode || "review",
        });
      }
      if (detail.prompt) {
        handleSendMessage(detail.prompt, {
          question: detail.currentCard?.question,
          answer: detail.currentCard?.answer,
          deckTitle: detail.deckTitle,
        });
      }
    };

    window.addEventListener("open-ai-tutor" as any, handleOpenTutor as any);
    return () => window.removeEventListener("open-ai-tutor" as any, handleOpenTutor as any);
  }, [activeContext, conversationId]);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  const handleSendMessage = async (
    textToSend?: string,
    overrideContext?: { question?: string; answer?: string; deckTitle?: string }
  ) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const ctx = overrideContext || activeContext;
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

    try {
      const reply = await askStudyTutor(
        query,
        ctx?.question && ctx?.answer
          ? {
              currentCard: { question: ctx.question, answer: ctx.answer },
              deckTitle: ctx.deckTitle,
              mode: activeContext?.mode || "general",
            }
          : undefined,
        conversationId
      );

      const aiMsg: ChatMessage = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      void refreshConversations();
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: "ai-err-" + Date.now(),
        role: "assistant",
        content: `⚠️ **Connection Error:** ${err?.message || "Failed to reach DITroy AI backend."}\n\nBackend URL: \`https://ditroy.onrender.com\` (If this is the first request after being idle, Render may take ~30s to wake up).`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);

    } finally {
      setLoading(false);
    }
  };

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

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            void refreshConversations();
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3 text-white shadow-xl shadow-cyan-500/25 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          aria-label="Open DITroy AI Tutor"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="h-5 w-5 animate-pulse text-amber-200" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 ${
                health.online
                  ? health.modelStatus === "degraded"
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                  : "bg-rose-500"
              }`}
            />
          </div>
          <span className="text-sm font-semibold tracking-wide">DITroy AI</span>
          {activeContext?.question && (
            <span className="flex h-2 w-2 rounded-full bg-cyan-200 animate-ping" />
          )}
        </button>
      )}

      {/* Slide-over Chat Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-0 right-0 z-50 flex flex-col border-t border-l border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:bottom-6 sm:right-6 sm:rounded-2xl sm:border max-h-[100dvh] ${
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
                      <div className="whitespace-pre-wrap break-words text-xs">{msg.content}</div>
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
                  <span className="ml-1 text-slate-300 font-medium">DITroy is thinking & saving to Firebase...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="border-t border-slate-800/80 bg-slate-950/40 px-3 py-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
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
          <div className="border-t border-slate-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-slate-950/80 sm:rounded-b-2xl">
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
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  activeContext?.question
                    ? "Ask about this card or topic..."
                    : "Ask DITroy anything about your studies..."
                }
                rows={1}
                className="max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
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
