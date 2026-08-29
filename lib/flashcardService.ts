import { Flashcard, UserStats } from "@/types/flashcard";
import { db, isFirebaseConfigured } from "./firebase";
import { INITIAL_FLASHCARDS } from "./sampleData";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

function getUserFlashcardsCollection() {
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, "users", getCurrentUserId(), "flashcards");
}

function getUserStatsDoc() {
  if (!isFirebaseConfigured || !db) return null;
  return doc(db, "users", getCurrentUserId());
}

const DEFAULT_USER_ID = "local-user";
let firestoreIsAvailable: boolean | null = null;

async function canUseFirestore(): Promise<boolean> {
  if (!isFirebaseConfigured || !db) {
    firestoreIsAvailable = false;
    return false;
  }

  if (firestoreIsAvailable !== null) {
    return firestoreIsAvailable;
  }

  try {
    await getDoc(doc(db, "__health__", "status"));
    firestoreIsAvailable = true;
    return true;
  } catch (error) {
    console.warn(
      "Firestore is unavailable or not configured for this project. Using local storage mode.",
      error,
    );
    firestoreIsAvailable = false;
    return false;
  }
}

export function getCurrentUserId(): string {
  if (typeof window === "undefined") return DEFAULT_USER_ID;
  const saved = localStorage.getItem("review_flash_user_id");
  const userId = saved || DEFAULT_USER_ID;
  if (!saved) {
    localStorage.setItem("review_flash_user_id", userId);
  }
  return userId;
}

export function setCurrentUserId(uid: string): void {
  if (typeof window === "undefined") return;
  const safeUserId = uid || DEFAULT_USER_ID;
  localStorage.setItem("review_flash_user_id", safeUserId);
}

export function clearCurrentUserId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("review_flash_user_id");
  localStorage.setItem("review_flash_user_id", DEFAULT_USER_ID);
}

function getStorageKey(prefix: string): string {
  return `${prefix}_${getCurrentUserId()}`;
}

function getLocalCards(): Flashcard[] {
  if (typeof window === "undefined") return INITIAL_FLASHCARDS;
  try {
    const key = getStorageKey("review_flash_cards_v1");
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(INITIAL_FLASHCARDS));
      return INITIAL_FLASHCARDS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(key, JSON.stringify(INITIAL_FLASHCARDS));
      return INITIAL_FLASHCARDS;
    }
    return parsed;
  } catch {
    return INITIAL_FLASHCARDS;
  }
}

function saveLocalCards(cards: Flashcard[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey("review_flash_cards_v1"), JSON.stringify(cards));
}

function getLocalStats(): UserStats {
  if (typeof window === "undefined") {
    return { reviewed: 0, correct: 0, accuracy: 100, totalTests: 0, streakDays: 1 };
  }
  try {
    const key = getStorageKey("review_flash_stats_v1");
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial: UserStats = { reviewed: 16, correct: 14, accuracy: 88, totalTests: 3, streakDays: 2 };
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return { reviewed: 0, correct: 0, accuracy: 100, totalTests: 0, streakDays: 1 };
  }
}

function saveLocalStats(stats: UserStats) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey("review_flash_stats_v1"), JSON.stringify(stats));
}

export async function fetchFlashcards(): Promise<Flashcard[]> {
  if (!(await canUseFirestore())) {
    return getLocalCards();
  }

  try {
    const colRef = getUserFlashcardsCollection();
    if (!colRef) return getLocalCards();
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const cards = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          question: data.question || "",
          answer: data.answer || "",
          tags: data.tags || [],
          difficulty: data.difficulty ?? 3,
          createdAt: data.createdAt ?? Date.now(),
          lastReviewed: data.lastReviewed,
          reviewCount: data.reviewCount ?? 0,
          correctCount: data.correctCount ?? 0,
        } as Flashcard;
      });
      return cards;
    }
    for (const card of INITIAL_FLASHCARDS) {
      await setDoc(doc(colRef, card.id), card);
    }
    return INITIAL_FLASHCARDS;
  } catch (err) {
    console.warn("Firestore fetch failed, falling back to local storage:", err);
    firestoreIsAvailable = false;
    return getLocalCards();
  }
}

export async function addFlashcard(card: Omit<Flashcard, "id" | "createdAt">): Promise<Flashcard> {
  const newCard: Flashcard = {
    ...card,
    id: "card-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    createdAt: Date.now(),
    difficulty: card.difficulty || 3,
    tags: card.tags.length > 0 ? card.tags : ["General"],
    reviewCount: 0,
    correctCount: 0,
  };

  if (await canUseFirestore()) {
    try {
      const colRef = getUserFlashcardsCollection();
      if (colRef) {
        await setDoc(doc(colRef, newCard.id), newCard);
      }
    } catch (err) {
      console.warn("Firestore add failed, writing to local storage:", err);
      firestoreIsAvailable = false;
    }
  }

  const current = getLocalCards();
  const updated = [newCard, ...current];
  saveLocalCards(updated);
  return newCard;
}

export async function updateFlashcard(card: Flashcard): Promise<void> {
  if (await canUseFirestore()) {
    try {
      const colRef = getUserFlashcardsCollection();
      if (colRef) {
        await updateDoc(doc(colRef, card.id), { ...card });
      }
    } catch (err) {
      console.warn("Firestore update failed, writing to local storage:", err);
      firestoreIsAvailable = false;
    }
  }

  const current = getLocalCards();
  const updated = current.map((c) => (c.id === card.id ? card : c));
  saveLocalCards(updated);
}

export async function deleteFlashcard(id: string): Promise<void> {
  if (await canUseFirestore()) {
    try {
      const colRef = getUserFlashcardsCollection();
      if (colRef) {
        await deleteDoc(doc(colRef, id));
      }
    } catch (err) {
      console.warn("Firestore delete failed:", err);
      firestoreIsAvailable = false;
    }
  }

  const current = getLocalCards();
  const updated = current.filter((c) => c.id !== id);
  saveLocalCards(updated);
}

export async function recordReviewResult(cardId: string, remembered: boolean): Promise<void> {
  const cards = getLocalCards();
  const target = cards.find((c) => c.id === cardId);
  if (!target) return;

  // Spaced repetition difficulty adjustment:
  // If remembered -> lower difficulty slightly (min 1)
  // If need practice -> increase difficulty (max 5)
  let newDifficulty = target.difficulty;
  if (remembered) {
    newDifficulty = Math.max(1, target.difficulty - 1);
  } else {
    newDifficulty = Math.min(5, target.difficulty + 1);
  }

  const updatedCard: Flashcard = {
    ...target,
    difficulty: newDifficulty,
    lastReviewed: Date.now(),
    reviewCount: (target.reviewCount || 0) + 1,
    correctCount: (target.correctCount || 0) + (remembered ? 1 : 0),
  };

  await updateFlashcard(updatedCard);

  // Update stats
  const stats = getLocalStats();
  const reviewed = stats.reviewed + 1;
  const correct = stats.correct + (remembered ? 1 : 0);
  const accuracy = Math.round((correct / (reviewed || 1)) * 100);

  const updatedStats: UserStats = {
    ...stats,
    reviewed,
    correct,
    accuracy,
  };

  saveLocalStats(updatedStats);

  if (await canUseFirestore()) {
    try {
      const statsDoc = getUserStatsDoc();
      if (statsDoc) {
        await setDoc(statsDoc, { progress: updatedStats }, { merge: true });
      }
    } catch (e) {
      console.warn("Firestore user stats update failed", e);
      firestoreIsAvailable = false;
    }
  }
}

export async function recordTestSession(correctAnswers: number, totalQuestions: number): Promise<UserStats> {
  const stats = getLocalStats();
  const reviewed = stats.reviewed + totalQuestions;
  const correct = stats.correct + correctAnswers;
  const accuracy = Math.round((correct / (reviewed || 1)) * 100);
  const totalTests = (stats.totalTests || 0) + 1;

  const updatedStats: UserStats = {
    ...stats,
    reviewed,
    correct,
    accuracy,
    totalTests,
  };

  saveLocalStats(updatedStats);

  if (await canUseFirestore()) {
    try {
      const statsDoc = getUserStatsDoc();
      if (statsDoc) {
        await setDoc(statsDoc, { progress: updatedStats }, { merge: true });
      }
    } catch (e) {
      console.warn("Firestore user stats update failed", e);
      firestoreIsAvailable = false;
    }
  }

  return updatedStats;
}

export async function fetchUserStats(): Promise<UserStats> {
  if (!(await canUseFirestore())) {
    return getLocalStats();
  }

  try {
    const statsDoc = getUserStatsDoc();
    if (!statsDoc) return getLocalStats();
    const snap = await getDoc(statsDoc);
    if (snap.exists() && snap.data().progress) {
      return snap.data().progress as UserStats;
    }
  } catch (e) {
    console.warn("Firestore get stats error, using local", e);
    firestoreIsAvailable = false;
  }
  return getLocalStats();
}

export async function resetAllFlashcards(): Promise<Flashcard[]> {
  if (await canUseFirestore()) {
    try {
      const colRef = getUserFlashcardsCollection();
      if (colRef) {
        const current = await fetchFlashcards();
        for (const c of current) {
          await deleteDoc(doc(colRef, c.id));
        }
        for (const c of INITIAL_FLASHCARDS) {
          await setDoc(doc(colRef, c.id), c);
        }
      }
    } catch (e) {
      console.warn("Reset in firestore failed", e);
      firestoreIsAvailable = false;
    }
  }
  saveLocalCards(INITIAL_FLASHCARDS);
  return INITIAL_FLASHCARDS;
}
