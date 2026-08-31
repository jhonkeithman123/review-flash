import "./globals.css";
import { Navbar } from "@/components/navbar";
import { InteractiveTour } from "@/components/interactive-tour";
import { AiChatDrawer } from "@/components/ai-chat-drawer";
import { WhatsNewModal } from "@/components/whats-new-modal";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "ReviewFlash — Active Recall Flashcards & AI Tutor",
  description: "Master anything faster with AI-powered flashcards, spaced repetition, and DITroy study tutor.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "ReviewFlash — AI Active Recall Flashcards",
    description: "Create, review, test, and collaborate on study flashcard decks.",
    images: [{ url: "/splash.png", width: 1024, height: 1024, alt: "ReviewFlash" }],
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <InteractiveTour />
        <WhatsNewModal />
        <AiChatDrawer />
      </body>
    </html>

  );
}
