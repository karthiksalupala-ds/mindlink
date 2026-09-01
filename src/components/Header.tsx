"use client";

import { Brain, Lock, RotateCcw, Sparkles, Maximize2, Swords } from "lucide-react";
import { useMindStore } from "@/lib/store";
import { useState } from "react";

export default function Header() {
  const {
    session,
    selectedId,
    isThinking,
    addThought,
    addConnection,
    setThinking,
    lockDecision,
    clearSession,
    getThought,
    startSession,
  } = useMindStore();
  const [showDecision, setShowDecision] = useState(false);
  const [decisionText, setDecisionText] = useState("");

  const selected = selectedId ? getThought(selectedId) : null;

  const handleExpand = async () => {
    if (!selected || isThinking) return;
    setThinking(true);
    try {
      const res = await fetch("/api/think", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `Expand deeper on this thought in context of "${session?.question}": ${selected.content}`,
          mode: "explore",
        }),
      });
      const data = await res.json();
      const thoughts = data.thoughts || [];
      for (const t of thoughts.slice(0, 3)) {
        const id = addThought(t.content, t.type || "insight", "ai", selected.x + 300, selected.y + 40);
        addConnection(selected.id, id);
      }
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
          question: `Give a strong counter-challenge to: ${selected.content}`,
          mode: "debate",
        }),
      });
      const data = await res.json();
      const t = (data.thoughts || [])[0];
      if (t) {
        const id = addThought(t.content, "challenge", "ai", selected.x - 300, selected.y + 30);
        addConnection(selected.id, id, "challenges");
      }
    } finally {
      setThinking(false);
    }
  };

  const handleDebate = () => {
    if (!session) return;
    startSession(session.question, "debate");
  };

  const handleLock = async () => {
    if (!session) return;
    setThinking(true);
    try {
      const res = await fetch("/api/think", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `Summarize a clear decision recommendation for: "${session.question}". Thoughts so far: ${session.thoughts.map((t) => t.content).join(" | ")}. Reply with one short paragraph only.`,
        }),
      });
      const data = await res.json();
      const summary =
        data.thoughts?.[0]?.content ||
        `Based on exploring "${session.question}", design a time-boxed experiment and review date rather than an irreversible leap.`;
      setDecisionText(summary);
      setShowDecision(true);
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/80 px-4 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-violet-500/30">
            <Brain size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">MindLink</h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Shared brain</p>
          </div>
        </div>

        {session && (
          <div className="hidden max-w-lg flex-1 items-center justify-center px-4 md:flex">
            <p className="truncate text-center text-sm text-zinc-600 dark:text-zinc-300">
              <span className="font-semibold text-zinc-900 dark:text-white">
                {session.mode === "debate" ? "Debate · " : "Exploring · "}
              </span>
              {session.question}
            </p>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {selected && (
            <>
              <button
                onClick={handleExpand}
                disabled={isThinking}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <Maximize2 size={13} /> Expand
              </button>
              <button
                onClick={handleChallenge}
                disabled={isThinking}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <Sparkles size={13} /> Challenge
              </button>
            </>
          )}

          {session && session.status !== "decided" && (
            <>
              <button
                onClick={handleDebate}
                disabled={isThinking}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              >
                <Swords size={13} /> Debate
              </button>
              <button
                onClick={handleLock}
                disabled={isThinking || session.thoughts.length < 2}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-500/25 transition hover:opacity-90 disabled:opacity-50"
              >
                <Lock size={13} /> Lock
              </button>
            </>
          )}

          {session && (
            <button
              onClick={clearSession}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <RotateCcw size={13} /> New
            </button>
          )}
        </div>
      </header>

      {showDecision && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-1 text-lg font-bold text-zinc-900 dark:text-white">Lock this decision?</h2>
            <p className="mb-4 text-sm text-zinc-500">Edit the summary, then confirm.</p>
            <textarea
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              rows={5}
              className="mb-4 w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDecision(false)}
                className="rounded-xl px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  lockDecision(decisionText);
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
