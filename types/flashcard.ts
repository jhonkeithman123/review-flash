export interface Flashcard {
  id: string;
  deckId?: string;
  question: string;
  answer: string;
  tags: string[];
  difficulty: number; // 1 = easy, 2 = light, 3 = medium, 4 = hard, 5 = very hard
  createdAt: number;
  lastReviewed?: number;
  reviewCount?: number;
  correctCount?: number;
}

export type DeckPermissionRole = "viewer" | "editor";
export type UserDeckRole = "owner" | "editor" | "viewer";

export interface AuthorizedCollaborator {
  identifier: string; // email or userId or username
  role: DeckPermissionRole;
}

export interface DeckAccessControl {
  defaultRole: DeckPermissionRole; // "viewer" (Read-only for others) or "editor" (Publicly editable)
  visibility?: "public" | "unlisted" | "private";
  authorizedUsers?: AuthorizedCollaborator[];
}

export interface Deck {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  cards: Flashcard[];
  createdAt: number;
  updatedAt: number;
  isPublic?: boolean;
  shareCode?: string;
  authorId?: string;
  authorName?: string;
  authorEmail?: string;
  shuffleQuestions?: boolean; // Shuffle question order for each take/session
  accessControl?: DeckAccessControl; // Permission settings
}

export interface UserStats {
  reviewed: number;
  correct: number;
  accuracy: number;
  totalTests: number;
  streakDays?: number;
}

export interface QuizQuestionItem {
  card: Flashcard;
  options: string[];
  correctIndex: number;
}

export interface TestSessionStats {
  total: number;
  correct: number;
  timeSpentSeconds: number;
  scorePercentage: number;
}

export interface SharedDeckPayload {
  version: number;
  deck: Omit<Deck, "id"> & { id?: string };
  sharedAt: number;
}
