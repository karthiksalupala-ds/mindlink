"use client";

import { Brain, Lock, RotateCcw, Sparkles, Maximize2, Swords, GitBranch, History, Users } from "lucide-react";
import { useMindStore } from "@/lib/store";
import { ROLES, type RoleId } from "@/lib/types";
import { useState } from "react";

export default function Header() {
  const {
    session,
    selectedId,
    isThinking,
    history,
    addThought,
    addConnection,
    setThinking,
    lockDecision,
    clearSession,
    getThought,
    startSession,
    clearHistory,
  } = useMindStore();
  const [showDecision, setShowDecision] = useState(false);
  const [decisionText, setDecisionText] = useState("");
  const [showRoles, setShowRoles] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [outcomes, setOutcomes] = useState<
    { label: string; title: string; content: string }[] | null
  >(null);

  const selected = selectedId ? getThought(selectedId) : null;

  const handleExpand = async () => {
    if (!selected || isThinking) return;
    setThinking(true);
    try {
      const res = await fetch("/api/think", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `Expand deeper on: ${selected.content}. Context: ${session?.question}`,
          mode: "explore",
        }),
      });
      const data = await res.json();
      for (const t of (data.thoughts || []).slice(0, 3)) {
        const id = addThought(t.content, t.type || "insight", "ai", selected.x + 280, selected.y + 30);
        addConnection(selected.id, id);
      }
    } catch {
      addThought("Expand failed — try again.", "challenge", "ai");
    } finally {
      setThinking(false);
    }
  };

  const handleChallenge = async () => {
    if (!selected || isThinking) return;
    setThinking(true);
    try {
      const res = await fetch("/api/think", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `Strong counter-challenge to: ${selected.content}`,
          mode: "debate",
        }),
      });
      const data = await res.json();
      const t = (data.thoughts || [])[0];
      if (t) {
        const id = addThought(t.content, "challenge", "ai", selected.x - 280, selected.y + 20);
        addConnection(selected.id, id, "challenges");
      }
    } catch {
      addThought("Challenge failed — try again.", "challenge", "ai");
    } finally {
      setThinking(false);
    }
  };

  const summonRole = async (roleId: RoleId) => {
    if (!session || isThinking) return;
    setShowRoles(false);
    setThinking(true);
    try {
      const res = await fetch("/api/think", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: session.question,
          role: roleId,
        }),
      });
      const data = await res.json();
      const roleMeta = ROLES.find((r) => r.id === roleId);
      for (const t of (data.thoughts || []).slice(0, 4)) {
        addThought(t.content, "role", "ai", undefined, undefined, undefined, {
          role: roleId,
        });
      }
      if (!(data.thoughts || []).length) {
        addThought(
          `${roleMeta?.label || "Role"}: focus on what you can reverse in 30 days.`,
          "role",
          "ai",
          undefined,
          undefined,
          undefined,
          { role: roleId }
        );
      }
    } catch {
      addThought("Role summon failed.", "challenge", "ai");
    } finally {
      setThinking(false);
    }
  };

  const handleLock = async () => {
    if (!session) return;
    setThinking(true);
    setOutcomes(null);
    try {
      const [sumRes, outRes] = await Promise.all([
        fetch("/api/think", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: `One short decision recommendation for: "${session.question}". Thoughts: ${session.thoughts
              .map((t) => t.content)
              .slice(0, 8)
              .join(" | ")}`,
          }),
        }),
        fetch("/api/think", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: `Decision context: ${session.question}. Current lean: ${session.thoughts
              .map((t) => t.content)
              .slice(0, 6)
              .join(" | ")}`,
            action: "outcomes",
          }),
        }),
      ]);
      const sumData = await sumRes.json();
      const outData = await outRes.json();
      setDecisionText(
        sumData.thoughts?.[0]?.content ||
          `For "${session.question}", run a time-boxed experiment before an irreversible leap.`
      );
      setOutcomes(outData.outcomes || null);
      setShowDecision(true);
    } catch {
      setDecisionText(`For "${session.question}", define a 2-week test with a clear kill switch.`);
      setShowDecision(true);
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      <header className="relative z-50 flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-[#0a0a12]/85 px-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-violet-500/30">
            <Brain size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">MindLink</h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Shared brain</p>
          </div>
        </div>

        {session && (
          <div className="hidden max-w-md flex-1 px-3 md:block">
            <p className="truncate text-center text-sm text-zinc-400">
              <span className="font-semibold text-zinc-200">
                {session.mode === "debate"
                  ? "Debate · "
                  : session.mode === "parallel"
                    ? "Parallel · "
                    : session.mode === "research"
                      ? "Research · "
                      : "Exploring · "}
              </span>
              {session.question}
            </p>
          </div>
        )}

        <div className="flex items-center gap-1">
          {selected && (
            <>
              <button
                onClick={handleExpand}
                disabled={isThinking}
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/10 disabled:opacity-50"
              >
                <Maximize2 size={12} /> Expand
              </button>
              <button
                onClick={handleChallenge}
                disabled={isThinking}
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/10 disabled:opacity-50"
              >
                <Sparkles size={12} /> Challenge
              </button>
            </>
          )}

          {session && session.status !== "decided" && (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowRoles((v) => !v)}
                  disabled={isThinking}
                  className="flex items-center gap-1 rounded-xl border border-violet-500/30 bg-violet-500/10 px-2 py-1.5 text-xs text-violet-200 hover:bg-violet-500/20 disabled:opacity-50"
                >
                  <Users size={12} /> Roles
                </button>
                {showRoles && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#12121a] shadow-2xl">
                    {ROLES.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => summonRole(r.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/5"
                      >
                        <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => session && startSession(session.question, "debate")}
                disabled={isThinking}
                className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <Swords size={12} /> Debate
              </button>
              <button
                onClick={() => session && startSession(session.question, "parallel")}
                disabled={isThinking}
                className="flex items-center gap-1 rounded-xl border border-sky-500/30 bg-sky-500/10 px-2 py-1.5 text-xs text-sky-300 hover:bg-sky-500/20 disabled:opacity-50"
              >
                <GitBranch size={12} /> Parallel
              </button>
              <button
                onClick={handleLock}
                disabled={isThinking || session.thoughts.length < 2}
                className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-500/25 disabled:opacity-50"
              >
                <Lock size={12} /> Lock
              </button>
            </>
          )}

          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1 rounded-xl border border-white/10 px-2 py-1.5 text-xs text-zinc-400 hover:bg-white/5"
          >
            <History size={12} />
            {history.length > 0 ? history.length : ""}
          </button>

          {session && (
            <button
              onClick={clearSession}
              className="flex items-center gap-1 rounded-xl border border-white/10 px-2 py-1.5 text-xs text-zinc-500 hover:bg-white/5"
            >
              <RotateCcw size={12} /> New
            </button>
          )}
        </div>

        {showHistory && (
          <div className="absolute right-3 top-14 z-50 w-80 max-h-80 overflow-auto rounded-2xl border border-white/10 bg-[#12121a] p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-300">Decision memory</p>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-[10px] text-zinc-500 hover:text-zinc-300">
                  Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-zinc-500">No locked decisions yet.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="rounded-xl border border-white/5 bg-white/5 p-2">
                    <p className="text-[11px] font-medium text-zinc-200">{h.question}</p>
                    <p className="mt-1 text-[11px] text-zinc-400 line-clamp-2">{h.decision}</p>
                    <p className="mt-1 text-[10px] text-zinc-600">
                      {new Date(h.createdAt).toLocaleDateString()} · {h.mode}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </header>

      {showDecision && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-bold text-white">Lock this decision?</h2>
            <p className="mb-3 text-sm text-zinc-500">Edit summary, review outcomes, then confirm.</p>
            <textarea
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              rows={4}
              className="mb-3 w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-zinc-200 outline-none focus:border-violet-500/50"
            />
            {outcomes && outcomes.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Outcomes</p>
                {outcomes.map((o) => (
                  <div
                    key={o.label}
                    className={`rounded-xl border p-2.5 text-xs ${
                      o.label === "best"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                        : o.label === "worst"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-100"
                    }`}
                  >
                    <p className="font-semibold">{o.title}</p>
                    <p className="mt-0.5 opacity-90">{o.content}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDecision(false)}
                className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  lockDecision(
                    decisionText,
                    outcomes?.map((o) => ({
                      label: o.label as "best" | "likely" | "worst",
                      title: o.title,
                      content: o.content,
                    }))
                  );
                  setShowDecision(false);
                }}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Lock Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
