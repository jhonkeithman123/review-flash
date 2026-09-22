"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle, FileText, Scale, Shield } from "lucide-react";

export default function TermsOfServicePage() {
  const lastUpdated = "September 1, 2026";

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16 pt-4 text-slate-200">
      {/* Back Button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
            <Scale size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs text-slate-400">
              Last Updated: {lastUpdated} · ReviewFlash Study Platform
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mt-4">
          Welcome to ReviewFlash! By accessing or using our website, study tools, flashcard creator, quiz engine, and ambient study player, you agree to be bound by these Terms of Service.
        </p>
      </div>

      {/* Section 1: Use of Service */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-4">
        <h2 className="text-white font-bold text-lg">1. Permitted Use</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          ReviewFlash is provided as an educational and study assistance platform for students, educators, and lifelong learners. You agree to use the service for lawful personal, educational, or organizational study purposes.
        </p>
      </div>

      {/* Section 2: User Content & Ownership */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-4">
        <h2 className="text-white font-bold text-lg">2. User Content &amp; Flashcards</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          You retain full ownership of all flashcard study decks, notes, and custom questions you create. By sharing a deck via a public share link, you grant other learners permission to import and review your study material. You agree not to upload harmful, abusive, or copyrighted material without permission.
        </p>
      </div>

      {/* Section 3: Third-Party Integrations */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-4">
        <h2 className="text-white font-bold text-lg">3. Third-Party Integrations</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Our service utilizes Google Firebase for cloud authentication/storage, Meta Facebook Login for social authentication, and YouTube Iframe API for background study music. Use of these third-party features is subject to their respective terms and policies.
        </p>
      </div>

      {/* Section 4: Disclaimer & Limitation of Liability */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-4">
        <h2 className="text-white font-bold text-lg">4. Disclaimer of Warranties</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          ReviewFlash is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind. While we strive for 100% uptime and data reliability, we are not responsible for any study interruptions or lost progress.
        </p>
      </div>

      {/* Footer Links */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <Link href="/help" className="hover:text-white transition">Guide &amp; FAQs</Link>
        </div>
        <div>
          © {new Date().getFullYear()} ReviewFlash. All rights reserved.
        </div>
      </div>
    </div>
  );
}
