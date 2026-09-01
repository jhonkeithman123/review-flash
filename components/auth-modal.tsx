"use client";

import { useState } from "react";
import { auth, facebookProvider, isFirebaseConfigured } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  User,
} from "firebase/auth";
import {
  setCurrentUserEmail,
  setCurrentUserId,
  setCurrentUserName,
} from "@/lib/flashcardService";
import {
  AlertCircle,
  BrainCircuit,
  Check,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  User as UserIcon,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSwitchTab = (nextTab: "signin" | "signup") => {
    setTab(nextTab);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured || !auth) {
      setErrorMsg("Firebase is not configured. Running in local mode.");
      return;
    }

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMsg("Please fill in both email and password.");
      return;
    }

    if (tab === "signup") {
      if (cleanPass.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        return;
      }
      if (cleanPass !== confirmPassword.trim()) {
        setErrorMsg("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (tab === "signup") {
        // Create user
        const res = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
        const displayName = name.trim() || cleanEmail.split("@")[0];

        // Update display name
        if (displayName && res.user) {
          try {
            await updateProfile(res.user, { displayName });
          } catch {
            // ignore
          }
        }

        setCurrentUserId(res.user.uid);
        setCurrentUserEmail(res.user.email || cleanEmail);
        setCurrentUserName(displayName);

        setSuccessMsg("🎉 Account created successfully! Logging you in...");
        setTimeout(() => {
          onSuccess?.(res.user);
          onClose();
          resetForm();
        }, 600);
      } else {
        // Sign in
        const res = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
        setCurrentUserId(res.user.uid);
        if (res.user.email) setCurrentUserEmail(res.user.email);
        if (res.user.displayName) setCurrentUserName(res.user.displayName);

        setSuccessMsg("✅ Signed in successfully!");
        setTimeout(() => {
          onSuccess?.(res.user);
          onClose();
          resetForm();
        }, 500);
      }
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      console.error("Auth error:", authErr);

      if (authErr?.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already in use. Please sign in instead.");
      } else if (authErr?.code === "auth/invalid-email") {
        setErrorMsg("Please enter a valid email address.");
      } else if (authErr?.code === "auth/weak-password") {
        setErrorMsg("Password is too weak. Please use at least 6 characters.");
      } else if (
        authErr?.code === "auth/user-not-found" ||
        authErr?.code === "auth/wrong-password" ||
        authErr?.code === "auth/invalid-credential"
      ) {
        setErrorMsg("Incorrect email or password. Please check and try again.");
      } else if (authErr?.code === "auth/operation-not-allowed") {
        setErrorMsg("Email/Password login is not enabled in Firebase Console ➔ Authentication ➔ Sign-in method.");
      } else if (authErr?.code === "auth/too-many-requests") {
        setErrorMsg("Too many failed attempts. Please wait a moment and try again.");
      } else {
        setErrorMsg(authErr?.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    if (!isFirebaseConfigured || !auth) {
      setErrorMsg("Firebase is not configured. Running in local storage mode.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await signInWithPopup(auth, facebookProvider);
      if (res.user) {
        setCurrentUserId(res.user.uid);
        if (res.user.email) setCurrentUserEmail(res.user.email);
        if (res.user.displayName) setCurrentUserName(res.user.displayName);
        setSuccessMsg("🎉 Signed in with Facebook!");
        setTimeout(() => {
          onSuccess?.(res.user);
          onClose();
          resetForm();
        }, 500);
      }
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      console.error("Facebook Auth Error:", authErr);
      if (authErr?.code === "auth/account-exists-with-different-credential") {
        setErrorMsg("An account already exists with the email associated with Facebook. Please sign in with email/password.");
      } else if (authErr?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Facebook sign-in popup was closed before completing.");
      } else if (authErr?.code === "auth/operation-not-allowed") {
        setErrorMsg("Facebook login is not enabled in Firebase Console ➔ Authentication ➔ Sign-in method.");
      } else {
        setErrorMsg(authErr?.message || "Failed to sign in with Facebook.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleUnderMaintenance = () => {
    setErrorMsg("⚠️ Google Sign-In is temporarily under maintenance. Please use Facebook or Email & Password to sign in.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            onClose();
            resetForm();
          }}
          className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Brand / Title Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-cyan-500/40 p-1.5 shadow-xl shadow-cyan-500/20 overflow-hidden">
            <img
              src="/favicon.png"
              alt="ReviewFlash Logo"
              className="h-full w-full object-contain rounded-xl"
            />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {tab === "signin" ? "Welcome Back" : "Create an Account"}
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            {tab === "signin"
              ? "Sign in to sync your study sets and collaborate across devices"
              : "Sign up to create, edit, and share flashcard decks"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-5 flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => handleSwitchTab("signin")}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
              tab === "signin"
                ? "bg-cyan-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTab("signup")}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
              tab === "signup"
                ? "bg-cyan-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200 animate-in fade-in">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-200 animate-in fade-in">
            <Check size={15} className="shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {tab === "signup" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Full Name / Username
              </label>
              <div className="relative">
                <UserIcon
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Keith Man"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "signup" ? "At least 6 characters" : "••••••••"}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-10 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {tab === "signup" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Confirm Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            ) : tab === "signin" ? (
              <>
                <LogIn size={15} />
                <span>Sign In with Email</span>
              </>
            ) : (
              <>
                <UserPlus size={15} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Other methods
          </span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* OAuth Buttons (Facebook & Google) */}
        <div className="space-y-2">
          {/* Facebook Sign In Button */}
          <button
            type="button"
            onClick={handleFacebookSignIn}
            disabled={loading}
            className="w-full flex items-center justify-between rounded-2xl border border-blue-600/40 bg-blue-600/10 hover:bg-blue-600/20 px-4 py-2.5 text-xs font-semibold text-blue-200 hover:text-white transition cursor-pointer group shadow-sm active:scale-[0.985]"
          >
            <div className="flex items-center gap-2.5">
              <svg className="h-4 w-4 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Continue with Facebook</span>
            </div>
            <span className="text-[10px] text-blue-300 font-bold bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
              Instant
            </span>
          </button>

          {/* Google Under Maintenance Button */}
          <button
            type="button"
            onClick={handleGoogleUnderMaintenance}
            className="w-full flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-xs font-medium text-slate-400 hover:border-amber-500/40 hover:text-slate-300 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 opacity-60 group-hover:opacity-80">
              <svg className="h-4 w-4 grayscale" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.37 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.63 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
              <Wrench size={10} />
              Maintenance
            </span>
          </button>
        </div>

        {/* Switch tab prompt */}
        <p className="mt-5 text-center text-xs text-slate-400">
          {tab === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => handleSwitchTab("signup")}
                className="font-bold text-cyan-400 hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => handleSwitchTab("signin")}
                className="font-bold text-cyan-400 hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
