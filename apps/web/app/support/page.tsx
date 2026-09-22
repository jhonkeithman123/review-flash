"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageSquare,
  Radio,
  Send,
  Shield,
  Sparkles,
  Terminal,
} from "lucide-react";
import { APP_VERSION, APP_CODENAME } from "@/lib/version";

export default function SupportPage() {
  const supportEmail = "keithvirgenes17@gmail.com";

  const [category, setCategory] = useState<"bug" | "audio" | "auth" | "feature" | "other">("bug");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // Generate system diagnostics
  const getDiagnosticsText = () => {
    if (typeof window === "undefined") return "";
    return `
--- System Diagnostics ---
App Version: ${APP_VERSION} (${APP_CODENAME})
Browser: ${navigator.userAgent}
Language: ${navigator.language}
Screen Resolution: ${window.screen.width}x${window.screen.height}
Viewport: ${window.innerWidth}x${window.innerHeight}
Timestamp: ${new Date().toISOString()}
--------------------------`;
  };

  const constructReportBody = () => {
    let body = `[ReviewFlash Support Report]\n\n`;
    body += `Category: ${category.toUpperCase()}\n`;
    body += `Subject: ${subject || "No Subject"}\n\n`;
    body += `Description:\n${description || "N/A"}\n\n`;
    if (steps.trim()) {
      body += `Steps to Reproduce:\n${steps}\n\n`;
    }
    if (includeDiagnostics) {
      body += getDiagnosticsText();
    }
    return body;
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !subject.trim()) return;

    const emailSubject = encodeURIComponent(`[ReviewFlash ${category.toUpperCase()}] ${subject || "Support Report"}`);
    const emailBody = encodeURIComponent(constructReportBody());

    window.open(`mailto:${supportEmail}?subject=${emailSubject}&body=${emailBody}`, "_blank");
    setSubmittedMessage(true);
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(constructReportBody());
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

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
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <LifeBuoy size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Help &amp; Support Center
              </h1>
              <p className="text-xs text-slate-400">
                Report bugs, request features, or get direct assistance
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyEmail}
            className="self-start sm:self-auto flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-mono text-cyan-300 hover:border-cyan-500/50 hover:bg-slate-850 transition cursor-pointer shadow-md"
          >
            <Mail size={14} className="text-cyan-400" />
            <span>{supportEmail}</span>
            {copiedEmail ? <Check size={14} className="text-emerald-400" /> : <Copy size={13} className="opacity-60" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Bug / Issue Report Form */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Bug className="text-rose-400" size={20} />
            <h2>Submit a Bug or Issue Report</h2>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-4">
            {/* Category Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Issue Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "bug", label: "🐛 Bug / Defect" },
                  { id: "audio", label: "🎧 Music / Audio" },
                  { id: "auth", label: "🔐 Facebook / Login" },
                  { id: "feature", label: "💡 Feature Request" },
                  { id: "other", label: "❓ General Issue" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id as any)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold text-left transition cursor-pointer ${
                      category === item.id
                        ? "border-cyan-500 bg-cyan-500/15 text-cyan-200"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Summary / Subject *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Playlist songs not advancing automatically"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Problem Description *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what happened, what you expected, and any error message you saw..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none resize-y"
              />
            </div>

            {/* Steps to Reproduce */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Steps to Reproduce (Optional)
              </label>
              <textarea
                rows={2}
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="1. Open Music Lounge&#10;2. Paste YouTube link&#10;3. Click Next track"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none resize-y font-mono"
              />
            </div>

            {/* Include Diagnostics Checkbox */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeDiagnostics}
                  onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                  className="rounded border-slate-700 accent-cyan-500 cursor-pointer"
                />
                <span className="font-semibold">Include anonymous device &amp; browser diagnostics</span>
              </label>
              <span className="text-[10px] text-slate-500 hidden sm:inline">{APP_VERSION}</span>
            </div>

            {/* Submit & Copy Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 text-xs font-bold text-slate-950 hover:brightness-110 transition cursor-pointer shadow-md shadow-cyan-500/20"
              >
                <Send size={15} />
                <span>Send via Email to {supportEmail}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyReport}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition cursor-pointer"
              >
                {copiedReport ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                <span>{copiedReport ? "Report Copied!" : "Copy Report Text"}</span>
              </button>
            </div>

            {submittedMessage && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-300 animate-in fade-in">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Your default email client was opened. If not, you can copy the report and email us directly at <strong>{supportEmail}</strong>.</span>
              </div>
            )}
          </form>
        </div>

        {/* Right 1 Col: Direct Contact & Quick Tips */}
        <div className="space-y-6">
          {/* Direct Support Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Mail className="text-cyan-400" size={18} />
              <h3>Direct Contact</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Have an urgent inquiry, security notice, or partnership question? You can reach the lead developer directly:
            </p>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2 text-xs">
              <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                Support Email
              </div>
              <a
                href={`mailto:${supportEmail}`}
                className="block font-mono text-cyan-300 hover:underline break-all font-semibold"
              >
                {supportEmail}
              </a>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Typical response time: &lt; 24 hours</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`mailto:${supportEmail}?subject=[ReviewFlash]%20Direct%20Inquiry`}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition"
              >
                <ExternalLink size={13} />
                <span>Open Mail Client</span>
              </a>
            </div>
          </div>

          {/* Quick Troubleshooting Links */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 space-y-3 text-xs text-slate-300">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400" />
              <span>Self-Service Resources</span>
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2.5 hover:border-slate-700 hover:text-white transition"
                >
                  <span>Interactive Guide &amp; FAQs</span>
                  <HelpCircle size={14} className="text-cyan-400" />
                </Link>
              </li>
              <li>
                <Link
                  href="/data-deletion"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2.5 hover:border-slate-700 hover:text-white transition"
                >
                  <span>User Data Deletion</span>
                  <Shield size={14} className="text-rose-400" />
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2.5 hover:border-slate-700 hover:text-white transition"
                >
                  <span>Privacy Policy</span>
                  <Shield size={14} className="text-emerald-400" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <Link href="/data-deletion" className="hover:text-white transition">Data Deletion</Link>
        </div>
        <div>
          © {new Date().getFullYear()} ReviewFlash. All rights reserved.
        </div>
      </div>
    </div>
  );
}
