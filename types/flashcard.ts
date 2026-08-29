export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  difficulty: number; // 1 = easy, 5 = hard
  createdAt: number;
  lastReviewed?: number;
  reviewCount?: number;
  correctCount?: number;
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
