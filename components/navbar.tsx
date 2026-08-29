"use client";

import Link from "next/link";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { clearCurrentUserId, setCurrentUserId } from "@/lib/flashcardService";
import {
  BookOpen,
  BrainCircuit,
  House,
  LogIn,
  LogOut,
  PlusCircle,
  UserCircle2,
} from "lucide-react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/review", label: "Review", icon: BookOpen },
  { href: "/test", label: "Test", icon: BrainCircuit },
  { href: "/create", label: "Create", icon: PlusCircle },
];

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      setCurrentUserId("local-user");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (nextUser?.uid) {
        setCurrentUserId(nextUser.uid);
      } else {
        setCurrentUserId("local-user");
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
    } catch (error) {
      console.error("Sign out failed", error);
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
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                <UserCircle2 size={16} />
                <span className="hidden sm:inline">{user.displayName || "Google user"}</span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-2 py-1 text-xs text-slate-200 hover:text-white"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
              >
                <LogIn size={15} />
                Sign in with Google
              </button>
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
