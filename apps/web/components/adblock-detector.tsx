"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, X, ChevronRight, Check } from "lucide-react";

export function AdblockDetector() {
  const [isDetected, setIsDetected] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // Default true until checked
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Don't show if user already dismissed in this session
    if (sessionStorage.getItem("rf_adblock_dismissed") === "true") {
      return;
    }

    let isBlocked = false;

    // Test 1: DOM Bait Detection (checks for CSS hiding rules)
    const bait = document.createElement("div");
    bait.className = "adsbox pub_300x250 pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links";
    bait.style.position = "absolute";
    bait.style.left = "-9999px";
    bait.style.top = "-9999px";
    bait.style.width = "1px";
    bait.style.height = "1px";
    bait.setAttribute("aria-hidden", "true");

    try {
      document.body.appendChild(bait);
      const computed = window.getComputedStyle(bait);
      if (
        computed.display === "none" ||
        computed.visibility === "hidden" ||
        bait.offsetParent === null ||
        bait.offsetHeight === 0
      ) {
        isBlocked = true;
      }
    } catch {
      // ignore
    } finally {
      if (bait.parentNode) {
        bait.parentNode.removeChild(bait);
      }
    }

    // Test 2: Network probe to a common ad-script path that privacy filters block
    const testNetworkProbe = async () => {
      try {
        await fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-store",
        });
      } catch {
        isBlocked = true;
      }

      if (isBlocked) {
        setIsDetected(true);
        setIsDismissed(false);
      }
    };

    // Delay test slightly so initial render finishes without any blocking
    const timer = setTimeout(() => {
      testNetworkProbe();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem("rf_adblock_dismissed", "true");
    } catch {
      // ignore
    }
  };

  if (!isDetected || isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Ad Blocker Notice"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-96 rounded-2xl border border-amber-500/40 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
          <ShieldAlert size={17} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Ad Blocker Active</span>
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-amber-300">
                Notice
              </span>
            </h4>
            <button
              type="button"
              onClick={handleDismiss}
              title="Dismiss notification"
              className="text-slate-400 hover:text-white transition cursor-pointer p-0.5 rounded-lg hover:bg-slate-800"
            >
              <X size={15} />
            </button>
          </div>

          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
            Ad blockers (like uBlock or Brave) may block <strong>login popups</strong> or{" "}
            <strong>study audio streams</strong>.
          </p>

          {showTips ? (
            <div className="mt-2 space-y-1.5 rounded-xl bg-slate-950/80 p-2.5 text-[11px] text-slate-300 border border-slate-800">
              <p className="font-semibold text-amber-300 flex items-center gap-1">
                <Check size={12} /> Easy Fix:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>Click your ad blocker extension icon</li>
                <li>Toggle &quot;Pause on this site&quot; for ReviewFlash</li>
                <li>Or use <em>Full-Page Login</em> when signing in</li>
              </ul>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTips(true)}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>How to pause</span>
                <ChevronRight size={12} />
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
