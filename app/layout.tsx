import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { InteractiveTour } from "@/components/interactive-tour";
import { AiChatDrawer } from "@/components/ai-chat-drawer";
import { WhatsNewModal } from "@/components/whats-new-modal";
import { StudyMusicPlayer } from "@/components/study-music-player";
import { AdblockDetector } from "@/components/adblock-detector";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#090d16",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://review-flash.vercel.app"),
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
      <body className="bg-slate-950 text-slate-100 antialiased min-h-dvh flex flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8 pb-safe">{children}</main>
        <Footer />
        <InteractiveTour />
        <WhatsNewModal />
        <AiChatDrawer />
        <StudyMusicPlayer />
        <AdblockDetector />
      </body>
    </html>
  );
}

