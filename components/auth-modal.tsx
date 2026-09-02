"use client";

import { useState } from "react";
import { auth, googleProvider, facebookProvider, isFirebaseConfigured } from "@/lib/firebase";
import {
  AuthCredential,
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
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
  Globe,
  Link2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
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
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);

  // Account Linking State
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [pendingCredential, setPendingCredential] = useState<AuthCredential | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [linkPassword, setLinkPassword] = useState("");
  const [showLinkPassword, setShowLinkPassword] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setLinkPassword("");
    setIsLinkingMode(false);
    setIsPopupBlocked(false);
    setPendingCredential(null);
    setPendingEmail("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSwitchTab = (nextTab: "signin" | "signup") => {
    setTab(nextTab);
    setIsLinkingMode(false);
    setIsPopupBlocked(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !pendingCredential || !pendingEmail) return;

    if (!linkPassword.trim()) {
      setErrorMsg("Please enter your existing password to verify and link.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Sign in with existing email/password
      const userCred = await signInWithEmailAndPassword(auth, pendingEmail, linkPassword.trim());

      // 2. Link the Facebook credential to this existing user account
      await linkWithCredential(userCred.user, pendingCredential);

      setCurrentUserId(userCred.user.uid);
      if (userCred.user.email) setCurrentUserEmail(userCred.user.email);
      if (userCred.user.displayName) setCurrentUserName(userCred.user.displayName);

      setSuccessMsg("🎉 Facebook successfully linked! You can now log in with either Email or Facebook.");
      setTimeout(() => {
        onSuccess?.(userCred.user);
        onClose();
        resetForm();
      }, 900);
    } catch (err: unknown) {
      const linkErr = err as { code?: string; message?: string };
      console.error("Account linking error:", linkErr);
      if (
        linkErr?.code === "auth/wrong-password" ||
        linkErr?.code === "auth/invalid-credential" ||
        linkErr?.code === "auth/user-not-found"
      ) {
        setErrorMsg("Incorrect password. Please enter the password associated with this email.");
      } else {
        setErrorMsg(linkErr?.message || "Failed to link accounts. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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
        }, 500);
      } else {
        // Sign in
        const res = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
        setCurrentUserId(res.user.uid);
        if (res.user.email) setCurrentUserEmail(res.user.email);
        if (res.user.displayName) setCurrentUserName(res.user.displayName);

        setSuccessMsg("🎉 Signed in successfully!");
        setTimeout(() => {
          onSuccess?.(res.user);
          onClose();
          resetForm();
        }, 500);
      }
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      console.error("Auth Error:", authErr);
      if (authErr?.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already registered. Please sign in instead.");
      } else if (authErr?.code === "auth/invalid-email") {
        setErrorMsg("Invalid email format. Please check and try again.");
      } else if (authErr?.code === "auth/weak-password") {
        setErrorMsg("Password is too weak. Please use at least 6 characters.");
      } else if (
        authErr?.code === "auth/invalid-credential" ||
        authErr?.code === "auth/user-not-found" ||
        authErr?.code === "auth/wrong-password"
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

  // ========================================================
  // GOOGLE AUTHENTICATION (ACTIVE)
  // ========================================================
  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured || !auth) {
      setErrorMsg("Firebase is not configured. Running in local storage mode.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        setCurrentUserId(res.user.uid);
        if (res.user.email) setCurrentUserEmail(res.user.email);
        if (res.user.displayName) setCurrentUserName(res.user.displayName);
        setSuccessMsg("🎉 Signed in with Google!");
        setTimeout(() => {
          onSuccess?.(res.user);
          onClose();
          resetForm();
        }, 500);
      }
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string; customData?: { email?: string } };
      console.warn("Google Auth Note:", authErr?.code || authErr);

      if (authErr?.code === "auth/popup-blocked") {
        setIsPopupBlocked(true);
        setErrorMsg("Your browser blocked the popup. Click below to continue using full-page login:");
      } else if (authErr?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Google sign-in was cancelled before completion. Please try again.");
      } else if (authErr?.code === "auth/account-exists-with-different-credential") {
        const pendingCred =
          GoogleAuthProvider.credentialFromError(err as any) || (authErr as any)?.credential;
        const targetEmail = authErr?.customData?.email || (err as any)?.email;

        if (pendingCred && targetEmail) {
          setPendingCredential(pendingCred);
          setPendingEmail(targetEmail);
          setIsLinkingMode(true);
          setErrorMsg(null);
          setSuccessMsg("Account exists! Enter your password below to link Google permanently.");
        } else {
          setErrorMsg("An account already exists with this email. Please sign in with Email/Password to link Google.");
        }
      } else if (authErr?.code === "auth/operation-not-allowed") {
        setErrorMsg("Google login is not enabled in Firebase Console ➔ Authentication ➔ Sign-in method.");
      } else if (authErr?.code === "auth/unauthorized-domain") {
        setErrorMsg("Domain not authorized. Please add review-flash.vercel.app in Firebase Console ➔ Authentication ➔ Settings ➔ Authorized Domains.");
      } else {
        setErrorMsg(
          authErr?.message
            ? `${authErr.message} (${authErr.code || "auth-error"})`
            : "Failed to sign in with Google."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRedirectSignIn = async () => {
    if (!isFirebaseConfigured || !auth) {
      setErrorMsg("Firebase is not configured.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      console.error("Google Redirect Auth Error:", authErr);
      setErrorMsg(authErr?.message || "Failed to start redirect login.");
      setLoading(false);
    }
  };

  // ========================================================
  // FACEBOOK AUTHENTICATION (UNDER MAINTENANCE)
  // ========================================================
  const handleFacebookUnderMaintenance = () => {
    setErrorMsg("⚠️ Facebook Sign-In is temporarily under maintenance while Meta finishes app review. Please use Google or Email & Password to sign in.");
  };

  /*
  // Facebook Login code (Commented out during Meta Maintenance):
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
      const authErr = err as { code?: string; message?: string; customData?: { email?: string } };
      console.warn("Facebook Auth Note:", authErr?.code || authErr);

      if (authErr?.code === "auth/popup-blocked") {
        setIsPopupBlocked(true);
        setErrorMsg("Your browser blocked the popup. Click below to continue using full-page login:");
      } else if (authErr?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Facebook sign-in was cancelled before completion. Please try again.");
      } else if (authErr?.code === "auth/account-exists-with-different-credential") {
        const pendingCred =
          FacebookAuthProvider.credentialFromError(err as any) || (authErr as any)?.credential;
        const targetEmail = authErr?.customData?.email || (err as any)?.email;

        if (pendingCred && targetEmail) {
          setPendingCredential(pendingCred);
          setPendingEmail(targetEmail);
          setIsLinkingMode(true);
          setErrorMsg(null);
          setSuccessMsg("Account exists! Enter your password below to link Facebook permanently.");
        } else {
          setErrorMsg("An account already exists with this email. Please sign in with Email/Password to link Facebook.");
        }
      } else if (authErr?.code === "auth/operation-not-allowed") {
        setErrorMsg("Facebook login is not enabled in Firebase Console ➔ Authentication ➔ Sign-in method.");
      } else if (authErr?.code === "auth/unauthorized-domain") {
        setErrorMsg("Domain not authorized. Please add review-flash.vercel.app in Firebase Console ➔ Authentication ➔ Settings ➔ Authorized Domains.");
      } else {
        setErrorMsg(
          authErr?.message
            ? `${authErr.message} (${authErr.code || "auth-error"})`
            : "Failed to sign in with Facebook."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookRedirectSignIn = async () => {
    if (!isFirebaseConfigured || !auth) {
      setErrorMsg("Firebase is not configured.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithRedirect(auth, facebookProvider);
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      console.error("Facebook Redirect Auth Error:", authErr);
      setErrorMsg(authErr?.message || "Failed to start redirect login.");
      setLoading(false);
    }
  };
  */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md max-h-[92vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900/95 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl overflow-y-auto my-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            onClose();
            resetForm();
          }}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        {/* Brand / Title Header */}
        <div className="text-center mb-4 shrink-0">
          <div className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-cyan-500/40 p-1 shadow-xl shadow-cyan-500/20 overflow-hidden">
            <img
              src="/favicon.png"
              alt="ReviewFlash Logo"
              className="h-full w-full object-contain rounded-xl"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {isLinkingMode
              ? "Link Social Account"
              : tab === "signin"
              ? "Welcome Back"
              : "Create an Account"}
          </h2>

          <p className="mt-0.5 text-xs text-slate-400">
            {isLinkingMode
              ? `Connect your Facebook login to ${pendingEmail}`
              : tab === "signin"
              ? "Sign in to sync your study sets and collaborate across devices"
              : "Sign up to create, edit, and share flashcard decks"}
          </p>
        </div>

        {isLinkingMode ? (
          /* Account Linking Flow */
          <div className="space-y-3.5">
            <div className="rounded-2xl border border-blue-500/40 bg-blue-950/20 p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-300">
                <Link2 size={15} className="text-blue-400" />
                <span>Account Already Exists</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                An account with email <strong className="text-white font-mono">{pendingEmail}</strong> was created with a password. Enter your password once to link your Facebook account permanently!
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-200 animate-in fade-in">
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs text-emerald-200 animate-in fade-in">
                <Check size={14} className="shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleLinkAccount} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Account Password for {pendingEmail}
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showLinkPassword ? "text" : "password"}
                    required
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    placeholder="Enter existing account password"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-9 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLinkPassword(!showLinkPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showLinkPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Link Facebook &amp; Sign In</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLinkingMode(false);
                  setPendingCredential(null);
                  setPendingEmail("");
                  setErrorMsg(null);
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition py-0.5 cursor-pointer"
              >
                Cancel and return to standard sign-in
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="mb-4 flex rounded-2xl bg-slate-950 p-1 border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => handleSwitchTab("signin")}
                className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition cursor-pointer ${
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
                className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition cursor-pointer ${
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
              <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                  <span className="leading-snug">{errorMsg}</span>
                </div>
                {isPopupBlocked && (
                  <button
                    type="button"
                    onClick={handleGoogleRedirectSignIn}
                    disabled={loading}
                    className="mt-1 w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 py-2 px-3 text-xs font-bold text-white transition shadow-md cursor-pointer"
                  >
                    <Globe size={13} />
                    <span>Continue with Full-Page Google Login ➔</span>
                  </button>
                )}
              </div>
            )}

            {successMsg && (
              <div className="mb-3 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs text-emerald-200 animate-in fade-in">
                <Check size={14} className="shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Email & Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-2.5">
              {tab === "signup" && (
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">
                    Full Name / Username
                  </label>
                  <div className="relative">
                    <UserIcon
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Keith Man"
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tab === "signup" ? "At least 6 characters" : "••••••••"}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-9 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {tab === "signup" && (
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-300">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1.5 flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                ) : tab === "signin" ? (
                  <>
                    <LogIn size={14} />
                    <span>Sign In with Email</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-3.5 flex items-center gap-3 shrink-0">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Other methods
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* OAuth Buttons (Google & Facebook) */}
            <div className="space-y-2 shrink-0">
              {/* Google Sign In Button (Active) */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-950/80 hover:bg-slate-800/90 hover:border-cyan-500/50 px-3.5 py-2.5 text-xs font-semibold text-slate-100 hover:text-white transition cursor-pointer group shadow-sm active:scale-[0.985]"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                <span className="text-[10px] text-cyan-300 font-bold bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Instant
                </span>
              </button>

              {/* Facebook Under Maintenance Button */}
              <button
                type="button"
                onClick={handleFacebookUnderMaintenance}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-3.5 py-2 text-xs font-medium text-slate-400 hover:border-amber-500/40 hover:text-slate-300 transition cursor-pointer group"
              >
                <div className="flex items-center gap-2 opacity-60 group-hover:opacity-80">
                  <svg className="h-4 w-4 grayscale" viewBox="0 0 24 24">
                    <path
                      fill="#1877F2"
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                  <span>Continue with Facebook</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  <Wrench size={10} />
                  Maintenance
                </span>
              </button>
            </div>

            {/* Switch tab prompt */}
            <p className="mt-3.5 text-center text-xs text-slate-400 shrink-0">
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
          </>
        )}
      </div>
    </div>
  );
}
