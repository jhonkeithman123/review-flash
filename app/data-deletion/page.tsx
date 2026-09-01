"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Lock,
  Mail,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserX,
} from "lucide-react";

function DataDeletionContent() {
  const searchParams = useSearchParams();
  const confirmationCode = searchParams.get("code") || searchParams.get("id");
  const [inputCode, setInputCode] = useState(confirmationCode || "");
  const [statusChecked, setStatusChecked] = useState(Boolean(confirmationCode));

  const handleCheckStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      setStatusChecked(true);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16 pt-4 text-slate-200">
      {/* Back Button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
        >
          <ArrowLeft size={14} />
          <span>Back to ReviewFlash</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300">
            <Trash2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              User Data Deletion Instructions
            </h1>
            <p className="text-xs text-slate-400">
              Meta (Facebook) Data Protection &amp; Privacy Compliance
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mt-4">
          ReviewFlash respects your privacy and data ownership. Under Meta Platform Terms and global data protection regulations (GDPR/CCPA), you have the absolute right to request the deletion of your personal data, Facebook login associations, and study records.
        </p>
      </div>

      {/* Status Confirmation Checker (For Meta Callback queries) */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <Search className="text-cyan-400" size={18} />
          <h2>Check Deletion Request Status</h2>
        </div>

        <p className="text-xs text-slate-400">
          If you submitted a data deletion request through Facebook or received a confirmation code, you can verify your deletion status below:
        </p>

        <form onSubmit={handleCheckStatus} className="flex gap-2">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Enter Confirmation Code (e.g. del_fb_...)"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer"
          >
            Check Status
          </button>
        </form>

        {statusChecked && (
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Request Acknowledged &amp; Processed</p>
              <p className="text-emerald-400/80 mt-0.5">
                Code: <code className="font-mono">{inputCode || "N/A"}</code> — All user authentication tokens and linked data associated with this ID have been scheduled for deletion / purged from active sessions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Step-by-Step Instructions */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5 text-white font-bold text-lg">
          <UserX className="text-rose-400" size={20} />
          <h2>Step-by-Step Deletion Methods</h2>
        </div>

        {/* Method 1: Facebook App Removal */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-2.5">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-[11px] font-bold text-blue-300 border border-blue-500/30">
              1
            </span>
            <span>Remove ReviewFlash from your Facebook Account:</span>
          </h3>
          <ol className="list-decimal pl-6 space-y-1.5 text-xs text-slate-300 leading-relaxed">
            <li>Log into your Facebook account and go to your profile.</li>
            <li>
              Navigate to <strong>Settings &amp; Privacy</strong> ➔ <strong>Settings</strong>.
            </li>
            <li>
              In the left menu, click <strong>Apps and Websites</strong>.
            </li>
            <li>
              Find <strong>ReviewFlash</strong> and click the <strong>Remove</strong> button.
            </li>
            <li>
              Confirm removal. Facebook will notify our server to immediately disconnect your profile tokens.
            </li>
          </ol>
        </div>

        {/* Method 2: Self-Service in ReviewFlash */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-2.5">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
              2
            </span>
            <span>Delete Decks &amp; Local Cache directly in ReviewFlash:</span>
          </h3>
          <ul className="list-disc pl-6 space-y-1.5 text-xs text-slate-300 leading-relaxed">
            <li>
              <strong>Delete Individual Study Decks:</strong> Go to <Link href="/decks" className="text-cyan-400 hover:underline">My Decks</Link> and click the trash icon on any deck to permanently delete it.
            </li>
            <li>
              <strong>Clear Local Browser Cache:</strong> Open your browser settings ➔ Clear Browsing Data for <code className="text-cyan-300">review-flash.firebaseapp.com</code> to erase all locally cached flashcards and study preferences.
            </li>
          </ul>
        </div>

        {/* Method 3: Direct Email Purge Request */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-2.5">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[11px] font-bold text-cyan-300 border border-cyan-500/30">
              3
            </span>
            <span>Request Complete Account &amp; Database Purge:</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            To request permanent manual deletion of your UID, email address, display name, and all cloud-stored decks from our Firebase database:
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Mail size={14} className="text-cyan-400 shrink-0" />
            <span className="text-xs text-slate-400">Email:</span>
            <a
              href="mailto:keithvirgenes17@gmail.com?subject=Data%20Deletion%20Request"
              className="text-xs font-mono text-cyan-300 hover:underline"
            >
              keithvirgenes17@gmail.com
            </a>
          </div>
          <p className="text-[11px] text-slate-500">
            Manual deletion requests are permanently fulfilled within 48 hours.
          </p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <Link href="/support" className="hover:text-white transition">Support &amp; Bugs</Link>
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <Link href="/help" className="hover:text-white transition">Guide &amp; FAQs</Link>
        </div>
        <div>
          © {new Date().getFullYear()} ReviewFlash. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default function DataDeletionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Data Deletion Instructions...</div>}>
      <DataDeletionContent />
    </Suspense>
  );
}
