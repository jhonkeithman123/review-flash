  "use client";

import Link from "next/link";
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
  Copy,
  FolderKanban,
  House,
  LogIn,
  LogOut,
  PlusCircle,
  Shield,
  UserCircle2,
} from "lucide-react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/decks", label: "Decks", icon: FolderKanban },
  { href: "/review", label: "Review", icon: BookOpen },
  { href: "/test", label: "Test", icon: BrainCircuit },
  { href: "/create", label: "Create", icon: PlusCircle },
];

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [anonId, setAnonId] = useState<string>("");
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    setAnonId(getCurrentUserId());

    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      return;
    }

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

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured || !auth) return;

    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setCurrentUserId(result.user.uid);
      if (result.user.email) setCurrentUserEmail(result.user.email);
      if (result.user.displayName) setCurrentUserName(result.user.displayName);
    } catch (error) {
      console.error("Google sign-in failed", error);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;

    try {
      await signOut(auth);
      setUser(null);
      clearCurrentUserId();
      setAnonId(getCurrentUserId());
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
    <nav className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-white"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40">
            <BrainCircuit size={18} />
          </span>
          ReviewFlash
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

          {isFirebaseConfigured ? (
            user ? (
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs sm:text-sm text-emerald-200">
                <UserCircle2 size={16} />
                <span className="hidden sm:inline font-medium">{user.displayName || user.email || "Google user"}</span>
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
                  className="inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-2 py-1 text-xs text-slate-200 hover:text-white cursor-pointer ml-1"
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
                  className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer font-mono"
                >
                  <UserCircle2 size={13} />
                  <span>ID: {anonId.slice(0, 10)}…</span>
                  <Copy size={11} className="opacity-60" />
                  {copiedId && <span className="text-cyan-300 font-bold">Copied!</span>}
                </button>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-950 transition hover:bg-cyan-400 cursor-pointer shadow-sm"
                >
                  <LogIn size={15} />
                  Sign in with Google
                </button>
              </div>
            )
          ) : (
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">
              Local mode
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
