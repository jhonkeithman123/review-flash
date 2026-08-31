import "./globals.css";
import { Navbar } from "@/components/navbar";
import { InteractiveTour } from "@/components/interactive-tour";
import { AiChatDrawer } from "@/components/ai-chat-drawer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReviewFlash",
  description: "Flashcard review and quiz app built with Next.js",
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
        <AiChatDrawer />
      </body>
    </html>
  );
}
