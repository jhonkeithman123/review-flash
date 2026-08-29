"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ClipboardPaste,
  Crown,
  Edit2,
  FileText,
  HelpCircle,
  Layers,
  ListOrdered,
  Lock,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  Shuffle,
  Sparkles,
  Tag,
  Trash2,
  Type,
  Unlock,
  Users,
  Zap,
} from "lucide-react";
import { AuthorizedCollaborator, Deck, DeckPermissionRole, Flashcard, UserDeckRole } from "@/types/flashcard";
import {
  canUserEditDeck,
  createDeck,
  fetchDeckById,
  fetchDecks,
  getCurrentUserEmail,
  getCurrentUserId,
  getCurrentUserName,
  getUserDeckRole,
  updateDeck,
} from "@/lib/flashcardService";
import { ShareDeckModal } from "@/components/share-deck-modal";

interface StagedCard {
  tempId: string;
  question: string;
  answer: string;
  tags: string[];
  difficulty: number; // 1 to 5, default 3
}

// Convert HTML rich text clipboard into markdown with **bold** markers
function convertHtmlToMarkdownBold(html: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const boldElements = doc.querySelectorAll(
      "strong, b, [style*='font-weight: bold'], [style*='font-weight:bold'], [style*='font-weight: 700'], [style*='font-weight:700'], [style*='font-weight: 800'], [style*='font-weight: 900']"
    );

    boldElements.forEach((el) => {
      const text = el.textContent?.trim();
      if (text) {
        el.replaceWith(` **${text}** `);
      }
    });

    doc.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
    doc.querySelectorAll("p, div, li, tr").forEach((p) => {
      p.append("\n");
    });

    return doc.body.textContent || "";
  } catch {
    return html;
  }
}

// Universal parser supporting Numbered Reviewers, Multi-line Questions, Bold answers, Q/A, and Delimiters
function parseTextToCards(
  rawText: string,
  mode: "auto" | "numbered" | "bold-answer" | "bold-question" | "delimiter",
  delimiter: "auto" | "tab" | "dash" | "colon" | "semicolon",
  clozeStyle: "blank" | "clean",
  stripNumbers: boolean,
  activeTags: string[]
): StagedCard[] {
  const normalized = rawText.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // Check if text has numbered items (e.g., "1. ", "2) ", "Q1: ", "1 - ")
  const hasNumberedItems = /(?:^|\n)\s*(?:(?:Q\s*|Question\s*)?\d+[\.\)\:\-\]]|\bQ\d+[:\.\-])/i.test(normalized);
  // Check if text has bold markdown or HTML
  const hasBoldMarkers = /(\*\*(.+?)\*\*|<b>(.+?)<\/b>|<strong>(.+?)<\/strong>)/.test(normalized);

  // If Auto mode, select best matching strategy
  let effectiveMode = mode;
  if (mode === "auto") {
    if (hasNumberedItems) {
      effectiveMode = "numbered";
    } else if (hasBoldMarkers) {
      effectiveMode = "bold-answer";
    } else if (normalized.includes("\t") || normalized.includes(" - ") || /Q\s*[:.-]/i.test(normalized)) {
      effectiveMode = "delimiter";
    } else {
      effectiveMode = "numbered"; // fallback
    }
  }

  // ----------------------------------------------------
  // STRATEGY 1: NUMBERED REVIEWER / EXAM Q&A (e.g. 1. Question...\nAnswer\n2. ...)
  // ----------------------------------------------------
  if (effectiveMode === "numbered") {
    const itemHeaderRegex = /(?:^|\n)(?=(?:(?:Q\s*|Question\s*)?\d+[\.\)\:\-\]]|\bQ\d+[:\.\-]))/i;
    const rawBlocks = normalized.split(itemHeaderRegex).map((b) => b.trim()).filter(Boolean);
    const results: StagedCard[] = [];

    for (let i = 0; i < rawBlocks.length; i++) {
      const block = rawBlocks[i];
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      // Check if block has explicit Answer prefix
      const explicitAnsIdx = lines.findIndex((l) => /^(?:Ans(?:wer)?|A)\s*[:.\-]\s*/i.test(l));

      let qRaw = "";
      let aRaw = "";

      if (explicitAnsIdx !== -1) {
        qRaw = lines.slice(0, explicitAnsIdx).join(" ").trim();
        aRaw = lines.slice(explicitAnsIdx).join(" ").replace(/^(?:Ans(?:wer)?|A)\s*[:.\-]\s*/i, "").trim();
      } else if (lines.length >= 2) {
        // Find if any line ends with a question mark '?'
        const qMarkIdx = lines.findIndex((l) => l.endsWith("?"));
        if (qMarkIdx !== -1 && qMarkIdx < lines.length - 1) {
          qRaw = lines.slice(0, qMarkIdx + 1).join(" ").trim();
          aRaw = lines.slice(qMarkIdx + 1).join(" ").trim();
        } else {
          // Last line is answer, preceding lines are question
          qRaw = lines.slice(0, lines.length - 1).join(" ").trim();
          aRaw = lines[lines.length - 1].trim();
        }
      } else if (lines.length === 1) {
        // Single line item - check for inline separator or bold
        const single = lines[0];
        if (single.includes("\t")) {
          const parts = single.split("\t");
          qRaw = parts[0].trim();
          aRaw = parts.slice(1).join("\t").trim();
        } else if (single.includes(" - ") || single.includes(" -- ")) {
          const parts = single.includes(" -- ") ? single.split(" -- ") : single.split(" - ");
          qRaw = parts[0].trim();
          aRaw = parts.slice(1).join(" - ").trim();
        } else if (single.includes(" : ") || single.includes(":\t")) {
          const parts = single.split(/:\s+|\t/);
          qRaw = parts[0].trim();
          aRaw = parts.slice(1).join(": ").trim();
        }
      }

      // Check if answer is enclosed in bold or starts with bold
      const boldInAns = aRaw.match(/^(\*\*(.+?)\*\*|<b>(.+?)<\/b>|<strong>(.+?)<\/strong>)/);
      if (boldInAns) {
        aRaw = boldInAns[2] || boldInAns[3] || boldInAns[4] || aRaw;
      }

      // Strip leading number if enabled
      let cleanQuestion = qRaw;
      if (stripNumbers) {
        cleanQuestion = cleanQuestion.replace(/^(?:(?:Q\s*|Question\s*)?\d+[\.\)\:\-\]]*|\bQ\d+[:\.\-]*)\s*/i, "").trim();
      }

      const cleanAnswer = aRaw.trim();

      if (cleanQuestion && cleanAnswer) {
        results.push({
          tempId: "staged-num-" + i + "-" + Math.random().toString(36).substring(2, 5),
          question: cleanQuestion,
          answer: cleanAnswer,
          tags: activeTags,
          difficulty: 3,
        });
      }
    }

    if (results.length > 0) return results;
  }

  // ----------------------------------------------------
  // STRATEGY 2: BOLD IS ANSWER (Auto Cloze / Q&A Extraction)
  // ----------------------------------------------------
  if (effectiveMode === "bold-answer") {
    const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
    const results: StagedCard[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const boldRegex = /(\*\*(.+?)\*\*|<b>(.+?)<\/b>|<strong>(.+?)<\/strong>)/g;
      const boldMatches = [...line.matchAll(boldRegex)];

      if (boldMatches.length > 0) {
        const answers = boldMatches
          .map((m) => m[2] || m[3] || m[4])
          .filter(Boolean)
          .map((s) => s.trim());

        const answerText = answers.join(", ");

        let questionText = line;
        if (clozeStyle === "blank") {
          questionText = questionText.replace(boldRegex, " [ ______ ] ");
        } else {
          questionText = questionText.replace(boldRegex, "$2$3$4");
        }

        questionText = questionText
          .replace(/^[•\-\*]\s*/, "")
          .replace(/\s+/g, " ")
          .trim();

        if (
          questionText.includes(" - [ ______ ]") ||
          questionText.includes(" : [ ______ ]") ||
          questionText.includes(" -- [ ______ ]")
        ) {
          questionText = questionText
            .replace(/\s*[-:–—]\s*\[ ______ \]\s*$/, "")
            .trim();
        }

        if (stripNumbers) {
          questionText = questionText.replace(/^(?:(?:Q\s*|Question\s*)?\d+[\.\)\:\-\]]*|\bQ\d+[:\.\-]*)\s*/i, "").trim();
        }

        if (questionText && answerText) {
          results.push({
            tempId: "staged-bold-" + i + "-" + Math.random().toString(36).substring(2, 5),
            question: questionText,
            answer: answerText,
            tags: activeTags,
            difficulty: 3,
          });
        }
      }
    }

    if (results.length > 0) return results;
  }

  // ----------------------------------------------------
  // STRATEGY 3: BOLD IS QUESTION / TERM
  // ----------------------------------------------------
  if (effectiveMode === "bold-question") {
    const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
    const results: StagedCard[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const boldRegex = /(\*\*(.+?)\*\*|<b>(.+?)<\/b>|<strong>(.+?)<\/strong>)/g;
      const boldMatches = [...line.matchAll(boldRegex)];

      if (boldMatches.length > 0) {
        let questionText = (boldMatches[0][2] || boldMatches[0][3] || boldMatches[0][4] || "").trim();
        let answerText = line
          .replace(boldRegex, "")
          .replace(/^[:\-–—\.\s]+/, "")
          .trim();

        if (stripNumbers) {
          questionText = questionText.replace(/^(?:(?:Q\s*|Question\s*)?\d+[\.\)\:\-\]]*|\bQ\d+[:\.\-]*)\s*/i, "").trim();
        }

        if (questionText && answerText) {
          results.push({
            tempId: "staged-term-" + i + "-" + Math.random().toString(36).substring(2, 5),
            question: questionText,
            answer: answerText,
            tags: activeTags,
            difficulty: 3,
          });
        }
      }
    }

    if (results.length > 0) return results;
  }

  // ----------------------------------------------------
  // STRATEGY 4: DELIMITER / QA PAIR
  // ----------------------------------------------------
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
  const results: StagedCard[] = [];
  let isQAMode = lines.some((l) => /^Q\s*[:.-]/i.test(l));

  if (isQAMode) {
    let curQ = "";
    let curA = "";
    for (const line of lines) {
      if (/^Q\s*[:.-]/i.test(line)) {
        if (curQ && curA) {
          results.push({
            tempId: "staged-qa-" + results.length,
            question: stripNumbers ? curQ.replace(/^(?:(?:Q\s*|Question\s*)?\d+[\.\)\:\-\]]*|\bQ\d+[:\.\-]*)\s*/i, "").trim() : curQ,
            answer: curA,
            tags: activeTags,
            difficulty: 3,
          });
          curA = "";
        }
        curQ = line.replace(/^Q\s*[:.-]\s*/i, "").trim();
      } else if (/^A\s*[:.-]/i.test(line)) {
        curA = line.replace(/^A\s*[:.-]\s*/i, "").trim();
      } else {
        if (curA) curA += " " + line;
        else if (curQ) curQ += " " + line;
      }
    }
    if (curQ && curA) {
      results.push({
        tempId: "staged-qa-" + results.length,
        question: stripNumbers ? curQ.replace(/^(?:(?:Q\s*|Question\s*)?\d+[\.\)\:\-\]]*|\bQ\d+[:\.\-]*)\s*/i, "").trim() : curQ,
        answer: curA,
        tags: activeTags,
        difficulty: 3,
      });
    }
  } else {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let q = "";
      let a = "";

      if (delimiter === "tab" || (delimiter === "auto" && line.includes("\t"))) {
        const parts = line.split("\t");
        q = parts[0]?.trim();
        a = parts.slice(1).join("\t").trim();
      } else if (delimiter === "dash" || (delimiter === "auto" && (line.includes(" - ") || line.includes(" -- ")))) {
        const parts = line.includes(" -- ") ? line.split(" -- ") : line.split(" - ");
        q = parts[0]?.trim();
        a = parts.slice(1).join(" - ").trim();
      } else if (delimiter === "semicolon" || (delimiter === "auto" && line.includes(";"))) {
        const parts = line.split(";");
        q = parts[0]?.trim();
        a = parts.slice(1).join(";").trim();
      } else if (line.includes(":") && !line.startsWith("http")) {
        const parts = line.split(":");
        q = parts[0]?.trim();
        a = parts.slice(1).join(":").trim();
      } else {
        if (i + 1 < lines.length) {
          q = line;
          a = lines[i + 1];
          i++;
        }
      }

      if (stripNumbers && q) {
        q = q.replace(/^(?:(?:Q\s*|Question\s*)?\d+[\.\)\:\-\]]*|\bQ\d+[:\.\-]*)\s*/i, "").trim();
      }

      if (q && a) {
        results.push({
          tempId: "staged-del-" + i + "-" + Math.random().toString(36).substring(2, 5),
          question: q,
          answer: a,
          tags: activeTags,
          difficulty: 3,
        });
      }
    }
  }

  return results;
}

function CreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingDeckId = searchParams.get("deckId");

  const [existingDecks, setExistingDecks] = useState<Deck[]>([]);
  const [targetDeckMode, setTargetDeckMode] = useState<"new" | "existing">(
    existingDeckId ? "existing" : "new"
  );
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    existingDeckId || ""
  );

  // Deck metadata
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [setTags, setSetTags] = useState(""); // Persistent set tags!
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [defaultRole, setDefaultRole] = useState<DeckPermissionRole>("viewer");
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedCollaborator[]>([]);
  const [newCollabInput, setNewCollabInput] = useState("");
  const [newCollabRole, setNewCollabRole] = useState<DeckPermissionRole>("editor");
  const [showPermissionsPanel, setShowPermissionsPanel] = useState(false);
  const [activeDeckRole, setActiveDeckRole] = useState<UserDeckRole>("owner");
  const [activeDeckAuthorName, setActiveDeckAuthorName] = useState<string>("");

  // Active Input Mode: 'rapid' or 'bulk'
  const [inputTab, setInputTab] = useState<"rapid" | "bulk">("bulk");

  // Rapid Entry State
  const [rapidQuestion, setRapidQuestion] = useState("");
  const [rapidAnswer, setRapidAnswer] = useState("");
  const questionInputRef = useRef<HTMLTextAreaElement>(null);

  // Smart Parser State
  const [bulkText, setBulkText] = useState("");
  const [parserMode, setParserMode] = useState<"auto" | "numbered" | "bold-answer" | "bold-question" | "delimiter">("auto");
  const [bulkDelimiter, setBulkDelimiter] = useState<"auto" | "tab" | "dash" | "colon" | "semicolon">("auto");
  const [clozeStyle, setClozeStyle] = useState<"blank" | "clean">("blank");
  const [stripNumbers, setStripNumbers] = useState(true);

  // Staged Cards (Queue)
  const [stagedCards, setStagedCards] = useState<StagedCard[]>([]);

  // Editing state for staged card
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  // Save / Share state
  const [isSaving, setIsSaving] = useState(false);
  const [savedDeck, setSavedDeck] = useState<Deck | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Load existing decks if user wants to add or edit an existing deck
  useEffect(() => {
    async function load() {
      const decks = await fetchDecks();
      setExistingDecks(decks);
      const targetId = existingDeckId || (targetDeckMode === "existing" && decks.length > 0 ? decks[0].id : "");
      if (targetId) {
        let target = decks.find((d) => d.id === targetId);
        if (!target) {
          target = (await fetchDeckById(targetId)) || undefined;
        }
        if (target) {
          const role = getUserDeckRole(target, getCurrentUserId(), getCurrentUserEmail(), getCurrentUserName());
          setActiveDeckRole(role);
          setActiveDeckAuthorName(target.authorName || target.authorEmail || target.authorId || "Original Creator");
          setSelectedDeckId(target.id);
          setDeckTitle(target.title);
          setSetTags(target.tags.join(", "));
          setDeckDescription(target.description || "");
          setShuffleQuestions(target.shuffleQuestions ?? false);
          setDefaultRole(target.accessControl?.defaultRole || "viewer");
          setAuthorizedUsers(target.accessControl?.authorizedUsers || []);
          // Load all existing cards into the staging queue for full editing
          setStagedCards(
            target.cards.map((c) => ({
              tempId: c.id,
              question: c.question,
              answer: c.answer,
              tags: c.tags,
              difficulty: c.difficulty || 3,
            }))
          );

          if (typeof window !== "undefined") {
            console.log("🎯 [Create Studio Loaded Deck]", {
              deckId: target.id,
              deckTitle: target.title,
              deckAuthorId: target.authorId,
              deckAuthorEmail: target.authorEmail,
              deckShareCode: target.shareCode,
              deckAccessControl: target.accessControl,
              activeRole: role,
              myUserId: getCurrentUserId(),
              myUserEmail: getCurrentUserEmail() || "(not logged in)",
              myUserName: getCurrentUserName(),
            });
          }
        }
      }
    }
    load();
  }, [existingDeckId, targetDeckMode]);

  const handleExistingDeckChange = async (id: string) => {
    setSelectedDeckId(id);
    let target = existingDecks.find((d) => d.id === id);
    if (!target) {
      target = (await fetchDeckById(id)) || undefined;
    }
    if (target) {
      const role = getUserDeckRole(target, getCurrentUserId(), getCurrentUserEmail(), getCurrentUserName());
      setActiveDeckRole(role);
      setActiveDeckAuthorName(target.authorName || target.authorEmail || target.authorId || "Original Creator");
      setDeckTitle(target.title);
      setSetTags(target.tags.join(", "));
      setDeckDescription(target.description || "");
      setShuffleQuestions(target.shuffleQuestions ?? false);
      setDefaultRole(target.accessControl?.defaultRole || "viewer");
      setAuthorizedUsers(target.accessControl?.authorizedUsers || []);
      setStagedCards(
        target.cards.map((c) => ({
          tempId: c.id,
          question: c.question,
          answer: c.answer,
          tags: c.tags,
          difficulty: c.difficulty || 3,
        }))
      );

      if (typeof window !== "undefined") {
        console.log("🔄 [Switched Selected Deck in Studio]", {
          deckId: target.id,
          deckTitle: target.title,
          deckAuthorId: target.authorId,
          activeRole: role,
          myUserId: getCurrentUserId(),
          myUserEmail: getCurrentUserEmail() || "(not logged in)",
        });
      }
    }
  };

  const getParsedSetTags = () => {
    return setTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    const id = newCollabInput.trim();
    if (!id) return;
    if (authorizedUsers.some((u) => u.identifier.toLowerCase() === id.toLowerCase())) {
      return;
    }
    setAuthorizedUsers((prev) => [...prev, { identifier: id, role: newCollabRole }]);
    setNewCollabInput("");
  };

  const handleRemoveCollaborator = (identifier: string) => {
    setAuthorizedUsers((prev) => prev.filter((u) => u.identifier !== identifier));
  };

  // Rich text clipboard paste handler
  const handleSmartTextPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const htmlData = e.clipboardData.getData("text/html");

    if (htmlData && (htmlData.includes("<strong") || htmlData.includes("<b") || htmlData.includes("font-weight"))) {
      e.preventDefault();
      const converted = convertHtmlToMarkdownBold(htmlData);

      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = bulkText;
      const updated = current.substring(0, start) + converted + current.substring(end);

      setBulkText(updated);
      setStatusMessage({
        type: "info",
        text: "✨ Rich text pasted: Bold keywords and formatting captured automatically!",
      });
    }
  };

  // Live parsed preview of bulk text
  const liveParsedPreview = useMemo(() => {
    return parseTextToCards(
      bulkText,
      parserMode,
      bulkDelimiter,
      clozeStyle,
      stripNumbers,
      getParsedSetTags()
    );
  }, [bulkText, parserMode, bulkDelimiter, clozeStyle, stripNumbers, setTags]);

  // Rapid manual add
  const handleAddRapidCard = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const q = rapidQuestion.trim();
    const a = rapidAnswer.trim();

    if (!q || !a) {
      setStatusMessage({
        type: "error",
        text: "Please provide both Question and Answer before staging.",
      });
      return;
    }

    const newCard: StagedCard = {
      tempId: "staged-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      question: q,
      answer: a,
      tags: getParsedSetTags(),
      difficulty: 3,
    };

    setStagedCards((prev) => [...prev, newCard]);
    setRapidQuestion("");
    setRapidAnswer("");
    setStatusMessage({
      type: "success",
      text: `Card staged! (${stagedCards.length + 1} total). Set difficulty in the review section below.`,
    });

    if (questionInputRef.current) {
      questionInputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAddRapidCard();
    }
  };

  // Apply parsed bulk cards to staging
  const handleApplyBulkCards = () => {
    if (!bulkText.trim()) {
      setStatusMessage({ type: "error", text: "Please paste text into the box first." });
      return;
    }

    if (liveParsedPreview.length === 0) {
      setStatusMessage({
        type: "error",
        text: "Could not detect cards. Try adjusting the parser mode or formatting.",
      });
      return;
    }

    setStagedCards((prev) => [...prev, ...liveParsedPreview]);
    setBulkText("");
    setStatusMessage({
      type: "success",
      text: `🎉 Successfully parsed and staged ${liveParsedPreview.length} flashcards! Adjust their difficulties below.`,
    });
  };

  // Batch difficulty settings
  const handleSetAllDifficulty = (level: number) => {
    setStagedCards((prev) =>
      prev.map((c) => ({
        ...c,
        difficulty: level,
      }))
    );
    setStatusMessage({
      type: "info",
      text: `Set difficulty for all ${stagedCards.length} cards to Level ${level}.`,
    });
  };

  const handleCardDifficultyChange = (tempId: string, level: number) => {
    setStagedCards((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, difficulty: level } : c))
    );
  };

  const handleDeleteStagedCard = (tempId: string) => {
    setStagedCards((prev) => prev.filter((c) => c.tempId !== tempId));
  };

  const handleStartEditCard = (card: StagedCard) => {
    setEditingCardId(card.tempId);
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
  };

  const handleSaveEditCard = (tempId: string) => {
    setStagedCards((prev) =>
      prev.map((c) =>
        c.tempId === tempId
          ? { ...c, question: editQuestion.trim(), answer: editAnswer.trim() }
          : c
      )
    );
    setEditingCardId(null);
  };

  // Save Deck (Reliable handler for new and existing edited decks)
  const handleSaveDeck = async (autoReview: boolean = false, autoShare: boolean = false) => {
    if (stagedCards.length === 0) {
      setStatusMessage({
        type: "error",
        text: "Please stage at least 1 flashcard before saving.",
      });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const currentUid = getCurrentUserId();
    const currentEmail = getCurrentUserEmail();
    const currentName = getCurrentUserName();

    console.group("💾 [handleSaveDeck Action Started]");
    console.log("Saving deck parameters:", {
      targetDeckMode,
      selectedDeckId,
      existingDeckId,
      deckTitle,
      cardsCount: stagedCards.length,
      currentUserId: currentUid,
      currentUserEmail: currentEmail || "(not logged in)",
      currentUserName: currentName,
    });

    try {
      const parsedTags = getParsedSetTags();
      let finalizedDeck: Deck;

      if (targetDeckMode === "existing" && (selectedDeckId || existingDeckId)) {
        const targetId = selectedDeckId || existingDeckId || "";
        let target = existingDecks.find((d) => d.id === targetId);
        if (!target) {
          target = (await fetchDeckById(targetId)) || undefined;
        }

        const role = target
          ? getUserDeckRole(target, currentUid, currentEmail, currentName)
          : "owner";

        console.log("Target Deck Information:", {
          id: target?.id,
          title: target?.title,
          authorId: target?.authorId,
          authorEmail: target?.authorEmail,
          authorName: target?.authorName,
          shareCode: target?.shareCode,
          accessControl: target?.accessControl,
          computedRole: role,
        });

        if (role === "viewer") {
          console.warn(
            `🔒 [handleSaveDeck: FORK AS PERSONAL COPY] User "${currentUid}" is a VIEWER on "${target?.title}". Overwrite of original database deck is blocked. Creating a brand new personal copy...`
          );

          // Strictly fork as a personal copy without overwriting the original database deck
          finalizedDeck = await createDeck({
            title: deckTitle.trim() || target?.title || "Untitled Study Set",
            description: deckDescription.trim() || target?.description || "",
            tags: parsedTags.length > 0 ? parsedTags : (target?.tags || ["General"]),
            shuffleQuestions,
            accessControl: {
              defaultRole: "viewer",
              visibility: "unlisted",
              authorizedUsers: [],
            },
            cards: stagedCards.map((sc) => ({
              question: sc.question.trim(),
              answer: sc.answer.trim(),
              tags: sc.tags.length > 0 ? sc.tags : parsedTags,
              difficulty: sc.difficulty,
            })),
          });

          console.log("✅ [handleSaveDeck: Fork Success] Created new personal copy with ID:", finalizedDeck.id);

          setSavedDeck(finalizedDeck);
          setStatusMessage({
            type: "success",
            text: `🎉 Saved as your own personal copy "${finalizedDeck.title}" with ${finalizedDeck.cards.length} cards! The original deck was protected.`,
          });
        } else {
          console.log(
            `✏️ [handleSaveDeck: UPDATE & SYNC] User "${currentUid}" has "${role.toUpperCase()}" role. Updating original deck ID "${target?.id || targetId}"...`
          );

          // Owner or authorized editor updating the deck
          const updatedFlashcards: Flashcard[] = stagedCards.map((sc, i) => {
            const existingCard = target?.cards.find((c) => c.id === sc.tempId);
            return {
              id: existingCard?.id || ("card-" + Date.now() + "-" + i + "-" + Math.random().toString(36).substring(2, 5)),
              deckId: target?.id || targetId,
              question: sc.question.trim(),
              answer: sc.answer.trim(),
              tags: sc.tags.length > 0 ? sc.tags : (parsedTags.length > 0 ? parsedTags : ["General"]),
              difficulty: sc.difficulty,
              createdAt: existingCard?.createdAt || Date.now(),
              lastReviewed: existingCard?.lastReviewed,
              reviewCount: existingCard?.reviewCount || 0,
              correctCount: existingCard?.correctCount || 0,
            };
          });

          const deckToUpdate: Deck = {
            id: target?.id || targetId,
            title: deckTitle.trim() || target?.title || "Untitled Study Set",
            description: deckDescription.trim() || target?.description || "",
            tags: parsedTags.length > 0 ? parsedTags : (target?.tags || ["General"]),
            cards: updatedFlashcards,
            createdAt: target?.createdAt || Date.now(),
            updatedAt: Date.now(),
            authorId: target?.authorId,
            authorName: target?.authorName,
            authorEmail: target?.authorEmail,
            isPublic: target?.isPublic,
            shareCode: target?.shareCode,
            shuffleQuestions,
            accessControl: {
              defaultRole,
              visibility: "unlisted",
              authorizedUsers,
            },
          };

          finalizedDeck = await updateDeck(deckToUpdate);
          console.log("✅ [handleSaveDeck: Update Success] Deck updated and synchronized in Firestore:", finalizedDeck);

          setSavedDeck(finalizedDeck);
          setStatusMessage({
            type: "success",
            text: `Deck "${finalizedDeck.title}" saved and synced to database with ${finalizedDeck.cards.length} cards!`,
          });
        }
      } else {
        console.log("✨ [handleSaveDeck: CREATE NEW DECK] Creating brand new study deck...");

        finalizedDeck = await createDeck({
          title: deckTitle.trim() || "Untitled Study Set",
          description: deckDescription.trim(),
          tags: parsedTags.length > 0 ? parsedTags : ["General"],
          shuffleQuestions,
          accessControl: {
            defaultRole,
            visibility: "unlisted",
            authorizedUsers,
          },
          cards: stagedCards.map((sc) => ({
            question: sc.question.trim(),
            answer: sc.answer.trim(),
            tags: sc.tags.length > 0 ? sc.tags : parsedTags,
            difficulty: sc.difficulty,
          })),
        });

        console.log("✅ [handleSaveDeck: Create Success] Created new deck with ID:", finalizedDeck.id);

        setSavedDeck(finalizedDeck);
        setStatusMessage({
          type: "success",
          text: `Deck "${finalizedDeck.title}" saved successfully with ${finalizedDeck.cards.length} cards! All changes are synced.`,
        });
      }

      if (autoShare) {
        setIsShareModalOpen(true);
      } else if (autoReview) {
        router.push(`/review?deckId=${finalizedDeck.id}`);
      }
    } catch (err: unknown) {
      console.error("❌ [handleSaveDeck Error]:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to save study deck. Please try again.";
      setStatusMessage({
        type: "error",
        text: errMsg,
      });
    } finally {
      console.groupEnd();
      setIsSaving(false);
    }
  };

  const difficultyLabels: Record<number, { label: string; color: string }> = {
    1: { label: "1 Easy", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
    2: { label: "2 Light", color: "bg-teal-500/20 text-teal-300 border-teal-500/40" },
    3: { label: "3 Medium", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
    4: { label: "4 Hard", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
    5: { label: "5 Mastery", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
            <Zap size={14} className="text-cyan-400" />
            Fast Creation &amp; Deck Studio
          </div>
          <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
            {targetDeckMode === "existing" ? "Edit & Customize Deck" : "Create & Organize Decks"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {targetDeckMode === "existing"
              ? "Modify flashcards, adjust questions/answers, set shuffle options, or configure access permissions."
              : "Paste raw text notes (numbered reviewers, bold answers, Q&As), retain sticky tags, and batch-set difficulties."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/decks")}
            className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:border-slate-500 transition cursor-pointer"
          >
            Browse My Decks
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-2xl border p-4 text-sm transition animate-in fade-in duration-200 ${
            statusMessage.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : statusMessage.type === "error"
              ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
              : "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* STEP 1: SET / DECK DETAILS & PERMISSIONS */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
              1
            </span>
            <h2 className="text-base font-semibold text-white">Study Set Details, Shuffle &amp; Permissions</h2>
          </div>

          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setTargetDeckMode("new");
                setSelectedDeckId("");
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition cursor-pointer ${
                targetDeckMode === "new"
                  ? "bg-cyan-500 text-slate-950 shadow-sm font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              New Deck Set
            </button>
            <button
              type="button"
              onClick={() => setTargetDeckMode("existing")}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition cursor-pointer ${
                targetDeckMode === "existing"
                  ? "bg-cyan-500 text-slate-950 shadow-sm font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Edit Existing Deck
            </button>
          </div>
        </div>

        {targetDeckMode === "existing" && (
          <div className="mb-4 space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Select Deck to Edit
              </label>
              <select
                value={selectedDeckId}
                onChange={(e) => handleExistingDeckChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
              >
                <option value="">-- Choose a deck to edit --</option>
                {existingDecks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.cards.length} cards)
                  </option>
                ))}
              </select>
            </div>

            {selectedDeckId && (
              <div>
                {activeDeckRole === "viewer" ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 animate-in fade-in duration-150">
                    <Lock size={18} className="shrink-0 mt-0.5 text-amber-400" />
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 font-bold text-sm text-amber-200">
                        <span>Read-Only Deck (Viewer Mode)</span>
                        <span className="rounded-md border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          Original Protected
                        </span>
                      </div>
                      <p className="text-amber-300/90 leading-relaxed">
                        This deck belongs to <strong>{activeDeckAuthorName}</strong>. You are viewing as <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[11px]">{getCurrentUserId()}</code>. You do not have permission to overwrite the database original.
                      </p>
                      <p className="font-semibold text-amber-400">
                        💡 Any edits you make will be saved cleanly as your own personal copy (fork) in your library.
                      </p>
                    </div>
                  </div>
                ) : activeDeckRole === "editor" ? (
                  <div className="flex items-center justify-between gap-2 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-3 text-xs text-indigo-200 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-indigo-400 shrink-0" />
                      <span>
                        <strong>Collaborative Editor:</strong> You are authorized to update this shared deck. Changes will sync with the database.
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-300/70 font-mono hidden sm:inline">
                      Creator: {activeDeckAuthorName}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-3 text-xs text-cyan-200 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <Crown size={16} className="text-cyan-400 shrink-0" />
                      <span>
                        <strong>Deck Owner:</strong> You have full administrative control over this deck and its permissions.
                      </span>
                    </div>
                    <span className="text-[10px] text-cyan-300/70 font-mono hidden sm:inline">
                      Creator: {activeDeckAuthorName}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Deck Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              placeholder="e.g. Computer Hardware &amp; Windows 10 OS"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-1 text-xs font-medium text-slate-300">
                <Tag size={13} className="text-cyan-400" />
                Persistent Set Tags (Sticky Across Cards)
              </label>
              <span className="text-[11px] text-cyan-400 font-medium">Auto-Attached</span>
            </div>
            <input
              type="text"
              value={setTags}
              onChange={(e) => setSetTags(e.target.value)}
              placeholder="Hardware, OS, Exam Prep (comma separated)"
              className="w-full rounded-2xl border border-cyan-500/40 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Description (Optional)
          </label>
          <input
            type="text"
            value={deckDescription}
            onChange={(e) => setDeckDescription(e.target.value)}
            placeholder="Reviewer notes for hardware components, BIOS, registry, and storage..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
          />
        </div>

        {/* Shuffle & Permissions Panel */}
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Shuffle Questions Checkbox */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer select-none bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 accent-cyan-500"
              />
              <span className="flex items-center gap-1.5">
                <Shuffle size={14} className="text-cyan-400" />
                Shuffle Questions for Each Take / Session
              </span>
            </label>

            {/* Permissions Panel Toggle */}
            <button
              type="button"
              onClick={() => setShowPermissionsPanel(!showPermissionsPanel)}
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
            >
              <Shield size={14} />
              <span>{showPermissionsPanel ? "Hide Permissions & Access" : "Configure Access & Edit Permissions"}</span>
            </button>
          </div>

          {showPermissionsPanel && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Default Access Role for Other Users
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDefaultRole("viewer")}
                    className={`rounded-2xl border p-3 text-left transition cursor-pointer ${
                      defaultRole === "viewer"
                        ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Lock size={14} className="text-cyan-400" />
                      🔒 Read-Only for Others (Recommended)
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 leading-tight">
                      Other users can study and preview this deck, but cannot overwrite the original.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDefaultRole("editor")}
                    className={`rounded-2xl border p-3 text-left transition cursor-pointer ${
                      defaultRole === "editor"
                        ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-200"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Unlock size={14} className="text-indigo-400" />
                      ✏️ Public Collaboration
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 leading-tight">
                      Anyone with the share link or code can edit and save changes to this deck.
                    </p>
                  </button>
                </div>
              </div>

              {/* Collaborators List */}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Users size={14} className="text-cyan-400" />
                    Authorized Editors &amp; Members
                  </span>
                  <span className="text-[10px] text-slate-500">Only authorized users can edit when Read-Only</span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCollabInput}
                    onChange={(e) => setNewCollabInput(e.target.value)}
                    placeholder="Enter email or username (e.g. classmate@gmail.com)"
                    className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                  />
                  <select
                    value={newCollabRole}
                    onChange={(e) => setNewCollabRole(e.target.value as DeckPermissionRole)}
                    className="rounded-2xl border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-slate-200"
                  >
                    <option value="editor">Editor (Can Edit)</option>
                    <option value="viewer">Viewer (Read-Only)</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCollaborator}
                    disabled={!newCollabInput.trim()}
                    className="rounded-2xl bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {authorizedUsers.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {authorizedUsers.map((collab) => (
                      <div
                        key={collab.identifier}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">{collab.identifier}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              collab.role === "editor"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {collab.role === "editor" ? "Editor" : "Viewer"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCollaborator(collab.identifier)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STEP 2: UNIVERSAL RAW TEXT & BOLD PASTE AREA */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
              2
            </span>
            <h2 className="text-base font-semibold text-white">Smart Paste (Reviewer / Bold / QA)</h2>
          </div>

          <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => setInputTab("bulk")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${inputTab === "bulk"
                  ? "bg-cyan-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
                }`}
            >
              <Sparkles size={14} />
              Universal Raw Text Parser
            </button>
            <button
              type="button"
              onClick={() => setInputTab("rapid")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${inputTab === "rapid"
                  ? "bg-cyan-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
                }`}
            >
              <Zap size={14} />
              Manual Single Q&amp;A
            </button>
          </div>
        </div>

        {/* TAB 1: UNIVERSAL SMART PARSER */}
        {inputTab === "bulk" && (
          <div className="space-y-4">
            {/* Mode Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-300">Format Strategy:</span>
                <button
                  type="button"
                  onClick={() => setParserMode("auto")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${parserMode === "auto"
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                      : "text-slate-300 hover:text-white border border-slate-800"
                    }`}
                >
                  🌟 Smart Auto-Detect
                </button>
                <button
                  type="button"
                  onClick={() => setParserMode("numbered")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${parserMode === "numbered"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                >
                  <span className="flex items-center gap-1">
                    <ListOrdered size={13} />
                    1. Question... Answer
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setParserMode("bold-answer")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${parserMode === "bold-answer"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                >
                  ✨ Bold = Answer
                </button>
                <button
                  type="button"
                  onClick={() => setParserMode("delimiter")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${parserMode === "delimiter"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                >
                  ⚡ Tab / Dash / Colon
                </button>
              </div>

              {/* Extra toggles */}
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={stripNumbers}
                    onChange={(e) => setStripNumbers(e.target.checked)}
                    className="rounded border-slate-700 accent-cyan-500"
                  />
                  <span>Clean Question Numbers (e.g. &quot;1.&quot;)</span>
                </label>
              </div>
            </div>

            {/* Smart Textarea with Rich Paste Listener */}
            <div className="relative">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                onPaste={handleSmartTextPaste}
                rows={9}
                placeholder={`Paste your questions & answers in any format!\n\nExample 1 (Numbered Reviewer):\n1. What is the common color for the USB 3.0 connector for Standard A receptacles and plugs?\nBlue\n2. What type of memory used in the Solid State Drive (SSD) as storage?\nFlash memory\n3. Where is BIOS stored originally in a standard PC?\nRead Only Memory (ROM)\n\nExample 2 (Bold answers):\n• The **mitochondria** is the powerhouse of the cell.`}
                className="w-full font-mono text-xs leading-relaxed rounded-2xl border border-slate-700 bg-slate-950 p-4 text-slate-100 placeholder:text-slate-600 outline-none focus:border-cyan-400"
              />
            </div>

            {/* Live Detected Preview Box */}
            {liveParsedPreview.length > 0 && (
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-cyan-400" />
                    <h4 className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
                      Live Detected Cards ({liveParsedPreview.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Review extracted Question &amp; Answer pairs below:
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 text-xs">
                  {liveParsedPreview.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start gap-1.5">
                          <span className="font-bold text-cyan-400 shrink-0">Q{idx + 1}:</span>
                          <span className="text-slate-100 leading-relaxed font-medium">{item.question}</span>
                        </div>
                      </div>
                      <div className="shrink-0 sm:max-w-xs sm:w-1/3 pl-3 sm:border-l border-slate-800/80">
                        <div className="flex items-start gap-1.5">
                          <span className="font-bold text-emerald-400 shrink-0">Ans:</span>
                          <span className="font-semibold text-emerald-300 leading-relaxed">{item.answer}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-xs text-slate-400">
                {liveParsedPreview.length > 0
                  ? `⚡ Ready to stage ${liveParsedPreview.length} flashcards.`
                  : "Paste your questions and answers above."}
              </div>

              <button
                type="button"
                disabled={!bulkText.trim() || liveParsedPreview.length === 0}
                onClick={handleApplyBulkCards}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition disabled:opacity-40 cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <Plus size={16} />
                Stage {liveParsedPreview.length > 0 ? liveParsedPreview.length : ""} Flashcards
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: MANUAL SINGLE Q&A */}
        {inputTab === "rapid" && (
          <form onSubmit={handleAddRapidCard} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-300">
                  <span>Question</span>
                  <span className="text-[11px] text-slate-500">Shortcut: Ctrl+Enter to stage</span>
                </label>
                <textarea
                  ref={questionInputRef}
                  value={rapidQuestion}
                  onChange={(e) => setRapidQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={4}
                  placeholder="Paste or type question here..."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-0 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-300">
                  <span>Answer</span>
                  <span className="text-[11px] text-emerald-400">
                    {setTags ? `Tags: ${setTags}` : "Set tags attached"}
                  </span>
                </label>
                <textarea
                  value={rapidAnswer}
                  onChange={(e) => setRapidAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={4}
                  placeholder="Paste or type answer here..."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-0 focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span>
                  Difficulty will be set in Step 3 once you finish pasting all cards.
                </span>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition cursor-pointer"
              >
                <Plus size={16} />
                Stage Card (Ctrl+Enter)
              </button>
            </div>
          </form>
        )}
      </div>

      {/* STEP 3: DEFERRED DIFFICULTY & BATCH POLISH */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
              3
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">
                Set Difficulties &amp; Polish ({stagedCards.length} Staged Cards)
              </h2>
              <p className="text-xs text-slate-400">
                Assign difficulty per card or use the 1-click batch setter below.
              </p>
            </div>
          </div>

          {/* Quick Batch Set Buttons */}
          {stagedCards.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 mr-1">Batch Set All:</span>
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleSetAllDifficulty(lvl)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${difficultyLabels[lvl].color}`}
                >
                  {difficultyLabels[lvl].label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* STAGED CARDS LIST */}
        <div className="mt-5 space-y-3">
          {stagedCards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center text-slate-400">
              <p className="text-sm">No cards staged yet.</p>
              <p className="mt-1 text-xs text-slate-500">
                Paste questions &amp; answers in Step 2 above. They will appear here ready for difficulty assignment!
              </p>
            </div>
          ) : (
            stagedCards.map((card, index) => {
              const isEditing = editingCardId === card.tempId;

              return (
                <div
                  key={card.tempId}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-700"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] text-slate-400">Question</label>
                        <input
                          type="text"
                          value={editQuestion}
                          onChange={(e) => setEditQuestion(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400">Answer</label>
                        <input
                          type="text"
                          value={editAnswer}
                          onChange={(e) => setEditAnswer(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingCardId(null)}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditCard(card.tempId)}
                          className="rounded-lg bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1 space-y-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                            {index + 1}
                          </span>
                          <h4 className="font-semibold text-slate-100 text-sm">
                            {card.question}
                          </h4>
                        </div>
                        <p className="text-xs text-emerald-300 font-medium pl-7">
                          <span className="text-slate-400 font-normal mr-1">Answer:</span>
                          {card.answer}
                        </p>
                        {card.tags && card.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pl-7 pt-1">
                            {card.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Difficulty Selector Pills */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleCardDifficultyChange(card.tempId, lvl)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${card.difficulty === lvl
                                  ? difficultyLabels[lvl].color
                                  : "text-slate-400 hover:text-white"
                                }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditCard(card)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-300 transition cursor-pointer"
                            aria-label="Edit card"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStagedCard(card.tempId)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition cursor-pointer"
                            aria-label="Delete card"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* FINAL STEP: SAVE & ACTION BAR */}
      <div className="sticky bottom-4 z-20 rounded-3xl border border-slate-700 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {stagedCards.length} Cards Ready in &quot;{deckTitle.trim() || "Untitled Study Set"}&quot;
            </p>
            <p className="text-xs text-slate-400">
              Difficulties &amp; tags assigned. Ready to save or share with peers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isSaving || stagedCards.length === 0}
            onClick={() => handleSaveDeck(false, true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            <Share2 size={15} />
            Save &amp; Share
          </button>

          <button
            type="button"
            disabled={isSaving || stagedCards.length === 0}
            onClick={() => handleSaveDeck(true, false)}
            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            <BookOpen size={15} />
            Save &amp; Review
          </button>

          <button
            type="button"
            disabled={isSaving || stagedCards.length === 0}
            onClick={() => handleSaveDeck(false, false)}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving
              ? "Saving..."
              : targetDeckMode === "existing" && activeDeckRole === "viewer"
              ? "Save as My Own Copy (Fork)"
              : targetDeckMode === "existing" && activeDeckRole === "editor"
              ? "Sync to Shared Deck"
              : targetDeckMode === "existing"
              ? "Save Changes to Deck"
              : "Save Deck"}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Share Modal Dialog */}
      {savedDeck && (
        <ShareDeckModal
          deck={savedDeck}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm">Loading studio…</p>
        </div>
      }
    >
      <CreateContent />
    </Suspense>
  );
}
