"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  ListOrdered,
  Plus,
  Search,
  Sparkles,
  Wand2,
  X,
  Zap,
} from "lucide-react";

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSample?: (sampleText: string, suggestedMode?: string) => void;
}

export const SAMPLE_FORMATS = [
  {
    id: "numbered",
    title: "1. Numbered Exam Reviewer",
    icon: ListOrdered,
    badge: "Most Popular",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    description: "Standard school and college reviewer format. Numbers followed by questions and answers on subsequent lines.",
    sample: `1. What is the common color for the USB 3.0 connector for Standard A receptacles and plugs?
Blue

2. What type of memory is used in the Solid State Drive (SSD) as storage?
Flash memory

3. Where is BIOS stored originally in a standard PC?
Read Only Memory (ROM)`,
    howItWorks: "The parser detects numbered items (1., 2., 3. or Q1, Q2) and automatically pairs each question with its answer.",
    engine: "native",
  },
  {
    id: "bold",
    title: "2. Bold Term = Answer (Markdown / Rich Paste)",
    icon: Sparkles,
    badge: "Smart Highlight",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    description: "Highlight keywords in bold (**word** or <b>word</b>). Review Flash turns the bold word into the answer and creates an active recall question.",
    sample: `• The **mitochondria** is known as the powerhouse of the cell.
• The **central processing unit (CPU)** performs the primary calculations in a computer.
• The speed of light in vacuum is approximately **299,792 kilometers per second**.`,
    howItWorks: "Paste directly from Word, Google Docs, or markdown. Bolded terms are automatically extracted as answers with fill-in-the-blank or recall questions.",
    engine: "native",
  },
  {
    id: "delimiter",
    title: "3. Delimiters (Tab / Dash / Colon / Semicolon)",
    icon: Zap,
    badge: "Spreadsheets & Lists",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    description: "Simple key-value lines separated by dashes, colons, or tab characters pasted from Excel / Google Sheets.",
    sample: `HTTP - Hypertext Transfer Protocol (Port 80)
HTTPS - Hypertext Transfer Protocol Secure (Port 443)
DNS : Domain Name System for resolving IP addresses
SSH : Secure Shell for encrypted remote management (Port 22)`,
    howItWorks: "Each line is split at the separator (dash '-', colon ':', tab '\\t', or semicolon ';'). Left side becomes the question/term, right side becomes the answer.",
    engine: "native",
  },
  {
    id: "ai-context",
    title: "4. DITroy AI: Context-to-Flashcards (Raw Notes)",
    icon: Bot,
    badge: "AI Powered",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    description: "Paste raw textbook paragraphs, lecture slides, Wikipedia summaries, or study notes. AI synthesizes complete Q&A flashcards from scratch.",
    sample: `The OSI (Open Systems Interconnection) reference model is a conceptual framework that divides network communications into seven layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application. TCP operates at the Transport layer to provide reliable, connection-oriented packet delivery with flow control and error checking, whereas UDP operates without connection handshakes for lower latency.`,
    howItWorks: "DITroy AI analyzes key principles, core definitions, and testable facts, generating question prompts, complete answers, difficulty ratings (1–5), and tags.",
    engine: "ai",
  },
  {
    id: "ai-detect",
    title: "5. DITroy AI: Auto-Detect Irregular Q&A",
    icon: Wand2,
    badge: "Messy Text AI",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    description: "Extract questions and answers from messy or irregularly formatted transcripts without manual reformatting.",
    sample: `Q: What is RAM? Answer: Random Access Memory which is volatile.
Next question: What is ROM? It's Read Only Memory which is non-volatile.
Also tell me what GPU stands for: Graphics Processing Unit.`,
    howItWorks: "AI parses informal and conversational questions and answers, neatly separating them into clean flashcard cards.",
    engine: "ai",
  },
];

export const FAQ_ITEMS = [
  {
    category: "Creating & Formatting Cards",
    question: "What is the difference between Native Smart Auto-Detect and DITroy AI Smart Detect?",
    answer:
      "Native Smart Auto-Detect runs entirely in your browser using instant regex heuristics. It has zero latency and works offline on formatted lists (numbered, bolded, or separated by dashes/colons). DITroy AI Smart Detect connects to our cloud AI model to read unstructured textbook paragraphs, lecture transcripts, and complex notes to generate rich, testable questions and answers from scratch.",
  },
  {
    category: "Creating & Formatting Cards",
    question: "Can I paste directly from Google Docs, Microsoft Word, or PDF files?",
    answer:
      "Yes! When you copy and paste rich text with bold formatting (e.g. from Word or Docs) into the Smart Textarea, Review Flash automatically preserves bold markers (**word**) so the parser can turn bold words into answers instantly.",
  },
  {
    category: "Creating & Formatting Cards",
    question: "How do I edit or delete cards before saving them to a deck?",
    answer:
      "Once cards are parsed or generated, they appear in the 'Deck Staging Queue' at the bottom of the page. You can click the Edit (pencil) button on any card to refine the question/answer, change individual difficulty levels (1 to 5), or delete unwanted cards with the trash icon.",
  },
  {
    category: "Creating & Formatting Cards",
    question: "What does 'Clean Question Numbers' do?",
    answer:
      "When enabled, it automatically removes prefix numbers like '1.', '2.', 'Q1:', or 'Item 3.' from your questions, so your flashcards have clean, professional wording during study sessions and tests.",
  },
  {
    category: "AI & DITroy Tutor",
    question: "How does the DITroy AI Study Tutor work?",
    answer:
      "The DITroy AI Tutor (available via the 'AI Tutor ✨' button in the navbar or during study sessions) acts as your personal 1-on-1 tutor. It can generate mnemonic devices, simplify complex topics, explain why an answer is correct, and create practice quiz questions tailored to your active flashcard.",
  },
  {
    category: "AI & DITroy Tutor",
    question: "Is AI chat memory and conversation history saved?",
    answer:
      "Yes! All AI Tutor conversations and learned concepts are synchronized with Firebase Firestore under your account. You can reopen previous tutoring sessions or start fresh whenever you want.",
  },
  {
    category: "Study Modes & Testing",
    question: "How do the Difficulty Levels (1 to 5) work?",
    answer:
      "Each flashcard has a difficulty rating: Level 1 (Easy), Level 2 (Moderate), Level 3 (Medium), Level 4 (Hard), and Level 5 (Expert). In Test and Review modes, you can filter by difficulty to focus on your weakest concepts or simulate comprehensive exams.",
  },
  {
    category: "Study Modes & Testing",
    question: "What is Spaced Repetition and why is it effective?",
    answer:
      "Spaced repetition is an evidence-based learning technique where cards you struggle with are reviewed more frequently, while cards you know well are spaced out over longer intervals. This maximizes long-term memory retention while saving you study time.",
  },
  {
    category: "Sharing & Permissions",
    question: "How do I share my flashcard deck with friends or classmates?",
    answer:
      "Open any deck and click 'Share Deck'. You will receive a unique 6-character Share Code and a direct link. Other users can enter the share code in the 'Decks' page to import and study your set immediately.",
  },
  {
    category: "Sharing & Permissions",
    question: "What happens if someone edits a deck I shared as 'Read-Only'?",
    answer:
      "If a deck is set to Read-Only (Viewer mode), other users can freely study, preview, and test themselves on it. If they make edits in the Deck Creator, Review Flash automatically forks the changes into their own personal copy, keeping your original deck 100% protected!",
  },
];

export function HelpGuideModal({ isOpen, onClose, onInsertSample }: HelpGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"guide" | "faq" | "tips">("guide");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (!isOpen) return null;

  const handleCopySample = async (sample: string, id: string) => {
    try {
      await navigator.clipboard.writeText(sample);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUseInStudio = (sample: string, engine: string) => {
    if (onInsertSample) {
      onInsertSample(sample, engine);
      onClose();
    }
  };

  // Filter FAQs
  const categories = ["all", ...Array.from(new Set(FAQ_ITEMS.map((f) => f.category)))];
  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4.5 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <HelpCircle size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>ReviewFlash Guide &amp; Knowledge Base</span>
                <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-400 border border-cyan-500/20">
                  Cheat Sheet
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Master flashcard creation formats, DITroy AI features, and spaced repetition
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-2.5 bg-slate-950/30 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("guide")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "guide"
                ? "bg-cyan-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <FileText size={15} />
            <span>Format Cheat Sheet &amp; Examples</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("faq")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "faq"
                ? "bg-cyan-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <HelpCircle size={15} />
            <span>Frequently Asked Questions ({FAQ_ITEMS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tips")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "tips"
                ? "bg-cyan-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Lightbulb size={15} />
            <span>Pro Study &amp; Recall Tips</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: FORMAT CHEAT SHEET */}
          {activeTab === "guide" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-xs text-cyan-200 space-y-1">
                <div className="font-bold flex items-center gap-2 text-sm text-white">
                  <Zap size={16} className="text-cyan-400" />
                  <span>How to Insert Flashcards in Any Format</span>
                </div>
                <p className="text-cyan-200/90 leading-relaxed">
                  Review Flash features a universal intelligent parser. Choose any format below, copy the sample or paste your own study materials, and let the parser create instant cards!
                </p>
              </div>

              <div className="space-y-4">
                {SAMPLE_FORMATS.map((format) => {
                  const Icon = format.icon;
                  const isCopied = copiedId === format.id;

                  return (
                    <div
                      key={format.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-3.5 transition hover:border-slate-700"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-cyan-400">
                            <Icon size={16} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">{format.title}</h3>
                            <p className="text-[11px] text-slate-400">{format.description}</p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${format.badgeColor}`}
                        >
                          {format.badge}
                        </span>
                      </div>

                      {/* Code Sample Box */}
                      <div className="relative rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {format.sample}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Lightbulb size={13} className="text-amber-400 shrink-0" />
                          <span>{format.howItWorks}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopySample(format.sample, format.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                          >
                            {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                            <span>{isCopied ? "Copied!" : "Copy Sample"}</span>
                          </button>

                          {onInsertSample && (
                            <button
                              type="button"
                              onClick={() => handleUseInStudio(format.sample, format.engine)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer shadow-sm"
                            >
                              <Plus size={14} />
                              <span>Try in Studio</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FREQUENTLY ASKED QUESTIONS */}
          {activeTab === "faq" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Search & Category Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search answers (e.g., 'Google Docs', 'AI Tutor', 'Permissions', 'Spaced Repetition')..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-xl px-3 py-1 text-[11px] font-semibold transition cursor-pointer capitalize ${
                        selectedCategory === cat
                          ? "bg-cyan-500 text-slate-950"
                          : "border border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                      }`}
                    >
                      {cat === "all" ? "All Categories" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Accordion List */}
              <div className="space-y-2.5">
                {filteredFaqs.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center text-slate-400 text-xs">
                    No FAQs matched &quot;{searchQuery}&quot;. Try a different keyword or contact support!
                  </div>
                ) : (
                  filteredFaqs.map((faq, idx) => {
                    const isExpanded = expandedFaqIndex === idx;

                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden transition hover:border-slate-700"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                          className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                              Q
                            </span>
                            <span className="text-xs font-bold text-slate-100">{faq.question}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="hidden sm:inline rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                              {faq.category}
                            </span>
                            {isExpanded ? (
                              <ChevronDown size={16} className="text-cyan-400" />
                            ) : (
                              <ChevronRight size={16} className="text-slate-500" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-slate-800/80 bg-slate-900/60 p-4 pt-3 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-150">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PRO STUDY TIPS */}
          {activeTab === "tips" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-950/80 p-5 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                  <GraduationCap className="h-5 w-5 text-amber-300" />
                  <span>Science-Backed Active Recall Strategies</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Flashcards work best when questions test one specific concept rather than long essay answers. Follow these 4 principles to dramatically increase retention:
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                    <span>1. The Minimum Information Principle</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Keep your answers concise and atomic. Rather than memorizing 5 concepts on one card, create 5 separate flashcards.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <span>2. Active Recall vs. Recognition</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Always think through the answer in your head or speak it aloud before flipping the card. Merely recognizing an answer does not build durable memory.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <span>3. Calibrate Difficulty Ratings (1–5)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Assign difficulty levels accurately (1 Easy to 5 Expert). You can filter your review sessions by difficulty to focus strictly on tough cards before an exam.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                    <span>4. Use Mnemonic Devices with AI Tutor</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Struggling with a difficult term? Open the <strong>DITroy AI Tutor</strong> during review and ask for a clever acronym, visual metaphor, or rhyme.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-3.5 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles size={14} className="text-amber-300" />
            <span>Need more help? Chat directly with the DITroy AI Tutor!</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
