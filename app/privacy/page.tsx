"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  FileText,
  Lock,
  Mail,
  Shield,
  Trash2,
  UserCheck,
} from "lucide-react";

export default function PrivacyPolicyPage() {
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
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-400">
              Last Updated: {lastUpdated} · ReviewFlash Study Platform
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mt-4">
          ReviewFlash (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our web application, flashcard review system, quiz assessments, and study music lounge.
        </p>
      </div>

      {/* Section 1: Information We Collect */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5 text-white font-bold text-lg">
          <UserCheck className="text-cyan-400" size={20} />
          <h2>1. Information We Collect</h2>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            We only collect the minimal information necessary to deliver active recall study tools and sync your flashcard decks across devices:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Account &amp; Authentication Information:</strong> When you sign in using <strong>Facebook Login</strong>, <strong>Google</strong>, or <strong>Email &amp; Password</strong>, we receive your basic public profile information (such as your Name, Email address, Profile Picture URL, and unique User ID) via Firebase Authentication.
            </li>
            <li>
              <strong className="text-slate-200">User-Generated Study Content:</strong> Flashcard decks, question/answer pairs, study tags, and custom playlists that you create or import.
            </li>
            <li>
              <strong className="text-slate-200">Study Analytics &amp; Progress:</strong> Quiz scores, cards reviewed, review accuracy, flagged questions, and learning streak statistics to provide adaptive difficulty scaling.
            </li>
            <li>
              <strong className="text-slate-200">Local Browser Storage:</strong> Audio player preferences (volume, autoplay, active playlist) and test shuffle settings stored locally on your device in <code className="text-cyan-300">localStorage</code>.
            </li>
          </ul>
        </div>
      </div>

      {/* Section 2: How We Use Your Information */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5 text-white font-bold text-lg">
          <Database className="text-emerald-400" size={20} />
          <h2>2. How We Use Your Information</h2>
        </div>

        <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>We use your information exclusively to:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
            <li>Synchronize your flashcards and review sets across your mobile and desktop devices.</li>
            <li>Generate adaptive multiple-choice questions tailored to your knowledge retention.</li>
            <li>Authenticate your login sessions securely via Firebase Authentication &amp; Facebook OAuth.</li>
            <li>Provide ambient study background music and manage custom playlist queues.</li>
          </ul>
          <p className="pt-2 font-semibold text-emerald-300">
            ✅ We NEVER sell, rent, or trade your personal data or study decks to third parties or advertisers.
          </p>
        </div>
      </div>

      {/* Section 3: Third-Party Services */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5 text-white font-bold text-lg">
          <Lock className="text-indigo-400" size={20} />
          <h2>3. Third-Party Service Providers</h2>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>ReviewFlash integrates with trusted industry-standard infrastructure:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Google Firebase (Authentication &amp; Firestore):</strong> Provides encrypted user authentication and real-time cloud database storage.
            </li>
            <li>
              <strong className="text-slate-200">Meta / Facebook Login:</strong> Facilitates optional, 1-click social sign-in. ReviewFlash only requests the standard <code className="text-cyan-300">public_profile</code> and <code className="text-cyan-300">email</code> permissions.
            </li>
            <li>
              <strong className="text-slate-200">YouTube IFrame Player API:</strong> Used to stream user-selected background study audio. YouTube&apos;s Terms of Service apply to embedded video playback.
            </li>
          </ul>
        </div>
      </div>

      {/* Section 4: Data Deletion Instructions */}
      <div
        id="data-deletion"
        className="rounded-3xl border border-rose-500/30 bg-rose-950/10 p-6 sm:p-8 space-y-4 scroll-mt-20"
      >
        <div className="flex items-center gap-2.5 text-white font-bold text-lg">
          <Trash2 className="text-rose-400" size={20} />
          <h2>4. User Data Deletion Instructions</h2>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            In compliance with the Meta (Facebook) Platform Terms and GDPR/CCPA privacy standards, you have the right to request the complete deletion of all your personal data, account records, and study decks stored on ReviewFlash at any time.
          </p>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
            <h3 className="font-bold text-slate-100">How to Delete Your Data:</h3>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-400">
              <li>
                <strong className="text-slate-200">Self-Service in App:</strong> You can delete any individual study deck directly from the <Link href="/decks" className="text-cyan-400 hover:underline">My Decks</Link> page by clicking the deck options menu ➔ <em>Delete Deck</em>.
              </li>
              <li>
                <strong className="text-slate-200">Clear Local Browser Data:</strong> Click <em>Sign Out</em> in the navigation bar, or clear your browser&apos;s cookies and Local Storage for this site to remove all cached decks and settings.
              </li>
              <li>
                <strong className="text-slate-200">Remove via Facebook Settings:</strong> Go to your Facebook profile ➔ <strong>Settings &amp; Privacy</strong> ➔ <strong>Settings</strong> ➔ <strong>Apps and Websites</strong> ➔ Select <strong>ReviewFlash</strong> ➔ Click <strong>Remove</strong>.
              </li>
              <li>
                <strong className="text-slate-200">Complete Cloud Account Purge:</strong> To permanently delete your entire user account, UID, profile, and all synchronized Cloud Firestore decks, submit a deletion request to our support email below. All associated records will be permanently purged within 48 hours.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Section 5: Contact Information */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-3 text-xs sm:text-sm text-slate-300">
        <div className="flex items-center gap-2.5 text-white font-bold text-lg">
          <Mail className="text-cyan-400" size={20} />
          <h2>5. Contact Us</h2>
        </div>
        <p className="text-slate-400 leading-relaxed">
          If you have any questions about this Privacy Policy, your personal data, or data deletion requests, please contact us at:
        </p>
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-xs text-cyan-300 inline-block">
          support@review-flash.firebaseapp.com
        </div>
      </div>

      {/* Footer Links */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <Link href="/help" className="hover:text-white transition">Guide &amp; FAQs</Link>
          <Link href="/updates" className="hover:text-white transition">What&apos;s New</Link>
        </div>
        <div>
          © {new Date().getFullYear()} ReviewFlash. All rights reserved.
        </div>
      </div>
    </div>
  );
}
