import type { Meta, StoryObj } from "@storybook/react";
import { FlashcardCard } from "./flashcard-card";
import { Flashcard } from "@/types/flashcard";

const sampleCard: Flashcard = {
  id: "card-1",
  question: "What is the main benefit of using a Monorepo architecture?",
  answer:
    "Monorepos allow shared code, unified dependency management, cross-package atomic commits, and centralized CI/CD tooling.",
  tags: ["Architecture", "DevOps", "Next.js"],
  deckId: "default",
  difficulty: 3,
  createdAt: Date.now(),
  lastReviewed: Date.now(),
  reviewCount: 5,
  correctCount: 4,
};

const meta: Meta<typeof FlashcardCard> = {
  title: "Components/FlashcardCard",
  component: FlashcardCard,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof FlashcardCard>;

export const DefaultQuestion: Story = {
  args: {
    card: sampleCard,
    showAnswer: false,
    hasMoreInDeck: true,
  },
};

export const FlippedAnswer: Story = {
  args: {
    card: sampleCard,
    showAnswer: true,
    hasMoreInDeck: true,
  },
};

export const LongContent: Story = {
  args: {
    card: {
      ...sampleCard,
      question:
        "Can you explain in detail how Cypress and Storybook work together in the Pressbook framework to ensure both component isolation and accessibility conformance?",
      answer:
        "Storybook renders the component states in an isolated iframe. Cypress automatically crawls the story index, navigates to each story, checks for zero runtime crashes and console errors, and executes axe-core accessibility checks against the rendered DOM tree.",
    },
    showAnswer: false,
    hasMoreInDeck: false,
  },
};
