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

export type SetNamingStyle = "letters" | "numbers";
export type SetDivisionMode = "count" | "size";

export interface DeckSetDivisionConfig {
  enabled: boolean;
  mode: SetDivisionMode; // "count" = divide into N sets | "size" = max items per set
  value: number; // e.g. 2 for 2 sets, OR 30 for 30 cards per set
  namingStyle: SetNamingStyle; // "letters" (Set A, B, C) or "numbers" (Set 1, 2, 3)
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
  setDivision?: DeckSetDivisionConfig; // Predefined Set Division Settings
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

export interface DeckScoreBreakdown {
  deckId: string;
  deckTitle: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface TestRecord {
  id: string;
  deckId: string;
  deckTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  completedAt: number;
  adaptivePeak: number;
  deckBreakdowns?: DeckScoreBreakdown[];
  missedCardIds?: string[];
}

export interface ActiveTestState {
  deckId: string;
  questionIndex: number;
  questions: QuizQuestionItem[];
  userAnswers: Record<number, string>;
  flaggedIndices: number[];
  timeLeft: number;
  isUntimed: boolean;
  isShuffleActive: boolean;
  adaptiveStreak: number;
  adaptivePeak: number;
  questionCountPreset: string;
  lastUpdated: number;
}

export interface DeckScoreSummary {
  latestScore: number;
  bestScore: number;
  lastTakenAt: number;
  totalTakes: number;
}

export interface SharedDeckPayload {
  version: number;
  deck: Omit<Deck, "id"> & { id?: string };
  sharedAt: number;
}

export interface DeckCardSet {
  setIndex: number; // 0-based
  setNumber: number; // 1-based (e.g. 1, 2)
  setName: string; // e.g. "Set A" or "Set 1"
  label: string; // e.g. "Set A (Cards 1–25)"
  startIndex: number; // 0-based inclusive
  endIndex: number; // 0-based exclusive
  cardCount: number;
  cards: Flashcard[];
}

