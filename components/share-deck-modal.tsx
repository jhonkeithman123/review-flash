"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  Lock,
  Plus,
  Share2,
  Shield,
  Trash2,
  Unlock,
  Users,
  X,
} from "lucide-react";
import { AuthorizedCollaborator, Deck, DeckPermissionRole } from "@/types/flashcard";
import { shareDeck, updateDeck } from "@/lib/flashcardService";

interface ShareDeckModalProps {
  deck: Deck;
  isOpen: boolean;
  onClose: () => void;
  onDeckUpdated?: (updated: Deck) => void;
}

export function ShareDeckModal({ deck, isOpen, onClose, onDeckUpdated }: ShareDeckModalProps) {
  const [activeTab, setActiveTab] = useState<"link" | "permissions">("link");
  const [shareData, setShareData] = useState<{
    shareCode: string;
    shareUrl: string;
    shareToken: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permission settings state
  const [defaultRole, setDefaultRole] = useState<DeckPermissionRole>(
    deck.accessControl?.defaultRole || "viewer"
  );
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedCollaborator[]>(
    deck.accessControl?.authorizedUsers || []
  );
  const [newUserInput, setNewUserInput] = useState("");
  const [newUserRole, setNewUserRole] = useState<DeckPermissionRole>("editor");
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permSuccess, setPermSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGenerateShare = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await shareDeck(deck.id);
      setShareData(res);
    } catch (e: unknown) {
      console.error(e);
      setError("Failed to create share link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!shareData && !loading && !error) {
    void handleGenerateShare();
  }

  const handleCopyLink = async () => {
    if (!shareData?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareData.shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyCode = async () => {
    if (!shareData?.shareCode) return;
    try {
      await navigator.clipboard.writeText(shareData.shareCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(deck, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${deck.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-deck.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    const id = newUserInput.trim();
    if (!id) return;
    if (authorizedUsers.some((u) => u.identifier.toLowerCase() === id.toLowerCase())) {
      return;
    }
    setAuthorizedUsers((prev) => [...prev, { identifier: id, role: newUserRole }]);
    setNewUserInput("");
  };

  const handleRemoveCollaborator = (identifier: string) => {
    setAuthorizedUsers((prev) => prev.filter((u) => u.identifier !== identifier));
  };

  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    try {
      const updated: Deck = {
        ...deck,
        accessControl: {
          defaultRole,
          visibility: "unlisted",
          authorizedUsers,
        },
      };
      const saved = await updateDeck(updated);
      setPermSuccess(true);
      if (onDeckUpdated) onDeckUpdated(saved);
      setTimeout(() => setPermSuccess(false), 2000);
    } catch (e) {
      console.error("Failed to save permissions", e);
    } finally {
      setSavingPermissions(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-cyan-950/30 animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-500" />

        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-cyan-300">
              <Share2 size={20} />
              <h2 className="text-lg font-bold text-white">Share &amp; Permissions</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex gap-2 border-b border-slate-800 pt-3 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("link")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === "link"
                  ? "bg-cyan-500 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Share2 size={13} />
              Share Link &amp; Code
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("permissions")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === "permissions"
                  ? "bg-cyan-500 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield size={13} />
              Access &amp; Edit Permissions
            </button>
          </div>

          {/* TAB 1: SHARE LINK & CODE */}
          {activeTab === "link" && (
            <div className="mt-4 space-y-4">
              {/* Deck Summary Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-100 text-sm">{deck.title}</h3>
                    {deck.description && (
                      <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{deck.description}</p>
                    )}
                  </div>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300">
                    {deck.cards.length} cards
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Shield size={12} className="text-cyan-400" />
                  <span>
                    Permission:{" "}
                    <strong className="text-slate-200">
                      {defaultRole === "viewer" ? "🔒 Read-Only for Others" : "✏️ Anyone with link can edit"}
                    </strong>
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                  <p className="text-sm">Creating instant share link…</p>
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
                  {error}
                  <button
                    type="button"
                    onClick={handleGenerateShare}
                    className="mt-2 block font-semibold underline"
                  >
                    Retry
                  </button>
                </div>
              ) : shareData ? (
                <>
                  {/* Share Code Pill */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Deck Share Code
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 font-mono text-base font-bold tracking-widest text-cyan-300">
                        {shareData.shareCode}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 rounded-2xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer"
                      >
                        {copiedCode ? (
                          <>
                            <Check size={15} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={15} />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Share Web Link */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Universal Direct Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareData.shareUrl}
                        className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-300 transition cursor-pointer"
                      >
                        {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copiedLink ? "Copied Link" : "Copy Link"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={handleExportJSON}
                      className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition underline cursor-pointer"
                    >
                      <Download size={13} />
                      Export JSON Backup
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* TAB 2: ACCESS & EDIT PERMISSIONS */}
          {activeTab === "permissions" && (
            <div className="mt-4 space-y-4">
              {/* Default Role Toggle */}
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Default Role for Other Users
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDefaultRole("viewer")}
                    className={`rounded-2xl border p-3 text-left transition cursor-pointer ${
                      defaultRole === "viewer"
                        ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Lock size={14} className="text-cyan-400" />
                      Read-Only (Recommended)
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 leading-tight">
                      Others can study, test, and preview the deck, but cannot edit the original.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDefaultRole("editor")}
                    className={`rounded-2xl border p-3 text-left transition cursor-pointer ${
                      defaultRole === "editor"
                        ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-200"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Unlock size={14} className="text-indigo-400" />
                      Public Collaboration
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 leading-tight">
                      Anyone with the share code or link can edit and save changes to the deck.
                    </p>
                  </button>
                </div>
              </div>

              {/* Authorized Collaborators Section */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="flex items-center gap-1 text-xs font-bold text-slate-200 uppercase tracking-wider">
                    <Users size={14} className="text-cyan-400" />
                    Authorized Editors &amp; Members
                  </label>
                  <span className="text-[10px] text-slate-500">Only authorized users can edit when Read-Only</span>
                </div>

                <form onSubmit={handleAddCollaborator} className="flex gap-2">
                  <input
                    type="text"
                    value={newUserInput}
                    onChange={(e) => setNewUserInput(e.target.value)}
                    placeholder="Enter user email or ID (e.g. user@gmail.com)"
                    className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                  />
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as DeckPermissionRole)}
                    className="rounded-2xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-slate-200"
                  >
                    <option value="editor">Editor (Can Edit)</option>
                    <option value="viewer">Viewer (Read-Only)</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!newUserInput.trim()}
                    className="rounded-2xl bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus size={15} />
                  </button>
                </form>

                {/* List of Collaborators */}
                <div className="mt-3 max-h-32 overflow-y-auto space-y-1.5 pr-1">
                  {authorizedUsers.length === 0 ? (
                    <p className="text-center py-2 text-[11px] text-slate-500">
                      No specific users added. (Default role applies to all).
                    </p>
                  ) : (
                    authorizedUsers.map((collab) => (
                      <div
                        key={collab.identifier}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">{collab.identifier}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              collab.role === "editor"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {collab.role === "editor" ? "Editor" : "Viewer"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCollaborator(collab.identifier)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Save Permissions Button */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                {permSuccess ? (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Check size={14} />
                    Permissions saved!
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Owner always retains full control</span>
                )}

                <button
                  type="button"
                  disabled={savingPermissions}
                  onClick={handleSavePermissions}
                  className="rounded-full bg-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 cursor-pointer"
                >
                  {savingPermissions ? "Saving..." : "Save Permissions"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
