"use client";

import { useState } from "react";
import { Brain, ArrowRight, Sparkles, Swords } from "lucide-react";
import { useMindStore } from "@/lib/store";
import type { SessionMode } from "@/lib/types";

const EXAMPLES = [
  "Should I quit my job and start a startup?",
  "What should I prioritize in the next 90 days?",
  "Is this the right time to launch my product?",
  "How do I decide between two career paths?",
];

export default function StartScreen() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<SessionMode>("explore");
  const { startSession } = useMindStore();

  const handleStart = (q?: string, m?: SessionMode) => {
    const final = (q || question).trim();
    if (!final) return;
    startSession(final, m || mode);
  };

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-600/15" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative z-10 mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-2xl shadow-violet-500/40">
        <Brain size={32} />
      </div>

      <h1 className="relative z-10 mb-2 text-center text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
        MindLink
      </h1>
      <p className="relative z-10 mb-8 max-w-md text-center text-base text-zinc-500 dark:text-zinc-400">
        Think together with AI on a shared mind canvas.
        <br />
        <span className="text-sm text-zinc-400">Explore · Debate · Decide — with voice & visuals</span>
      </p>

      {/* Mode toggle */}
      <div className="relative z-10 mb-5 flex gap-2 rounded-2xl border border-zinc-200 bg-white/80 p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80">
        <button
          onClick={() => setMode("explore")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === "explore"
              ? "bg-violet-600 text-white shadow"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          <Sparkles size={14} /> Explore
        </button>
        <button
          onClick={() => setMode("debate")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === "debate"
              ? "bg-emerald-600 text-white shadow"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          <Swords size={14} /> Debate
        </button>
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleStart();
              }
            }}
            placeholder="What are you trying to decide or explore?"
            rows={3}
            className="w-full resize-none rounded-2xl border border-zinc-200 bg-white/90 px-5 py-4 pr-14 text-base shadow-lg outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-white"
          />
          <button
            onClick={() => handleStart()}
            disabled={!question.trim()}
            className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 transition hover:scale-105 disabled:opacity-40"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => handleStart(ex)}
              className="rounded-full border border-zinc-200 bg-white/80 px-3.5 py-1.5 text-xs text-zinc-600 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-violet-600"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-14 flex items-center gap-2 text-xs text-zinc-400">
        <Sparkles size={12} />
        <span>WebMCP · Groq · Voice · Images</span>
      </div>
    </div>
  );
}
