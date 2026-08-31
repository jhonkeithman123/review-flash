"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  ListOrdered,
  Plus,
  PlusCircle,
  Search,
  Share2,
  Shield,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { SAMPLE_FORMATS, FAQ_ITEMS } from "@/components/help-guide-modal";
import { parseTextToCards, StagedCard } from "../create/page";


export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Interactive Live Playground State
  const [playgroundText, setPlaygroundText] = useState(
    `1. What is the powerhouse of the cell?\nMitochondria\n\n2. What organelle conducts photosynthesis in plant cells?\nChloroplast\n\n3. What is the molecule that stores cellular energy?\nAdenosine Triphosphate (ATP)`
  );
  const [playgroundMode, setPlaygroundMode] = useState<"auto" | "numbered" | "bold-answer" | "delimiter">("auto");
  const [stripNumbers, setStripNumbers] = useState(true);

  const parsedPlaygroundCards = parseTextToCards(playgroundText, playgroundMode, "auto", "blank", stripNumbers);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const categories = ["all", ...Array.from(new Set(FAQ_ITEMS.map((f) => f.category)))];
  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-bold text-cyan-300">
            <HelpCircle size={14} className="text-cyan-400" />
            <span>Help Center &amp; Flashcard Insertion Guide</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            How can we help you <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">study smarter</span>?
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Learn all supported flashcard insertion formats, discover DITroy AI capabilities, and master active recall strategies for optimal retention.
          </p>

          {/* Quick Search Bar */}
          <div className="relative pt-2">
            <Search size={18} className="absolute left-3.5 top-[calc(50%+4px)] -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics (e.g. 'Numbered format', 'Bold answers', 'DITroy AI', 'Permissions')..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 pl-11 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-[calc(50%+4px)] -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Decorative ambient glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-10 -bottom-20 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      {/* SECTION 1: FLASHCARD INSERTION FORMAT CHEAT SHEET */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Supported Flashcard Formats</h2>
              <p className="text-xs text-slate-400">Copy any template or paste directly into the studio</p>
            </div>
          </div>

          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <PlusCircle size={15} />
            <span>Open Deck Creator</span>
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {SAMPLE_FORMATS.map((format) => {
            const Icon = format.icon;
            const isCopied = copiedId === format.id;

            return (
              <div
                key={format.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition hover:border-slate-700"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-800 text-cyan-300">
                        <Icon size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{format.title}</h3>
                        <p className="text-[11px] text-slate-400">{format.description}</p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold shrink-0 ${format.badgeColor}`}
                    >
                      {format.badge}
                    </span>
                  </div>

                  {/* Code Sample */}
                  <div className="relative rounded-2xl border border-slate-800 bg-slate-950/90 p-3.5 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {format.sample}
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
                    <Lightbulb size={13} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{format.howItWorks}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-4 mt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleCopy(format.sample, format.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                  >
                    {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{isCopied ? "Copied Sample" : "Copy Template"}</span>
                  </button>

                  <Link
                    href={`/create?template=${format.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
                  >
                    <span>Use in Creator</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: LIVE PARSER PLAYGROUND SIMULATOR */}
      <section className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Live Parser Playground</h2>
              <p className="text-xs text-slate-400">Test pasting text below and watch how Review Flash parses it in real time!</p>
            </div>
          </div>

          {/* Strategy selector */}
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setPlaygroundMode("auto")}
              className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                playgroundMode === "auto" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              🌟 Auto
            </button>
            <button
              type="button"
              onClick={() => setPlaygroundMode("numbered")}
              className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                playgroundMode === "numbered" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              1. Numbered
            </button>
            <button
              type="button"
              onClick={() => setPlaygroundMode("bold-answer")}
              className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                playgroundMode === "bold-answer" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Bold Answer
            </button>
            <button
              type="button"
              onClick={() => setPlaygroundMode("delimiter")}
              className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                playgroundMode === "delimiter" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Dash / Colon
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Input Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Your Input Text:</span>
              <span className="text-[11px] text-slate-500 font-mono">Editable</span>
            </label>
            <textarea
              value={playgroundText}
              onChange={(e) => setPlaygroundText(e.target.value)}
              rows={8}
              className="w-full font-mono text-xs leading-relaxed rounded-2xl border border-slate-700 bg-slate-950 p-4 text-slate-100 placeholder:text-slate-600 outline-none focus:border-cyan-400"
            />
          </div>

          {/* Live Detected Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-cyan-400" />
                Live Detected Cards ({parsedPlaygroundCards.length})
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                <input
                  type="checkbox"
                  checked={stripNumbers}
                  onChange={(e) => setStripNumbers(e.target.checked)}
                  className="rounded border-slate-700 accent-cyan-500"
                />
                <span>Clean Numbers</span>
              </label>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 h-[184px] overflow-y-auto space-y-2 text-xs">
              {parsedPlaygroundCards.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-500 text-xs">
                  Type or paste text on the left to see parsed flashcards!
                </div>
              ) : (
                parsedPlaygroundCards.map((card: StagedCard, i: number) => (
                  <div key={i} className="rounded-xl border border-slate-800/80 bg-slate-900/80 p-2.5 space-y-1">

                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-cyan-400 shrink-0">Q{i + 1}:</span>
                      <span className="text-slate-100">{card.question}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-emerald-400 shrink-0">Ans:</span>
                      <span className="text-emerald-300 font-semibold">{card.answer}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FREQUENTLY ASKED QUESTIONS */}
      <section className="space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Frequently Asked Questions</h2>
              <p className="text-xs text-slate-400">Find quick answers to common questions</p>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer capitalize ${
                selectedCategory === cat
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white"
              }`}
            >
              {cat === "all" ? "All Questions" : cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400 text-sm">
              No answers matched &quot;{searchQuery}&quot;. Try a different term or open the AI Tutor.
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx;

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden transition hover:border-slate-700 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between gap-3 p-4.5 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                        Q
                      </span>
                      <span className="text-sm font-bold text-slate-100">{faq.question}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-medium">
                        {faq.category}
                      </span>
                      {isExpanded ? (
                        <ChevronDown size={18} className="text-cyan-400" />
                      ) : (
                        <ChevronRight size={18} className="text-slate-500" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-800/80 bg-slate-950/60 p-5 pt-3.5 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* SECTION 4: PRO ACTIVE RECALL STRATEGIES */}
      <section className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 to-slate-950 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
            <GraduationCap size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Evidence-Based Flashcard Design Tips</h2>
            <p className="text-xs text-indigo-200/80">Get the highest score with the least study time</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-2">
            <div className="font-bold text-xs text-cyan-300">1. Atomic Cards</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Test one fact per card. Splitting complex paragraphs into 3 concise cards doubles recall speed.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-2">
            <div className="font-bold text-xs text-emerald-300">2. Active Retrieval</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Always attempt to answer before clicking flip. Retrieval effort is what cements neural pathways.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-2">
            <div className="font-bold text-xs text-amber-300">3. Difficulty Calibration</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Rate cards honestly from 1 to 5. Use the difficulty filter in Test Mode before major exam days.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-2">
            <div className="font-bold text-xs text-purple-300">4. Mnemonic Devices</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When a card won&apos;t stick, click <strong>AI Tutor ✨</strong> to instantly generate a memorable acronym or story.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <div>
          <h3 className="text-sm font-bold text-white">Ready to create your next study set?</h3>
          <p className="text-xs text-slate-400">Paste your reviewer or generate cards with DITroy AI in seconds.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <Plus size={15} />
            <span>Create Flashcards</span>
          </Link>
          <Link
            href="/decks"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            <BookOpen size={15} />
            <span>Explore My Decks</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
