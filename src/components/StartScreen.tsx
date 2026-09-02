"use client";

import { useState } from "react";
import { Brain, ArrowRight, Sparkles, Swords, GitBranch, BookOpen } from "lucide-react";
import { useMindStore } from "@/lib/store";
import NetworkBackground from "./NetworkBackground";
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
  const { startSession, history } = useMindStore();

  const handleStart = (q?: string, m?: SessionMode) => {
    const final = (q || question).trim();
    if (!final) return;
    startSession(final, m || mode);
  };

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-[#07070c] px-4 py-16">
      <NetworkBackground intensity={0.85} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.18),transparent_60%)]" />

      <div className="relative z-10 mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-[0_0_40px_rgba(139,92,246,0.5)]">
        <Brain size={32} />
      </div>

      <h1 className="relative z-10 mb-2 text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
        MindLink
      </h1>
      <p className="relative z-10 mb-8 max-w-md text-center text-base text-zinc-400">
        Think with AI on a shared mind canvas.
        <br />
        <span className="text-sm text-zinc-500">
          Explore · Debate · Parallel · Research · Roles
        </span>
      </p>

      <div className="relative z-10 mb-5 flex flex-wrap justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-md">
        {(
          [
            { id: "explore" as const, label: "Explore", icon: Sparkles },
            { id: "debate" as const, label: "Debate", icon: Swords },
            { id: "parallel" as const, label: "Parallel", icon: GitBranch },
            { id: "research" as const, label: "Research", icon: BookOpen },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
              mode === id
                ? id === "debate"
                  ? "bg-emerald-600 text-white shadow-lg"
                  : id === "parallel"
                    ? "bg-sky-600 text-white shadow-lg"
                    : id === "research"
                      ? "bg-teal-600 text-white shadow-lg"
                      : "bg-violet-600 text-white shadow-lg"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
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
            placeholder={mode === "research" ? "Describe your idea to validate (product, audience, problem)…" : "What are you trying to decide or explore?"}
            rows={3}
            className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 pr-14 text-base text-white shadow-2xl outline-none backdrop-blur-md transition placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/20"
          />
          <button
            onClick={() => handleStart()}
            disabled={!question.trim()}
            className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/40 transition hover:scale-105 disabled:opacity-40"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => handleStart(ex)}
              className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-zinc-400 backdrop-blur transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-200"
            >
              {ex}
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <p className="mt-6 text-center text-xs text-zinc-600">
            {history.length} decision{history.length > 1 ? "s" : ""} in memory · resume via History after a session
          </p>
        )}
      </div>
    </div>
  );
}
