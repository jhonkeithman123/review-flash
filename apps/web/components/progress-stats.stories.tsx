import type { Meta, StoryObj } from "@storybook/react";
import { ProgressStats } from "./progress-stats";
import { UserStats } from "@/types/flashcard";

const sampleStats: UserStats = {
  reviewed: 142,
  correct: 128,
  accuracy: 90,
  totalTests: 18,
  streakDays: 7,
};

const meta: Meta<typeof ProgressStats> = {
  title: "Components/ProgressStats",
  component: ProgressStats,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ProgressStats>;

export const Default: Story = {
  args: {
    stats: sampleStats,
  },
};

export const HighAccuracy: Story = {
  args: {
    stats: {
      reviewed: 500,
      correct: 495,
      accuracy: 99,
      totalTests: 50,
      streakDays: 30,
    },
  },
};
