"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import {
  clearCurrentUserId,
  getCurrentUserEmail,
  getCurrentUserId,
  getCurrentUserName,
  setCurrentUserEmail,
  setCurrentUserId,
  setCurrentUserName,
} from "@/lib/flashcardService";
import {
  BookOpen,
  BrainCircuit,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FolderKanban,
  GraduationCap,
  HelpCircle,
  House,
  LogIn,
  LogOut,
  Menu,
  MoreHorizontal,
  PlusCircle,
  Rocket,
  Share2,
  Sparkles,
  User,
  UserCircle2,
  X,
} from "lucide-react";

import {
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { AuthModal } from "./auth-modal";

// Core Primary Nav Links
const primaryNavItems = [
  { href: "/decks", label: "Decks", icon: FolderKanban },
  { href: "/review", label: "Review", icon: BookOpen },
  { href: "/test", label: "Test", icon: BrainCircuit },
  { href: "/create", label: "Create", icon: PlusCircle },
];

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [anonId, setAnonId] = useState<string>("");
  const [copiedId, setCopiedId] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Dropdown States
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target as Node)
      ) {
        setMoreDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setMoreDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    setAnonId(getCurrentUserId());

    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      return;
    }

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
          setCurrentUserId(result.user.uid);
          if (result.user.email) setCurrentUserEmail(result.user.email);
          if (result.user.displayName) setCurrentUserName(result.user.displayName);
        }
      })
      .catch((err) => {
        console.warn("Firebase redirect auth check:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (nextUser?.uid) {
        setCurrentUserId(nextUser.uid);
        if (nextUser.email) setCurrentUserEmail(nextUser.email);
        if (nextUser.displayName) setCurrentUserName(nextUser.displayName);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setUser(null);
      clearCurrentUserId();
      setAnonId(getCurrentUserId());
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  const handleCopyMyId = async () => {
    const idToCopy = user?.email || user?.uid || anonId;
    if (!idToCopy) return;
    try {
      await navigator.clipboard.writeText(idToCopy);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenTour = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-reviewflash-tour"));
      setMoreDropdownOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const handleOpenAiTutor = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-ai-tutor", { detail: { mode: "general" } })
      );
      setMoreDropdownOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const handleOpenWhatsNew = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-whats-new"));
      setMoreDropdownOpen(false);
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/85 backdrop-blur-xl transition-all">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          {/* LEFT: Brand Logo & Version Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-base font-bold text-white group"
            >
              <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-slate-900 border border-cyan-500/30 p-0.5 group-hover:scale-105 group-hover:border-cyan-400 transition shadow-md shadow-cyan-500/15 flex items-center justify-center">
                <img
                  src="/favicon.png"
                  alt="ReviewFlash Logo"
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>
              <span className="tracking-tight hidden sm:inline text-white font-extrabold">
                ReviewFlash
              </span>
            </Link>

            <button
              type="button"
              onClick={handleOpenWhatsNew}
              title="View What's New in v1.4.0"
              className="hidden sm:inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/90 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300 transition cursor-pointer"
            >
              <Rocket size={10} className="text-cyan-400 animate-pulse" />
              <span>v1.4.0</span>
            </button>
          </div>



          {/* MIDDLE: Primary Nav Links (Visible md & up, no overlap) */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/70 p-1 rounded-2xl border border-slate-800/80">
            {primaryNavItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
                    isActive
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-slate-950" : "text-cyan-400"} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          {/* RIGHT: Action Buttons & Dropdown Menus */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 1. DITroy AI Tutor Quick Trigger Button */}
            <button
              type="button"
              onClick={handleOpenAiTutor}
              title="Open DITroy AI Study Tutor"
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 px-3 py-1.5 text-xs font-bold text-indigo-200 hover:border-indigo-400 hover:bg-indigo-500/30 transition cursor-pointer shadow-sm shadow-indigo-500/10"
            >
              <Sparkles size={14} className="text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">AI Tutor</span>
              <span className="sm:hidden">AI</span>
            </button>

            {/* 2. "More / Tools" Dropdown Menu (Desktop) */}
            <div className="relative hidden sm:block" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setMoreDropdownOpen(!moreDropdownOpen);
                  setUserDropdownOpen(false);
                }}
                className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                  moreDropdownOpen
                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                    : "border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
                }`}
              >
                <HelpCircle size={14} className="text-slate-400" />
                <span className="text-xs">Help</span>
                <ChevronDown size={13} className={`transition duration-150 ${moreDropdownOpen ? "rotate-180 text-cyan-400" : "text-slate-500"}`} />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 mb-1">
                    Help &amp; Resources
                  </div>

                  <Link
                    href="/help"
                    onClick={() => setMoreDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900 hover:text-white transition"
                  >
                    <HelpCircle size={15} className="text-cyan-400" />
                    <div className="flex-1">
                      <div>Help &amp; FAQ Center</div>
                      <div className="text-[10px] text-slate-400">Insertion guide &amp; answers</div>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={handleOpenTour}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900 hover:text-white transition text-left cursor-pointer"
                  >
                    <GraduationCap size={15} className="text-emerald-400" />
                    <div className="flex-1">
                      <div>Interactive Tour</div>
                      <div className="text-[10px] text-slate-400">Step-by-step walkthrough</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenWhatsNew}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900 hover:text-white transition text-left cursor-pointer"
                  >
                    <Rocket size={15} className="text-amber-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span>What&apos;s New</span>
                        <span className="rounded bg-cyan-500/20 text-cyan-300 px-1 py-0.2 text-[9px] font-bold font-mono">v1.4.0</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Announcement &amp; features</div>
                    </div>
                  </button>


                  <Link
                    href="/decks"
                    onClick={() => setMoreDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900 hover:text-white transition"
                  >
                    <Share2 size={15} className="text-indigo-400" />
                    <div className="flex-1">
                      <div>Import Share Code</div>
                      <div className="text-[10px] text-slate-400">Load peer decks</div>
                    </div>
                  </Link>
                </div>

              )}
            </div>

            {/* 3. User Account Menu Dropdown */}
            {isFirebaseConfigured ? (
              user ? (
                <div className="relative" ref={userDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen);
                      setMoreDropdownOpen(false);
                    }}
                    className={`inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs transition cursor-pointer ${
                      userDropdownOpen
                        ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200"
                        : "border-slate-800 bg-slate-900/90 text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                      {user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : "U"}
                    </div>
                    <span className="hidden sm:inline font-semibold max-w-[100px] truncate">
                      {user.displayName || user.email?.split("@")[0]}
                    </span>
                    <ChevronDown size={13} className={`transition duration-150 ${userDropdownOpen ? "rotate-180 text-emerald-400" : "text-slate-500"}`} />
                  </button>

                  {/* User Floating Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-50 space-y-2.5">
                      {/* User Info Header */}
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-800/80">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-sm border border-emerald-500/40 shrink-0">
                          {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-100 truncate">
                            {user.displayName || "Learner"}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Copy ID Button */}
                      <button
                        type="button"
                        onClick={handleCopyMyId}
                        className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
                      >
                        <span className="text-[11px] truncate">
                          {copiedId ? "✅ Copied to Clipboard" : `ID: ${user.email || user.uid.slice(0, 14) + "…"}`}
                        </span>
                        {copiedId ? <Check size={13} className="text-emerald-400 shrink-0" /> : <Copy size={13} className="shrink-0 opacity-60" />}
                      </button>

                      {/* Menu Links */}
                      <div className="space-y-1 pt-1">
                        <Link
                          href="/decks"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition"
                        >
                          <FolderKanban size={14} className="text-cyan-400" />
                          <span>My Study Decks</span>
                        </Link>
                        <Link
                          href="/help"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition"
                        >
                          <HelpCircle size={14} className="text-indigo-400" />
                          <span>Guide &amp; FAQs</span>
                        </Link>
                        <button
                          type="button"
                          onClick={handleOpenWhatsNew}
                          className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition text-left cursor-pointer"
                        >
                          <Rocket size={14} className="text-amber-400" />
                          <div className="flex items-center justify-between flex-1">
                            <span>What&apos;s New</span>
                            <span className="text-[10px] font-mono text-cyan-300 font-bold">v1.4.0</span>
                          </div>
                        </button>
                      </div>



                      {/* Sign Out Button */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                        >
                          <LogOut size={13} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer shadow-sm shadow-cyan-500/20"
                >
                  <LogIn size={13} />
                  <span>Sign in</span>
                </button>
              )
            ) : null}

            {/* 4. Mobile / Tablet Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="md:hidden inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:border-cyan-500/50 hover:text-white transition cursor-pointer"
            >
              {mobileMenuOpen ? <X size={18} className="text-cyan-400" /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* MOBILE & TABLET DRAWER (When hamburger is clicked) */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
            {/* User Profile Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5">
              {isFirebaseConfigured ? (
                user ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-sm">
                          {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-100 truncate">
                            {user.displayName || "Learner"}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={handleCopyMyId}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        {copiedId ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copiedId ? "Copied User ID" : "Copy User ID"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                      >
                        <LogOut size={13} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-200">Guest Learner</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {anonId.slice(0, 12)}…
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyMyId}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                      >
                        {copiedId ? "Copied!" : "Copy ID"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setAuthModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer shadow-md"
                    >
                      <LogIn size={15} />
                      <span>Sign In / Create Account</span>
                    </button>
                  </div>
                )
              ) : null}
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">
                Menu
              </div>

              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  pathname === "/"
                    ? "border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-sm"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <House size={16} className={pathname === "/" ? "text-cyan-300" : "text-slate-400"} />
                  <span>Home</span>
                </div>
              </Link>

              {primaryNavItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-sm"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={isActive ? "text-cyan-300" : "text-slate-400"} />
                      <span>{label}</span>
                    </div>
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                  </Link>
                );
              })}

              <Link
                href="/help"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  pathname === "/help"
                    ? "border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-sm"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <HelpCircle size={16} className={pathname === "/help" ? "text-cyan-300" : "text-slate-400"} />
                  <span>Help &amp; FAQs</span>
                </div>
                {pathname === "/help" && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
              </Link>

              <Link
                href="/updates"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  pathname === "/updates"
                    ? "border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-sm"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Rocket size={16} className={pathname === "/updates" ? "text-cyan-300" : "text-slate-400"} />
                  <span>Updates &amp; Changelog</span>
                </div>
                <span className="rounded bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 text-[10px] font-bold font-mono">v1.4.0</span>
              </Link>
            </div>


            {/* Quick Actions inside Drawer */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleOpenTour}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
                >
                  <GraduationCap size={15} />
                  <span>Tour 🎓</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsNew}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
                >
                  <Rocket size={15} />
                  <span>What&apos;s New 🚀</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>


      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(u) => {
          setUser(u);
        }}
      />
    </>
  );
}
