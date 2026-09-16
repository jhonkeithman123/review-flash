import {
  ActiveTestState,
  Deck,
  DeckScoreBreakdown,
  DeckScoreSummary,
  Flashcard,
  SharedDeckPayload,
  TestRecord,
  UserDeckRole,
  UserStats,
} from "@/types/flashcard";
import { auth, db, isFirebaseConfigured } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

function getUserDecksCollection() {
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, "users", getCurrentUserId(), "decks");
}

function getUserStatsDoc() {
  if (!isFirebaseConfigured || !db) return null;
  return doc(db, "users", getCurrentUserId());
}

function getUserActiveTestsCollection() {
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, "users", getCurrentUserId(), "active_tests");
}

function getUserTestRecordsCollection() {
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, "users", getCurrentUserId(), "test_records");
}

function getUserDeckScoresCollection() {
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, "users", getCurrentUserId(), "deck_scores");
}

function getSharedDecksCollection() {
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, "shared_decks");
}

function getPublicDecksCollection() {
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, "public_decks");
}

const DEFAULT_USER_ID = "local-user";

export async function isFirestoreAvailable(): Promise<boolean> {
  return Boolean(isFirebaseConfigured && db);
}

// Backwards-compatible alias
export const canUseFirestore = isFirestoreAvailable;

export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean as T;
}

let inMemoryUserId: string | null = null;
let inMemoryUserEmail: string | null = null;
let inMemoryUserName: string | null = null;

export function getCurrentUserId(): string {
  if (inMemoryUserId) return inMemoryUserId;
  if (auth?.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  if (typeof window !== "undefined") {
    let saved = localStorage.getItem("review_flash_user_id");
    if (!saved || saved === "local-user") {
      saved = "usr-" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("review_flash_user_id", saved);
    }
    return saved;
  }
  return DEFAULT_USER_ID;
}

export function getCurrentUserEmail(): string | undefined {
  if (inMemoryUserEmail) return inMemoryUserEmail;
  if (auth?.currentUser?.email) {
    return auth.currentUser.email;
  }
  if (typeof window !== "undefined") {
    return localStorage.getItem("review_flash_user_email") || undefined;
  }
  return undefined;
}

export function getCurrentUserName(): string | undefined {
  if (inMemoryUserName) return inMemoryUserName;
  if (auth?.currentUser?.displayName) {
    return auth.currentUser.displayName;
  }
  if (typeof window !== "undefined") {
    return localStorage.getItem("review_flash_user_name") || "ReviewFlash Learner";
  }
  return "ReviewFlash Learner";
}

export function setCurrentUserId(uid: string): void {
  inMemoryUserId = uid || null;
  if (typeof window !== "undefined") {
    if (uid) {
      localStorage.setItem("review_flash_user_id", uid);
    } else {
      localStorage.removeItem("review_flash_user_id");
    }
  }
}

export function setCurrentUserEmail(email: string): void {
  inMemoryUserEmail = email || null;
  if (typeof window !== "undefined") {
    if (email) {
      localStorage.setItem("review_flash_user_email", email);
    } else {
      localStorage.removeItem("review_flash_user_email");
    }
  }
}

export function setCurrentUserName(name: string): void {
  inMemoryUserName = name || null;
  if (typeof window !== "undefined") {
    if (name) {
      localStorage.setItem("review_flash_user_name", name);
    } else {
      localStorage.removeItem("review_flash_user_name");
    }
  }
}

export function clearCurrentUserId(): void {
  inMemoryUserId = null;
  inMemoryUserEmail = null;
  inMemoryUserName = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("review_flash_user_id");
    localStorage.removeItem("review_flash_user_email");
    localStorage.removeItem("review_flash_user_name");
  }
}

function getStorageKey(prefix: string): string {
  return `${prefix}_${getCurrentUserId()}`;
}

// ----------------------------------------------------
// LOCAL STORAGE DECK & CARD HELPERS
// ----------------------------------------------------

export function getLocalDecks(): Deck[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getStorageKey("review_flash_decks_v2");
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveLocalDecks(decks: Deck[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey("review_flash_decks_v2"), JSON.stringify(decks));
}

function getLocalStats(): UserStats {
  if (typeof window === "undefined") {
    return { reviewed: 0, correct: 0, accuracy: 100, totalTests: 0, streakDays: 1 };
  }
  try {
    const key = getStorageKey("review_flash_stats_v1");
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial: UserStats = { reviewed: 0, correct: 0, accuracy: 100, totalTests: 0, streakDays: 1 };
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

// ----------------------------------------------------
// DECK OPERATIONS (FIREBASE FIRESTORE)
// ----------------------------------------------------

export async function fetchDecks(): Promise<Deck[]> {
  let userDecks: Deck[] = [];

  if (await canUseFirestore()) {
    try {
      const colRef = getUserDecksCollection();
      if (colRef) {
        const snapshot = await getDocs(colRef);
        if (!snapshot.empty) {
          userDecks = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data.title || "Untitled Deck",
              description: data.description || "",
              tags: data.tags || [],
              cards: data.cards || [],
              createdAt: data.createdAt ?? Date.now(),
              updatedAt: data.updatedAt ?? Date.now(),
              isPublic: data.isPublic || false,
              shareCode: data.shareCode || "",
              authorId: data.authorId,
              authorName: data.authorName,
              authorEmail: data.authorEmail,
              accessControl: data.accessControl,
              shuffleQuestions: data.shuffleQuestions,
            } as Deck;
          });
        }
      }
    } catch (err) {
      console.warn("Firestore fetchDecks failed, falling back to local storage:", err);
      userDecks = getLocalDecks();
    }
  } else {
    userDecks = getLocalDecks();
  }

  // 🔄 REAL-TIME CLOUD SYNCHRONIZATION FOR SHARED DECKS:
  // For any deck in library with a shareCode, fetch and merge the latest version from shared_decks
  if (await canUseFirestore()) {
    try {
      const sharedCol = getSharedDecksCollection();
      if (sharedCol) {
        const synced = await Promise.all(
          userDecks.map(async (deck) => {
            if (!deck.shareCode) return deck;
            try {
              const snap = await getDoc(doc(sharedCol, deck.shareCode));
              if (snap.exists()) {
                const cloudData = snap.data();
                return {
                  ...deck,
                  title: cloudData.title || deck.title,
                  description: cloudData.description || deck.description,
                  tags: cloudData.tags || deck.tags,
                  cards: cloudData.cards || deck.cards,
                  updatedAt: cloudData.updatedAt || deck.updatedAt,
                  accessControl: cloudData.accessControl || deck.accessControl,
                  authorId: cloudData.authorId || deck.authorId,
                  authorName: cloudData.authorName || deck.authorName,
                  authorEmail: cloudData.authorEmail || deck.authorEmail,
                  shuffleQuestions: cloudData.shuffleQuestions ?? deck.shuffleQuestions,
                } as Deck;
              }
            } catch {
              // ignore
            }
            return deck;
          })
        );
        userDecks = synced;
        saveLocalDecks(userDecks);
      }
    } catch (e) {
      console.warn("Shared decks live sync failed:", e);
    }
  }

  return userDecks;
}

export async function fetchPublicStarterDecks(): Promise<Deck[]> {
  if (await canUseFirestore()) {
    try {
      const pubRef = getPublicDecksCollection();
      if (pubRef) {
        const snap = await getDocs(pubRef);
        if (!snap.empty) {
          return snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Deck[];
        }
      }
    } catch (e) {
      console.warn("Error fetching public decks from Firestore", e);
    }
  }
  return [];
}

export async function fetchDeckById(id: string): Promise<Deck | null> {
  const decks = await fetchDecks();
  let found = decks.find((d) => d.id === id);

  // If found and has a shareCode, ensure we have the freshest version from shared_decks
  if (found && found.shareCode && (await canUseFirestore())) {
    try {
      const sharedCol = getSharedDecksCollection();
      if (sharedCol) {
        const snap = await getDoc(doc(sharedCol, found.shareCode));
        if (snap.exists()) {
          const cloudData = snap.data();
          found = {
            ...found,
            ...cloudData,
            id: found.id,
          } as Deck;
        }
      }
    } catch (e) {
      console.warn("fetchDeckById sync error:", e);
    }
  }
  if (found) return found;

  // Try shared decks in Firestore
  if (await canUseFirestore()) {
    try {
      const sharedCol = getSharedDecksCollection();
      if (sharedCol) {
        const snap = await getDoc(doc(sharedCol, id));
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as Deck;
        }

        const q = query(sharedCol, where("id", "==", id));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const docSnap = qSnap.docs[0];
          return { id: docSnap.id, ...docSnap.data() } as Deck;
        }
      }
    } catch (e) {
      console.warn("Firestore shared deck fetch error:", e);
    }
  }

  // Try public decks in Firestore
  if (await canUseFirestore()) {
    try {
      const pubRef = getPublicDecksCollection();
      if (pubRef) {
        const snap = await getDoc(doc(pubRef, id));
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as Deck;
        }
      }
    } catch (e) {
      console.warn("Firestore public deck fetch error:", e);
    }
  }

  return null;
}

export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getUserDeckRole(
  deck: Deck,
  userId: string = getCurrentUserId(),
  userEmail: string | undefined = getCurrentUserEmail(),
  userName: string | undefined = getCurrentUserName()
): UserDeckRole {
  const currentUid = userId ? userId.trim().toLowerCase() : "";
  const currentMail = userEmail ? userEmail.trim().toLowerCase() : "";
  const currentName = userName ? userName.trim().toLowerCase() : "";

  // 1. Is user the creator / owner?
  if (deck.authorId && currentUid && deck.authorId.trim().toLowerCase() === currentUid) {
    if (typeof window !== "undefined") {
      console.log(`👑 [getUserDeckRole: OWNER] User ID "${currentUid}" matches deck authorId "${deck.authorId}" on "${deck.title}"`);
    }
    return "owner";
  }
  if (deck.authorEmail && currentMail && deck.authorEmail.trim().toLowerCase() === currentMail) {
    if (typeof window !== "undefined") {
      console.log(`👑 [getUserDeckRole: OWNER] User Email "${currentMail}" matches deck authorEmail "${deck.authorEmail}" on "${deck.title}"`);
    }
    return "owner";
  }

  // 2. Check authorized users list for explicit role assignment (takes precedence over defaultRole)
  if (deck.accessControl?.authorizedUsers && deck.accessControl.authorizedUsers.length > 0) {
    const matched = deck.accessControl.authorizedUsers.find((u) => {
      const ident = u.identifier.trim().toLowerCase();
      return (
        (currentUid && ident === currentUid) ||
        (currentMail && ident === currentMail) ||
        (currentName && ident === currentName)
      );
    });
    if (matched) {
      if (typeof window !== "undefined") {
        console.log(`🎯 [getUserDeckRole: ${matched.role.toUpperCase()}] User matched in authorizedUsers (${matched.identifier}) on "${deck.title}"`);
      }
      return matched.role; // "editor" or "viewer"
    }
  }

  // 3. Check default role in accessControl
  if (deck.accessControl?.defaultRole === "editor") {
    if (typeof window !== "undefined") {
      console.log(`✏️ [getUserDeckRole: EDITOR] defaultRole is "editor" on "${deck.title}"`);
    }
    return "editor";
  }

  // 4. If deck has no authorId and no accessControl and no shareCode, user is local owner
  if (!deck.authorId && !deck.accessControl && !deck.shareCode) {
    if (typeof window !== "undefined") {
      console.log(`👑 [getUserDeckRole: OWNER] Standalone local unshared deck on "${deck.title}"`);
    }
    return "owner";
  }

  // Default is viewer
  if (typeof window !== "undefined") {
    console.log(`🔒 [getUserDeckRole: VIEWER] Read-only fallback. Deck author: "${deck.authorId || deck.authorEmail || 'Unknown'}", current user: "${currentUid || currentMail}" on "${deck.title}"`);
  }
  return "viewer";
}

export function canUserEditDeck(
  deck: Deck,
  userId: string = getCurrentUserId(),
  userEmail: string | undefined = getCurrentUserEmail()
): boolean {
  const role = getUserDeckRole(deck, userId, userEmail);
  return role === "owner" || role === "editor";
}

export async function createDeck(data: {
  title: string;
  description?: string;
  tags?: string[];
  cards?: Omit<Flashcard, "id" | "createdAt">[];
  shuffleQuestions?: boolean;
  setDivision?: Deck["setDivision"];
  accessControl?: Deck["accessControl"];
}): Promise<Deck> {
  const deckId = "deck-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  const now = Date.now();
  const currentUid = getCurrentUserId();
  const currentEmail = getCurrentUserEmail();
  const currentName = getCurrentUserName();

  const formattedCards: Flashcard[] = (data.cards || []).map((c, index) => ({
    id: "card-" + now + "-" + index + "-" + Math.random().toString(36).substring(2, 6),
    deckId,
    question: c.question.trim(),
    answer: c.answer.trim(),
    tags: (c.tags && c.tags.length > 0) ? c.tags : (data.tags && data.tags.length > 0 ? data.tags : ["General"]),
    difficulty: c.difficulty || 3,
    createdAt: now,
    reviewCount: 0,
    correctCount: 0,
  }));

  const newDeck: Deck = {
    id: deckId,
    title: data.title.trim() || "Untitled Study Set",
    description: data.description?.trim() || "",
    tags: data.tags && data.tags.length > 0 ? data.tags : ["General"],
    cards: formattedCards,
    createdAt: now,
    updatedAt: now,
    authorId: currentUid,
    authorEmail: currentEmail,
    authorName: currentName,
    shuffleQuestions: data.shuffleQuestions ?? false,
    setDivision: data.setDivision,
    accessControl: data.accessControl || {
      defaultRole: "viewer", // Read-only for others by default
      visibility: "unlisted",
      authorizedUsers: [],
    },
  };

  if (await canUseFirestore()) {
    try {
      const colRef = getUserDecksCollection();
      if (colRef) {
        await setDoc(doc(colRef, newDeck.id), sanitizeForFirestore(newDeck));
      }
    } catch (err) {
      console.warn("Firestore createDeck failed, writing to local storage:", err);
    }
  }

  const current = getLocalDecks();
  const updated = [newDeck, ...current];
  saveLocalDecks(updated);
  return newDeck;
}

export async function updateDeck(deck: Deck): Promise<Deck> {
  const currentUid = getCurrentUserId();
  const currentEmail = getCurrentUserEmail();

  // 1. Fetch the authentic existing deck to verify true ownership
  let targetDeck: Deck | null = null;
  if (await canUseFirestore()) {
    targetDeck = await fetchDeckById(deck.id);
  }
  if (!targetDeck) {
    targetDeck = getLocalDecks().find((d) => d.id === deck.id) || null;
  }

  // Strict permission check: Check permissions against the authentic targetDeck (or deck)
  const deckToCheck = targetDeck || deck;
  const role = getUserDeckRole(deckToCheck, currentUid, currentEmail);
  if (role === "viewer") {
    throw new Error(
      `Permission Denied: You have Read-Only viewer access to "${deckToCheck.title}". You cannot overwrite the original deck in the database. Please click "Save as My Own Copy" instead.`
    );
  }

  const updatedDeck: Deck = {
    ...deck,
    authorId: targetDeck?.authorId || deck.authorId || currentUid,
    authorEmail: targetDeck?.authorEmail || deck.authorEmail || currentEmail,
    authorName: targetDeck?.authorName || deck.authorName,
    updatedAt: Date.now(),
    cards: deck.cards.map((c) => ({
      ...c,
      deckId: deck.id,
    })),
    accessControl:
      targetDeck && targetDeck.authorId && targetDeck.authorId !== currentUid
        ? targetDeck.accessControl // Collaborators cannot change access control rules
        : deck.accessControl || {
            defaultRole: "viewer",
            visibility: "unlisted",
            authorizedUsers: [],
          },
  };

  if (await canUseFirestore()) {
    try {
      // 1. If owner, update owner's personal decks collection
      if (role === "owner") {
        const colRef = getUserDecksCollection();
        if (colRef) {
          await setDoc(doc(colRef, updatedDeck.id), sanitizeForFirestore(updatedDeck), { merge: true });
        }
      }

      // 2. Synchronize to Firestore shared_decks collection if deck is shared
      if (updatedDeck.shareCode) {
        const sharedCol = getSharedDecksCollection();
        if (sharedCol) {
          const payload = sanitizeForFirestore({
            ...updatedDeck,
            sharedAt: Date.now(),
          });
          await setDoc(doc(sharedCol, updatedDeck.shareCode), payload, { merge: true });
          await setDoc(doc(sharedCol, updatedDeck.id), payload, { merge: true });
          const rawCode = updatedDeck.shareCode.replace(/^RF-/, "");
          if (rawCode !== updatedDeck.shareCode) {
            await setDoc(doc(sharedCol, rawCode), payload, { merge: true });
          }
        }
      }
    } catch (err) {
      console.warn("Firestore updateDeck failed, writing to local storage:", err);
    }
  }

  const current = getLocalDecks();
  const exists = current.some((d) => d.id === updatedDeck.id);
  const updated = exists
    ? current.map((d) => (d.id === updatedDeck.id ? updatedDeck : d))
    : [updatedDeck, ...current];
  saveLocalDecks(updated);
  return updatedDeck;
}

export async function deleteDeck(id: string): Promise<void> {
  const currentUid = getCurrentUserId();
  const currentEmail = getCurrentUserEmail();
  const existing = await fetchDeckById(id);

  // If viewer, only delete from local cache without deleting database document
  if (existing && getUserDeckRole(existing, currentUid, currentEmail) === "viewer") {
    const current = getLocalDecks();
    const updated = current.filter((d) => d.id !== id);
    saveLocalDecks(updated);
    return;
  }

  if (await canUseFirestore()) {
    try {
      const colRef = getUserDecksCollection();
      if (colRef) {
        await deleteDoc(doc(colRef, id));
      }
      if (existing?.shareCode) {
        const sharedCol = getSharedDecksCollection();
        if (sharedCol) {
          await deleteDoc(doc(sharedCol, existing.shareCode));
          await deleteDoc(doc(sharedCol, existing.id));
          await deleteDoc(doc(sharedCol, existing.shareCode.replace(/^RF-/, "")));
        }
      }
    } catch (err) {
      console.warn("Firestore deleteDeck failed:", err);
    }
  }

  const current = getLocalDecks();
  const updated = current.filter((d) => d.id !== id);
  saveLocalDecks(updated);
}

// ----------------------------------------------------
// SHARING & IMPORT / EXPORT OPERATIONS (FIREBASE FIRESTORE)
// ----------------------------------------------------

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "RF-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function encodeDeckToken(deck: Deck): string {
  try {
    const payload: SharedDeckPayload = {
      version: 1,
      deck: {
        title: deck.title,
        description: deck.description,
        tags: deck.tags,
        cards: deck.cards.map((c) => ({
          id: c.id,
          question: c.question,
          answer: c.answer,
          tags: c.tags,
          difficulty: c.difficulty || 3,
          createdAt: c.createdAt,
        })),
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
        authorName: deck.authorName || "ReviewFlash Learner",
      },
      sharedAt: Date.now(),
    };
    const json = JSON.stringify(payload);
    return typeof window !== "undefined"
      ? btoa(encodeURIComponent(json))
      : Buffer.from(encodeURIComponent(json)).toString("base64");
  } catch (e) {
    console.error("Failed to encode deck token", e);
    return "";
  }
}

export function decodeDeckToken(token: string): Deck | null {
  try {
    const decodedUri = typeof window !== "undefined"
      ? atob(token)
      : Buffer.from(token, "base64").toString("utf-8");
    const json = decodeURIComponent(decodedUri);
    const parsed = JSON.parse(json) as SharedDeckPayload;
    if (!parsed || !parsed.deck || !parsed.deck.title) return null;

    const cards: Flashcard[] = (parsed.deck.cards || []).map((c, i) => ({
      id: c.id || "card-" + Date.now() + "-" + i,
      question: c.question,
      answer: c.answer,
      tags: c.tags || parsed.deck.tags || [],
      difficulty: c.difficulty || 3,
      createdAt: c.createdAt || Date.now(),
      reviewCount: 0,
      correctCount: 0,
    }));

    return {
      id: "deck-shared-" + Date.now(),
      title: parsed.deck.title,
      description: parsed.deck.description,
      tags: parsed.deck.tags || [],
      cards,
      createdAt: parsed.deck.createdAt || Date.now(),
      updatedAt: parsed.deck.updatedAt || Date.now(),
      authorName: parsed.deck.authorName,
      isPublic: true,
    };
  } catch (e) {
    console.error("Failed to decode deck token", e);
    return null;
  }
}

export async function shareDeck(deckId: string): Promise<{ shareCode: string; shareToken: string; shareUrl: string }> {
  const deck = await fetchDeckById(deckId);
  if (!deck) {
    throw new Error("Deck not found");
  }

  const currentUid = getCurrentUserId();
  const currentEmail = getCurrentUserEmail();
  const role = getUserDeckRole(deck, currentUid, currentEmail);

  // If the deck is already shared, any viewer can retrieve the existing share code and URL
  if (deck.shareCode) {
    const shareToken = encodeDeckToken(deck);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/share?code=${encodeURIComponent(deck.shareCode)}&token=${encodeURIComponent(shareToken)}`;
    return { shareCode: deck.shareCode, shareToken, shareUrl };
  }

  // If the deck is not yet shared and the user only has Read-Only viewer access:
  if (role === "viewer") {
    throw new Error(
      `Permission Denied: You have Read-Only viewer access to "${deck.title}". Only the deck owner can publish or generate a new share code.`
    );
  }

  const shareCode = generateShareCode();
  const shareToken = encodeDeckToken(deck);

  const updatedDeck: Deck = {
    ...deck,
    isPublic: true,
    shareCode,
    updatedAt: Date.now(),
  };

  await updateDeck(updatedDeck);

  // Save to Firestore shared_decks collection
  if (await canUseFirestore()) {
    try {
      const sharedCol = getSharedDecksCollection();
      if (sharedCol) {
        const payload = sanitizeForFirestore({
          ...updatedDeck,
          sharedAt: Date.now(),
          authorId: getCurrentUserId(),
        });
        // Primary doc by shareCode (e.g. RF-AB12CD)
        await setDoc(doc(sharedCol, shareCode), payload, { merge: true });

        // Also index by deckId for instant direct lookups
        await setDoc(doc(sharedCol, updatedDeck.id), payload, { merge: true });

        // Also alias without "RF-" so lookups with or without prefix work instantly
        const rawCode = shareCode.replace(/^RF-/, "");
        if (rawCode !== shareCode) {
          await setDoc(doc(sharedCol, rawCode), payload, { merge: true });
        }
      }
    } catch (err) {
      console.warn("Saving shared deck to Firestore shared_decks collection failed:", err);
    }
  }

  // Cache in localStorage for hybrid / instant lookup
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("review_flash_shared_" + shareCode, JSON.stringify(updatedDeck));
      localStorage.setItem("review_flash_shared_" + shareCode.replace(/^RF-/, ""), JSON.stringify(updatedDeck));
    } catch (e) {
      console.warn("LocalStorage save shared failed", e);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/share?code=${encodeURIComponent(shareCode)}&token=${encodeURIComponent(shareToken)}`;

  return { shareCode, shareToken, shareUrl };
}

export async function fetchSharedDeck(codeOrToken: string): Promise<Deck | null> {
  let queryParam = codeOrToken.trim();
  if (!queryParam) return null;

  // 1. If user passed a full URL, parse code and token from it
  if (queryParam.includes("token=") || queryParam.includes("code=")) {
    try {
      const search = queryParam.includes("?") ? queryParam.split("?")[1] : queryParam;
      const params = new URLSearchParams(search);
      const token = params.get("token");
      const code = params.get("code");
      if (token) {
        const decoded = decodeDeckToken(token);
        if (decoded) return decoded;
      }
      if (code) {
        queryParam = code.trim();
      }
    } catch {
      // ignore
    }
  }

  // 2. Try decoding as direct encoded token (if length is long)
  if (queryParam.length > 40) {
    const fromToken = decodeDeckToken(queryParam);
    if (fromToken) return fromToken;
  }

  // Generate all case and prefix permutations
  const upper = queryParam.toUpperCase();
  const normalizedWithRF = upper.startsWith("RF-") ? upper : "RF-" + upper;
  const normalizedWithoutRF = upper.replace(/^RF-/, "");
  const candidateCodes = Array.from(new Set([queryParam, upper, normalizedWithRF, normalizedWithoutRF]));

  // 3. Try Firestore shared_decks collection
  if (await canUseFirestore()) {
    try {
      const sharedCol = getSharedDecksCollection();
      if (sharedCol) {
        // Direct doc get
        for (const code of candidateCodes) {
          const docSnap = await getDoc(doc(sharedCol, code));
          if (docSnap.exists()) {
            const data = docSnap.data();
            return {
              id: data.id || docSnap.id,
              title: data.title || "Shared Deck",
              description: data.description || "",
              tags: data.tags || [],
              cards: data.cards || [],
              createdAt: data.createdAt ?? Date.now(),
              updatedAt: data.updatedAt ?? Date.now(),
              shareCode: data.shareCode || code,
              authorName: data.authorName,
              authorId: data.authorId,
              authorEmail: data.authorEmail,
              accessControl: data.accessControl,
              shuffleQuestions: data.shuffleQuestions,
            } as Deck;
          }
        }

        // Query by shareCode field
        for (const code of candidateCodes) {
          const q = query(sharedCol, where("shareCode", "==", code));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const docSnap = qSnap.docs[0];
            const data = docSnap.data();
            return {
              id: data.id || docSnap.id,
              title: data.title || "Shared Deck",
              description: data.description || "",
              tags: data.tags || [],
              cards: data.cards || [],
              createdAt: data.createdAt ?? Date.now(),
              updatedAt: data.updatedAt ?? Date.now(),
              shareCode: data.shareCode || code,
              authorName: data.authorName,
              authorId: data.authorId,
              authorEmail: data.authorEmail,
              accessControl: data.accessControl,
              shuffleQuestions: data.shuffleQuestions,
            } as Deck;
          }
        }
      }

      // Check public_decks in Firestore
      const pubCol = getPublicDecksCollection();
      if (pubCol) {
        for (const code of candidateCodes) {
          const pubSnap = await getDoc(doc(pubCol, code));
          if (pubSnap.exists()) {
            const data = pubSnap.data();
            return {
              id: pubSnap.id,
              ...data,
            } as Deck;
          }
        }
      }
    } catch (e) {
      console.warn("Firestore fetchSharedDeck error:", e);
    }
  }

  // 4. Fallback: Search localStorage cached shared decks
  if (typeof window !== "undefined") {
    for (const code of candidateCodes) {
      const cached = localStorage.getItem("review_flash_shared_" + code);
      if (cached) {
        try {
          return JSON.parse(cached) as Deck;
        } catch {
          // ignore
        }
      }
    }
  }

  // 5. Fallback: Search local user decks
  const localDecks = getLocalDecks();
  const matched = localDecks.find((d) =>
    candidateCodes.some((c) => d.shareCode?.toUpperCase() === c || d.id === c)
  );
  if (matched) return matched;

  return null;
}

export async function importDeck(sourceDeck: Deck, newTitle?: string): Promise<Deck> {
  // Preserve author details, id, shareCode, and accessControl from the shared source deck
  const linkedDeck: Deck = {
    ...sourceDeck,
    id: sourceDeck.id,
    title: newTitle || sourceDeck.title,
    authorId: sourceDeck.authorId,
    authorEmail: sourceDeck.authorEmail,
    authorName: sourceDeck.authorName,
    shareCode: sourceDeck.shareCode,
    shuffleQuestions: sourceDeck.shuffleQuestions ?? false,
    accessControl: sourceDeck.accessControl || {
      defaultRole: "viewer",
      visibility: "unlisted",
      authorizedUsers: [],
    },
    cards: sourceDeck.cards.map((c) => ({
      ...c,
      deckId: sourceDeck.id,
    })),
  };

  if (await canUseFirestore()) {
    try {
      const colRef = getUserDecksCollection();
      if (colRef) {
        await setDoc(doc(colRef, linkedDeck.id), sanitizeForFirestore(linkedDeck), { merge: true });
      }
    } catch (err) {
      console.warn("Firestore importDeck failed, saving locally:", err);
    }
  }

  const current = getLocalDecks();
  const exists = current.some((d) => d.id === linkedDeck.id);
  const updated = exists
    ? current.map((d) => (d.id === linkedDeck.id ? linkedDeck : d))
    : [linkedDeck, ...current];
  saveLocalDecks(updated);

  return linkedDeck;
}

export async function forkDeck(sourceDeck: Deck, newTitle?: string): Promise<Deck> {
  const currentUid = getCurrentUserId();
  const currentEmail = getCurrentUserEmail();
  const currentName = getCurrentUserName() || "ReviewFlash Learner";
  const newDeckId = `deck-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const forkedDeck: Deck = {
    ...sourceDeck,
    id: newDeckId,
    title: newTitle || `${sourceDeck.title} (Fork)`,
    authorId: currentUid,
    authorEmail: currentEmail,
    authorName: currentName,
    shareCode: undefined, // Cleared: Fresh personal fork
    createdAt: Date.now(),
    updatedAt: Date.now(),
    shuffleQuestions: sourceDeck.shuffleQuestions ?? false,
    accessControl: {
      defaultRole: "viewer",
      visibility: "unlisted",
      authorizedUsers: [],
    },
    cards: (sourceDeck.cards || []).map((c) => ({
      ...c,
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      deckId: newDeckId,
      createdAt: Date.now(),
    })),
  };

  if (await canUseFirestore()) {
    try {
      const colRef = getUserDecksCollection();
      if (colRef) {
        await setDoc(doc(colRef, forkedDeck.id), sanitizeForFirestore(forkedDeck));
      }
    } catch (err) {
      console.warn("Firestore forkDeck failed, saving locally:", err);
    }
  }

  const current = getLocalDecks();
  const updated = [forkedDeck, ...current.filter((d) => d.id !== forkedDeck.id)];
  saveLocalDecks(updated);

  return forkedDeck;
}

// ----------------------------------------------------
// FLASHCARD INTERACTION
// ----------------------------------------------------

export async function fetchFlashcards(deckId?: string): Promise<Flashcard[]> {
  const decks = await fetchDecks();
  if (deckId && deckId !== "all") {
    const targetDeck = decks.find((d) => d.id === deckId);
    return targetDeck ? targetDeck.cards : [];
  }

  // Combine cards from all user decks
  return decks.flatMap((d) => d.cards);
}

export async function addFlashcard(
  card: Omit<Flashcard, "id" | "createdAt">,
  targetDeckId?: string,
): Promise<Flashcard> {
  const decks = await fetchDecks();
  let deck = targetDeckId ? decks.find((d) => d.id === targetDeckId) : decks[0];

  if (!deck) {
    deck = await createDeck({
      title: "My Flashcards",
      description: "Personal study collection",
      tags: card.tags.length > 0 ? card.tags : ["General"],
    });
  }

  const newCard: Flashcard = {
    ...card,
    id: "card-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    deckId: deck.id,
    createdAt: Date.now(),
    difficulty: card.difficulty || 3,
    tags: card.tags.length > 0 ? card.tags : deck.tags,
    reviewCount: 0,
    correctCount: 0,
  };

  const updatedDeck: Deck = {
    ...deck,
    cards: [newCard, ...deck.cards],
  };

  await updateDeck(updatedDeck);
  return newCard;
}

export async function updateFlashcard(card: Flashcard): Promise<void> {
  const decks = await fetchDecks();
  for (const deck of decks) {
    const cardIndex = deck.cards.findIndex((c) => c.id === card.id);
    if (cardIndex !== -1) {
      const updatedCards = [...deck.cards];
      updatedCards[cardIndex] = { ...card, deckId: deck.id };
      await updateDeck({
        ...deck,
        cards: updatedCards,
      });
      break;
    }
  }
}

export async function deleteFlashcard(id: string): Promise<void> {
  const decks = await fetchDecks();
  for (const deck of decks) {
    const exists = deck.cards.some((c) => c.id === id);
    if (exists) {
      await updateDeck({
        ...deck,
        cards: deck.cards.filter((c) => c.id !== id),
      });
      break;
    }
  }
}

// ----------------------------------------------------
// WRITE STREAM THROTTLING & DEBOUNCING QUEUES
// (Prevents Firestore code=resource-exhausted write stream exhaustion)
// ----------------------------------------------------

let statsDebounceTimer: NodeJS.Timeout | null = null;
let pendingStatsToSync: UserStats | null = null;

export function syncStatsToCloud(updatedStats: UserStats): void {
  pendingStatsToSync = updatedStats;
  if (statsDebounceTimer) {
    clearTimeout(statsDebounceTimer);
  }
  statsDebounceTimer = setTimeout(async () => {
    statsDebounceTimer = null;
    const statsToSave = pendingStatsToSync;
    if (!statsToSave) return;
    if (await isFirestoreAvailable()) {
      try {
        const statsDoc = getUserStatsDoc();
        if (statsDoc) {
          await setDoc(statsDoc, sanitizeForFirestore({ progress: statsToSave }), { merge: true });
        }
      } catch (e: any) {
        if (e?.code === "resource-exhausted" || e?.message?.includes("Write stream")) {
          console.warn("Firestore write stream throttled stats update; local stats remain authoritative.");
        } else {
          console.warn("Firestore user stats update failed", e);
        }
      }
    }
  }, 1500);
}

export const scheduleStatsSyncToFirestore = syncStatsToCloud;

const deckDebounceTimers = new Map<string, NodeJS.Timeout>();
const pendingDecksToSync = new Map<string, Deck>();

export function syncDeckToCloud(deck: Deck): void {
  pendingDecksToSync.set(deck.id, deck);
  if (deckDebounceTimers.has(deck.id)) {
    clearTimeout(deckDebounceTimers.get(deck.id)!);
  }

  const timer = setTimeout(async () => {
    deckDebounceTimers.delete(deck.id);
    const deckToSave = pendingDecksToSync.get(deck.id);
    if (!deckToSave) return;
    pendingDecksToSync.delete(deck.id);

    if (await isFirestoreAvailable()) {
      try {
        const colRef = getUserDecksCollection();
        if (colRef) {
          await setDoc(doc(colRef, deckToSave.id), sanitizeForFirestore(deckToSave), { merge: true });
        }
      } catch (e: any) {
        if (e?.code === "resource-exhausted" || e?.message?.includes("Write stream")) {
          console.warn("Firestore write stream throttled deck update; local deck is preserved.");
        } else {
          console.warn("Firestore deck background update failed", e);
        }
      }
    }
  }, 1500);

  deckDebounceTimers.set(deck.id, timer);
}

export const scheduleDeckSyncToFirestore = syncDeckToCloud;

export async function recordReviewResult(cardId: string, remembered: boolean): Promise<void> {
  const allDecks = getLocalDecks();
  let targetCard: Flashcard | null = null;
  let targetDeck: Deck | null = null;

  for (const deck of allDecks) {
    const found = deck.cards.find((c) => c.id === cardId);
    if (found) {
      targetCard = found;
      targetDeck = deck;
      break;
    }
  }

  if (!targetCard || !targetDeck) return;

  let newDifficulty = targetCard.difficulty;
  if (remembered) {
    newDifficulty = Math.max(1, targetCard.difficulty - 1);
  } else {
    newDifficulty = Math.min(5, targetCard.difficulty + 1);
  }

  const updatedCard: Flashcard = {
    ...targetCard,
    difficulty: newDifficulty,
    lastReviewed: Date.now(),
    reviewCount: (targetCard.reviewCount || 0) + 1,
    correctCount: (targetCard.correctCount || 0) + (remembered ? 1 : 0),
  };

  // 1. Synchronously update local cache and memory (instant 0ms UI)
  const updatedCards = targetDeck.cards.map((c) => (c.id === cardId ? updatedCard : c));
  const updatedDeck = { ...targetDeck, cards: updatedCards };
  const updatedAllDecks = allDecks.map((d) => (d.id === targetDeck!.id ? updatedDeck : d));
  saveLocalDecks(updatedAllDecks);

  // 2. Synchronously update local user stats
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

  // 3. Debounce cloud writes to protect write stream capacity
  scheduleStatsSyncToFirestore(updatedStats);
  scheduleDeckSyncToFirestore(updatedDeck);
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
  scheduleStatsSyncToFirestore(updatedStats);

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
  }
  return getLocalStats();
}

export async function resetAllFlashcards(): Promise<Flashcard[]> {
  if (await canUseFirestore()) {
    try {
      const colRef = getUserDecksCollection();
      if (colRef) {
        const current = await fetchDecks();
        for (const d of current) {
          await deleteDoc(doc(colRef, d.id));
        }
      }
    } catch (e) {
      console.warn("Reset in firestore failed", e);
    }
  }
  saveLocalDecks([]);
  return [];
}

// ----------------------------------------------------
// ACTIVE TEST STATE PERSISTENCE (IN-PROGRESS TESTS)
// ----------------------------------------------------

const activeTestSaveTimers = new Map<string, NodeJS.Timeout>();
const pendingActiveTestStates = new Map<string, ActiveTestState>();

export async function saveActiveTestState(state: ActiveTestState): Promise<void> {
  // 1. Instant local storage write (synchronous, 0ms latency, always persisted)
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getStorageKey(`rf_active_test_${state.deckId}`), JSON.stringify(state));
    } catch (e) {
      console.warn("Local storage save active test error:", e);
    }
  }

  // 2. Coalesced & debounced Firestore sync (prevents write stream queue overflow)
  pendingActiveTestStates.set(state.deckId, state);
  if (activeTestSaveTimers.has(state.deckId)) {
    clearTimeout(activeTestSaveTimers.get(state.deckId)!);
  }

  const timer = setTimeout(async () => {
    activeTestSaveTimers.delete(state.deckId);
    const stateToSave = pendingActiveTestStates.get(state.deckId);
    if (!stateToSave) return;
    pendingActiveTestStates.delete(state.deckId);

    if (await canUseFirestore()) {
      try {
        const colRef = getUserActiveTestsCollection();
        if (colRef) {
          await setDoc(doc(colRef, stateToSave.deckId), sanitizeForFirestore(stateToSave));
        }
      } catch (e: any) {
        if (e?.code === "resource-exhausted" || e?.message?.includes("Write stream")) {
          console.warn("Firestore write stream busy; active test state preserved in local storage.");
        } else {
          console.warn("Firestore save active test error:", e);
        }
      }
    }
  }, 1500);

  activeTestSaveTimers.set(state.deckId, timer);
}

export async function fetchActiveTestState(deckId: string): Promise<ActiveTestState | null> {
  // 1. Try local storage first
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(getStorageKey(`rf_active_test_${deckId}`));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return parsed as ActiveTestState;
        }
      }
    } catch {
      // fallback
    }
  }

  // 2. Try Firestore
  if (await canUseFirestore()) {
    try {
      const colRef = getUserActiveTestsCollection();
      if (colRef) {
        const snap = await getDoc(doc(colRef, deckId));
        if (snap.exists()) {
          return snap.data() as ActiveTestState;
        }
      }
    } catch (e) {
      console.warn("Firestore fetch active test error:", e);
    }
  }

  return null;
}

export async function clearActiveTestState(deckId: string): Promise<void> {
  if (activeTestSaveTimers.has(deckId)) {
    clearTimeout(activeTestSaveTimers.get(deckId)!);
    activeTestSaveTimers.delete(deckId);
  }
  pendingActiveTestStates.delete(deckId);

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(getStorageKey(`rf_active_test_${deckId}`));
    } catch {}
  }

  if (await canUseFirestore()) {
    try {
      const colRef = getUserActiveTestsCollection();
      if (colRef) {
        await deleteDoc(doc(colRef, deckId));
      }
    } catch (e) {
      console.warn("Firestore clear active test error:", e);
    }
  }
}

// ----------------------------------------------------
// TEST SCORES & TEST HISTORY PERSISTENCE
// ----------------------------------------------------

export function getLocalTestRecords(): TestRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey("review_flash_test_records_v1"));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalTestRecords(records: TestRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey("review_flash_test_records_v1"), JSON.stringify(records));
  } catch {}
}

export function getLocalDeckScores(): Record<string, DeckScoreSummary> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getStorageKey("review_flash_deck_scores_v1"));
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveLocalDeckScores(scores: Record<string, DeckScoreSummary>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey("review_flash_deck_scores_v1"), JSON.stringify(scores));
  } catch {}
}

export async function saveTestRecord(record: TestRecord): Promise<void> {
  // 1. Save to local records
  const existingLocal = getLocalTestRecords();
  const updatedRecords = [record, ...existingLocal.filter((r) => r.id !== record.id)].slice(0, 100);
  saveLocalTestRecords(updatedRecords);

  // 2. Update deck score summaries locally
  const currentScores = getLocalDeckScores();
  const updateSummaryFor = (dId: string, scorePct: number) => {
    const prev = currentScores[dId] || { latestScore: 0, bestScore: 0, lastTakenAt: 0, totalTakes: 0 };
    currentScores[dId] = {
      latestScore: scorePct,
      bestScore: Math.max(prev.bestScore, scorePct),
      lastTakenAt: record.completedAt,
      totalTakes: prev.totalTakes + 1,
    };
  };

  updateSummaryFor(record.deckId, record.scorePercentage);
  if (record.deckBreakdowns && record.deckBreakdowns.length > 0) {
    for (const b of record.deckBreakdowns) {
      updateSummaryFor(b.deckId, b.accuracy);
    }
  }
  saveLocalDeckScores(currentScores);

  // 3. Persist to Firestore
  if (await canUseFirestore()) {
    try {
      const recordsCol = getUserTestRecordsCollection();
      if (recordsCol) {
        await setDoc(doc(recordsCol, record.id), sanitizeForFirestore(record));
      }
      const scoresCol = getUserDeckScoresCollection();
      if (scoresCol) {
        await setDoc(doc(scoresCol, record.deckId), sanitizeForFirestore(currentScores[record.deckId]), { merge: true });
        if (record.deckBreakdowns && record.deckBreakdowns.length > 0) {
          for (const b of record.deckBreakdowns) {
            await setDoc(doc(scoresCol, b.deckId), sanitizeForFirestore(currentScores[b.deckId]), { merge: true });
          }
        }
      }
    } catch (e) {
      console.warn("Firestore saveTestRecord error:", e);
    }
  }
}

export async function fetchTestHistory(deckId?: string): Promise<TestRecord[]> {
  let records: TestRecord[] = [];

  if (await canUseFirestore()) {
    try {
      const colRef = getUserTestRecordsCollection();
      if (colRef) {
        const snap = await getDocs(query(colRef, orderBy("completedAt", "desc")));
        if (!snap.empty) {
          records = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TestRecord));
        }
      }
    } catch (e) {
      console.warn("Firestore fetchTestHistory error, fallback to local:", e);
      records = getLocalTestRecords();
    }
  } else {
    records = getLocalTestRecords();
  }

  if (deckId && deckId !== "all") {
    return records.filter(
      (r) => r.deckId === deckId || (r.deckBreakdowns && r.deckBreakdowns.some((b) => b.deckId === deckId))
    );
  }
  return records;
}

export async function fetchDeckScoreSummaries(): Promise<Record<string, DeckScoreSummary>> {
  if (await canUseFirestore()) {
    try {
      const colRef = getUserDeckScoresCollection();
      if (colRef) {
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const map: Record<string, DeckScoreSummary> = {};
          snap.docs.forEach((d) => {
            map[d.id] = d.data() as DeckScoreSummary;
          });
          saveLocalDeckScores(map);
          return map;
        }
      }
    } catch (e) {
      console.warn("Firestore fetchDeckScoreSummaries fallback to local:", e);
    }
  }
  return getLocalDeckScores();
}
