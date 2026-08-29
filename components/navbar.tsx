"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
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
  Copy,
  FolderKanban,
  House,
  LogIn,
  LogOut,
  Menu,
  PlusCircle,
  Shield,
  UserCircle2,
  X,
} from "lucide-react";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from "firebase/auth";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/decks", label: "Decks", icon: FolderKanban },
  { href: "/review", label: "Review", icon: BookOpen },
  { href: "/test", label: "Test", icon: BrainCircuit },
  { href: "/create", label: "Create", icon: PlusCircle },
];

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [anonId, setAnonId] = useState<string>("");
  const [copiedId, setCopiedId] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setAnonId(getCurrentUserId());

    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      return;
    }

    // Handle return from redirect sign-in (e.g. mobile Safari / Chrome or when popup is blocked)
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
        console.warn("Firebase redirect auth result check:", err);
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

  // Close mobile/tablet menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured || !auth) return;

    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setCurrentUserId(result.user.uid);
      if (result.user.email) setCurrentUserEmail(result.user.email);
      if (result.user.displayName) setCurrentUserName(result.user.displayName);
      setMobileMenuOpen(false);
    } catch (error: unknown) {
      console.warn("Popup sign-in failed or blocked, attempting redirect fallback...", error);
      const authErr = error as { code?: string };
      // If browser blocked the popup, seamlessly fallback to full page redirect
      if (
        authErr?.code === "auth/popup-blocked" ||
        authErr?.code === "auth/cancelled-popup-request" ||
        authErr?.code === "auth/popup-closed-by-user" ||
        authErr?.code === "auth/unauthorized-domain"
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error("Redirect sign-in also failed:", redirectError);
        }
      }
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;

    try {
      await signOut(auth);
      setUser(null);
      clearCurrentUserId();
      setAnonId(getCurrentUserId());
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

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-white group shrink-0"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40 group-hover:scale-105 transition">
            <BrainCircuit size={18} />
          </span>
          <span className="tracking-tight">ReviewFlash</span>
        </Link>

        {/* Desktop Navigation Links (>= lg / 1024px) */}
        <div className="hidden lg:flex items-center gap-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition shrink-0 ${
                  isActive
                    ? "border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-sm shadow-cyan-500/10"
                    : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
                }`}
              >
                <Icon size={14} className={isActive ? "text-cyan-300" : "text-slate-400"} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Desktop Auth / User ID Section (>= lg / 1024px) */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          {isFirebaseConfigured ? (
            user ? (
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
                <UserCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span className="font-medium max-w-[140px] truncate">
                  {user.displayName || user.email || "Google user"}
                </span>
                <button
                  type="button"
                  onClick={handleCopyMyId}
                  title="Click to copy User ID / Email for sharing permissions"
                  className="rounded px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition cursor-pointer font-mono"
                >
                  {copiedId ? "Copied!" : "Copy ID"}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-2 py-1 text-xs text-slate-200 hover:text-white cursor-pointer ml-0.5"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMyId}
                  title="Your unique client ID. Click to copy and share with deck owners for permissions."
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer font-mono"
                >
                  <UserCircle2 size={13} />
                  <span>ID: {anonId.slice(0, 8)}…</span>
                  {copiedId ? (
                    <Check size={12} className="text-cyan-300" />
                  ) : (
                    <Copy size={11} className="opacity-60" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 cursor-pointer shadow-sm"
                >
                  <LogIn size={14} />
                  Sign in
                </button>
              </div>
            )
          ) : (
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-400 font-mono">
              Local ID: {anonId.slice(0, 8)}
            </span>
          )}
        </div>

        {/* Mobile & Tablet (< lg, e.g. 820px, iPad, Phones) Header Actions */}
        <div className="flex lg:hidden items-center gap-2">
          {isFirebaseConfigured ? (
            user ? (
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
                <UserCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span className="max-w-[85px] sm:max-w-[140px] truncate text-xs font-medium">
                  {user.displayName || user.email?.split("@")[0] || "User"}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 cursor-pointer shadow-sm"
              >
                <LogIn size={13} />
                <span>Sign in</span>
              </button>
            )
          ) : null}

          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:border-cyan-500/50 hover:text-white transition cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} className="text-cyan-400" /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet (< lg) Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
          {/* User / Account Card */}
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
                          {user.displayName || "Google User"}
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
                      className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition"
                    >
                      {copiedId ? "Copied!" : "Copy ID"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer shadow-md"
                  >
                    <LogIn size={15} />
                    <span>Sign in with Google</span>
                  </button>
                </div>
              )
            ) : (
              <div className="text-xs text-slate-400 font-mono">
                Local Mode | ID: {anonId}
              </div>
            )}
          </div>

          {/* Navigation Links List */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">
              Navigation
            </div>
            {navItems.map(({ href, label, icon: Icon }) => {
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
          </div>
        </div>
      )}
    </nav>
  );
}
