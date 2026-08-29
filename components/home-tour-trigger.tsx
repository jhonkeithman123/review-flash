"use client";

import { GraduationCap } from "lucide-react";

export function HomeTourTrigger() {
  const handleOpenTour = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-reviewflash-tour"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpenTour}
      className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-5 py-3.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20 hover:border-cyan-400 cursor-pointer shadow-sm"
    >
      <GraduationCap size={18} className="text-cyan-400" />
      <span>Interactive Tour 🎓</span>
    </button>
  );
}
