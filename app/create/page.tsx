"use client";

import { useEffect, useState } from "react";
import { Flashcard } from "@/types/flashcard";
import {
  addFlashcard,
  fetchFlashcards,
  deleteFlashcard,
  resetAllFlashcards,
} from "@/lib/flashcardService";

const emptyForm = {
  question: "",
  answer: "",
  tags: "",
};

export default function CreatePage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [message, setMessage] = useState("Ready for your next deck update.");

  useEffect(() => {
    async function loadCards() {
      const items = await fetchFlashcards();
      setCards(items);
    }
    loadCards();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      setMessage("Question and answer are required.");
      return;
    }

    const newCard = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      difficulty: 3, // Default difficulty
    };

    const created = await addFlashcard(newCard);
    setCards((current) => [created, ...current]);

    // Retain tags if in batch mode, otherwise clear everything
    if (isBatchMode) {
      setForm((prev) => ({ ...prev, question: "", answer: "" }));
    } else {
      setForm(emptyForm);
    }
    setMessage("Flashcard added.");
  };

  const handleDelete = async (id: string) => {
    await deleteFlashcard(id);
    setCards((current) => current.filter((card) => card.id !== id));
    setMessage("Flashcard deleted.");
  };

  const handleReset = async () => {
    const seeded = await resetAllFlashcards();
    setCards(seeded);
    setMessage("Deck reset to the starter sample set.");
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">
          Create
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">
          Build your study deck
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-6"
        >
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Question
            </label>
            <textarea
              value={form.question}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, question: e.target.value }))
              }
              rows={4}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-500"
              placeholder="Write the question here..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Answer</label>
            <textarea
              value={form.answer}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, answer: e.target.value }))
              }
              rows={4}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-500"
              placeholder="Write the answer here..."
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Tags</label>
              <input
                value={form.tags}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tags: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-slate-100 outline-none focus:border-cyan-500"
                placeholder="React, JS, HTML"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, difficulty: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-slate-100 outline-none focus:border-cyan-500"
              >
                <option value="1">1 - Easy</option>
                <option value="2">2 - Light</option>
                <option value="3">3 - Medium</option>
                <option value="4">4 - Hard</option>
                <option value="5">5 - Very Hard</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
            >
              Add flashcard
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-slate-700 bg-slate-950 px-5 py-3 font-medium text-slate-200 transition hover:border-slate-500"
            >
              Reset sample deck
            </button>
          </div>

          <p className="text-sm text-slate-300">{message}</p>
        </form>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">
            Current deck
          </h2>
          <div className="space-y-3">
            {cards.length === 0 ? (
              <p className="text-slate-400">No cards yet.</p>
            ) : (
              cards.slice(0, 8).map((card) => (
                <div
                  key={card.id}
                  className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-100">
                      {card.question}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDelete(card.id)}
                      className="text-xs text-rose-300 hover:text-rose-200"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                    {card.tags.map((tag) => (
                      <span
                        key={`${card.id}-${tag}`}
                        className="rounded-full border border-slate-700 px-2 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
