// Hardcoded starter flashcards have been moved to Firebase Firestore (collection: `public_decks` and `shared_decks`).
// Run `bun run seed:firebase` to re-seed or manage starter decks in Firestore.

import { Deck, Flashcard } from "@/types/flashcard";

export const INITIAL_FLASHCARDS: Flashcard[] = [];
export const INITIAL_DECKS: Deck[] = [];
