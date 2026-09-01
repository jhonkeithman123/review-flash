"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  BrainCircuit,
  Bug,
  Headphones,
  HelpCircle,
  Lock,
  Rocket,
  Scale,
  Shield,
  Trash2,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 text-slate-400 py-8 px-4 text-xs mt-auto">
      <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Tagline */}
        <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg overflow-hidden border border-cyan-500/40 bg-slate-900 flex items-center justify-center">
              <img src="/favicon.png" alt="ReviewFlash" className="h-full w-full object-contain" />
            </div>
            <span className="font-bold text-white text-sm">ReviewFlash</span>
            <span className="rounded bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 text-[9px] font-bold font-mono">
              v2.0.0
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Active recall flashcards, AI adaptive testing &amp; study lounge.
          </p>
        </div>

        {/* Legal & Policy Quick Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <Link
            href="/terms"
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Scale size={13} className="text-indigo-400" />
            <span>Terms of Service</span>
          </Link>

          <Link
            href="/privacy"
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Shield size={13} className="text-emerald-400" />
            <span>Privacy Policy</span>
          </Link>

          <Link
            href="/data-deletion"
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/40 hover:border-rose-500/50 px-3 py-1.5 text-xs text-rose-300 hover:text-rose-200 transition cursor-pointer"
          >
            <Trash2 size={13} className="text-rose-400" />
            <span>Data Deletion</span>
          </Link>

          <Link
            href="/support"
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-500/50 px-3 py-1.5 text-xs text-cyan-300 hover:text-cyan-200 transition cursor-pointer"
          >
            <Bug size={13} className="text-cyan-400" />
            <span>Support &amp; Bugs</span>
          </Link>

          <Link
            href="/help"
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer"
          >
            <HelpCircle size={13} className="text-cyan-400" />
            <span>Help &amp; FAQs</span>
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-[11px] text-slate-500 text-center md:text-right">
          © {new Date().getFullYear()} ReviewFlash. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
