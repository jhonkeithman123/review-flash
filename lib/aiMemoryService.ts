import { db, isFirebaseConfigured } from "./firebase";
import { getCurrentUserId, sanitizeForFirestore } from "./flashcardService";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export interface StoredAiMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  createdAt: number;
  cardContext?: {
    question?: string;
    answer?: string;
    deckTitle?: string;
  };
}

export interface StoredAiConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  userId: string;
}

export interface UserLearnedFacts {
  facts: string[];
  updatedAt: number;
}

/**
 * Get the Firestore collection reference for user's AI conversations.
 */
function getConversationsCollection() {
  if (!isFirebaseConfigured || !db) return null;
  const uid = getCurrentUserId();
  return collection(db, "users", uid, "ai_conversations");
}

/**
 * Get the Firestore collection reference for messages within a conversation.
 */
function getMessagesCollection(conversationId: string) {
  if (!isFirebaseConfigured || !db) return null;
  const uid = getCurrentUserId();
  return collection(db, "users", uid, "ai_conversations", conversationId, "messages");
}

/**
 * Get the Firestore doc reference for learned facts memory.
 */
function getFactsDocRef() {
  if (!isFirebaseConfigured || !db) return null;
  const uid = getCurrentUserId();
  return doc(db, "users", uid, "ai_memory", "facts");
}

/**
 * Save an AI chat message to Firestore under the user's conversation.
 */
export async function saveAiMessageToFirebase(
  conversationId: string,
  message: StoredAiMessage,
  conversationTitle?: string
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  try {
    const uid = getCurrentUserId();
    const convRef = doc(db, "users", uid, "ai_conversations", conversationId);
    const msgRef = doc(db, "users", uid, "ai_conversations", conversationId, "messages", message.id);

    // Save message doc
    await setDoc(
      msgRef,
      sanitizeForFirestore({
        ...message,
        createdAt: message.createdAt || Date.now(),
      })
    );

    // Update or create parent conversation metadata
    const convDoc = await getDoc(convRef);
    if (!convDoc.exists()) {
      await setDoc(
        convRef,
        sanitizeForFirestore({
          id: conversationId,
          title: conversationTitle || message.content.slice(0, 40) + "...",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 1,
          userId: uid,
        })
      );
    } else {
      const existing = convDoc.data();
      await updateDoc(convRef, {
        updatedAt: Date.now(),
        messageCount: (existing.messageCount || 0) + 1,
        ...(conversationTitle ? { title: conversationTitle } : {}),
      });
    }
  } catch (error) {
    console.warn("Failed to persist AI message to Firebase Firestore:", error);
  }
}

/**
 * Load all messages for a conversation from Firebase Firestore.
 */
export async function loadAiMessagesFromFirebase(
  conversationId: string,
  maxLimit: number = 50
): Promise<StoredAiMessage[]> {
  if (!isFirebaseConfigured || !db) return [];

  try {
    const colRef = getMessagesCollection(conversationId);
    if (!colRef) return [];

    const q = query(colRef, orderBy("createdAt", "asc"), limit(maxLimit));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp || new Date(data.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        createdAt: data.createdAt || Date.now(),
        cardContext: data.cardContext,
      } as StoredAiMessage;
    });
  } catch (error) {
    console.warn("Failed to load AI messages from Firebase Firestore:", error);
    return [];
  }
}

/**
 * List all saved AI conversation sessions for current user from Firestore.
 */
export async function loadUserAiConversationsFromFirebase(): Promise<StoredAiConversation[]> {
  if (!isFirebaseConfigured || !db) return [];

  try {
    const colRef = getConversationsCollection();
    if (!colRef) return [];

    const q = query(colRef, orderBy("updatedAt", "desc"), limit(20));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || "Study Session",
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        messageCount: data.messageCount || 0,
        userId: data.userId || getCurrentUserId(),
      } as StoredAiConversation;
    });
  } catch (error) {
    console.warn("Failed to load AI conversations from Firebase Firestore:", error);
    return [];
  }
}

/**
 * Save a learned study fact / user preference into Firestore AI memory.
 */
export async function saveLearnedFactToFirebase(fact: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  try {
    const ref = getFactsDocRef();
    if (!ref) return;

    const snap = await getDoc(ref);
    let facts: string[] = [];

    if (snap.exists()) {
      facts = snap.data().facts || [];
    }

    const cleanFact = fact.trim();
    if (cleanFact && !facts.includes(cleanFact)) {
      facts.push(cleanFact);
      await setDoc(ref, sanitizeForFirestore({
        facts: facts.slice(-50), // keep latest 50 facts
        updatedAt: Date.now(),
      }));
    }
  } catch (error) {
    console.warn("Failed to save learned fact to Firebase:", error);
  }
}

/**
 * Retrieve all learned study facts stored in Firebase Firestore.
 */
export async function loadLearnedFactsFromFirebase(): Promise<string[]> {
  if (!isFirebaseConfigured || !db) return [];

  try {
    const ref = getFactsDocRef();
    if (!ref) return [];

    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().facts || [];
    }
    return [];
  } catch (error) {
    console.warn("Failed to load learned facts from Firebase:", error);
    return [];
  }
}

/**
 * Delete an entire AI conversation from Firebase Firestore.
 */
export async function deleteAiConversationFromFirebase(conversationId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  try {
    const uid = getCurrentUserId();
    const convRef = doc(db, "users", uid, "ai_conversations", conversationId);
    await deleteDoc(convRef);
  } catch (error) {
    console.warn("Failed to delete conversation from Firebase:", error);
  }
}
