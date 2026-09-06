"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";

export type ConfirmVariant = "danger" | "warning" | "question" | "info";

export interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: LucideIcon;
  isDestructive?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmPromptProvider");
  }
  return context;
}

export function ConfirmPromptProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    setIsVisible(false);
    setTimeout(() => {
      setIsOpen(false);
      setIsRendered(false);
      if (resolverRef.current) {
        resolverRef.current(result);
        resolverRef.current = null;
      }
      setOptions(null);
    }, 200);
  }, []);

  // Manage open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const frame = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [isOpen]);

  // Keyboard navigation: Enter to confirm, Escape to cancel
  useEffect(() => {
    if (!isOpen) return;

    // Focus confirm button for convenience
    const timer = setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose(false);
      } else if (e.key === "Enter" && !e.shiftKey) {
        // Prevent accidental triggers if active element is a button (so it doesn't double-trigger)
        if (
          document.activeElement &&
          document.activeElement.tagName === "BUTTON" &&
          document.activeElement !== confirmButtonRef.current
        ) {
          return;
        }
        e.preventDefault();
        handleClose(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  const variant = options?.variant || "question";
  const isDestructive = options?.isDestructive ?? variant === "danger";

  // Variant themes
  const theme = {
    danger: {
      accentBorder: "border-rose-500/40",
      glowBg: "rgba(244, 63, 94, 0.15)",
      badgeBg: "bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-rose-950/50",
      topBeam: "from-rose-500 via-pink-500 to-amber-500",
      confirmBtn:
        "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/60 hover:shadow-rose-600/30 border-rose-500/30",
      defaultIcon: Trash2,
      defaultConfirmText: "Yes, Delete",
      defaultCancelText: "Cancel",
    },
    warning: {
      accentBorder: "border-amber-500/40",
      glowBg: "rgba(245, 158, 11, 0.15)",
      badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-amber-950/50",
      topBeam: "from-amber-500 via-orange-500 to-yellow-500",
      confirmBtn:
        "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-950/60 hover:shadow-amber-600/30 border-amber-500/30",
      defaultIcon: AlertTriangle,
      defaultConfirmText: "Yes, Proceed",
      defaultCancelText: "Cancel",
    },
    question: {
      accentBorder: "border-cyan-500/40",
      glowBg: "rgba(6, 182, 212, 0.15)",
      badgeBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-cyan-950/50",
      topBeam: "from-cyan-500 via-blue-500 to-indigo-500",
      confirmBtn:
        "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-950/60 hover:shadow-cyan-600/30 border-cyan-500/30",
      defaultIcon: HelpCircle,
      defaultConfirmText: "Yes, Continue",
      defaultCancelText: "Cancel",
    },
    info: {
      accentBorder: "border-emerald-500/40",
      glowBg: "rgba(16, 185, 129, 0.15)",
      badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-emerald-950/50",
      topBeam: "from-emerald-500 via-teal-500 to-cyan-500",
      confirmBtn:
        "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/60 hover:shadow-emerald-600/30 border-emerald-500/30",
      defaultIcon: CheckCircle2,
      defaultConfirmText: "OK",
      defaultCancelText: "Close",
    },
  }[variant];

  const IconComponent = options?.icon || theme.defaultIcon;
  const confirmText =
    options?.confirmText || theme.defaultConfirmText;
  const cancelText = options?.cancelText || theme.defaultCancelText;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {isRendered && options && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${
            isVisible
              ? "opacity-100 backdrop-blur-md bg-slate-950/75"
              : "opacity-0 pointer-events-none bg-slate-950/0"
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose(false);
            }
          }}
        >
          {/* Modal Container with spring blossom animation */}
          <div
            style={{
              transition:
                "transform 380ms cubic-bezier(0.34, 1.3, 0.64, 1), opacity 260ms ease",
              transform: isVisible ? "scale(1) translateY(0)" : "scale(0.88) translateY(12px)",
              opacity: isVisible ? 1 : 0,
            }}
            className={`relative w-full max-w-md rounded-2xl bg-slate-900/95 border ${theme.accentBorder} shadow-2xl shadow-slate-950/80 overflow-hidden backdrop-blur-xl`}
          >
            {/* Top decorative gradient beam */}
            <div
              className={`h-1.5 w-full bg-gradient-to-r ${theme.topBeam} animate-pulse`}
            />

            {/* Background Glow Orb */}
            <div
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-40"
              style={{ backgroundColor: theme.glowBg }}
            />

            {/* Close button */}
            <button
              onClick={() => handleClose(false)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <X size={18} />
            </button>

            {/* Content Area */}
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                {/* Icon Badge */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-lg ${theme.badgeBg}`}
                >
                  <IconComponent size={24} className="animate-pulse" />
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    id="confirm-dialog-title"
                    className="text-lg font-bold text-white tracking-tight"
                  >
                    {options.title}
                  </h3>
                  <div
                    id="confirm-dialog-desc"
                    className="mt-2 text-sm leading-relaxed text-slate-300 font-normal"
                  >
                    {options.message}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-7 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-medium text-sm transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  {cancelText}
                </button>

                <button
                  ref={confirmButtonRef}
                  type="button"
                  onClick={() => handleClose(true)}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl border font-semibold text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    isDestructive
                      ? "focus:ring-rose-500"
                      : "focus:ring-cyan-500"
                  } ${theme.confirmBtn}`}
                >
                  {confirmText}
                </button>
              </div>

              {/* Keyboard helper hint */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 px-1 select-none">
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[10px]">Enter</kbd> to confirm</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[10px]">Esc</kbd> to cancel</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
