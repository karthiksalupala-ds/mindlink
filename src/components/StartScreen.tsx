"use client";

import { useRef, useState } from "react";
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
  const [paperMode, setPaperMode] = useState(false);
  const [paperSearch, setPaperSearch] = useState("");
  const [papers, setPapers] = useState<{
    title: string;
    year: number | null;
    authors: string[];
    citations: number;
    url: string;
    openAccess: boolean;
    abstract: string;
  }[]>([]);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startSession, history } = useMindStore();

  const searchPapers = async () => {
    if (!paperSearch.trim()) return;
    const response = await fetch(`/api/papers?search=${encodeURIComponent(paperSearch.trim())}`);
    const data = await response.json();
    setPapers(data.papers || []);
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    if (file.type.startsWith("text/") || file.name.endsWith(".md")) {
      setQuestion(await file.text());
    } else {
      setQuestion(`Explain this research file in simple terms: ${file.name}`);
    }
  };

  const handleStart = (q?: string, m?: SessionMode) => {
    const final = (q || question).trim();
    if (!final) return;
    const selectedMode = m || mode;
    startSession(
      paperMode && selectedMode === "research"
        ? `[PAPER EXPLAINER]\n${final}`
        : final,
      selectedMode
    );
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
        {mode === "research" && (
          <div className="mb-3 flex items-center justify-between rounded-xl border border-teal-500/20 bg-teal-500/5 px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-teal-200">Research Studio</p>
              <p className="text-[11px] text-zinc-500">
                {paperMode ? "Turn a paper into a visual evidence map" : "Validate an idea with claims and evidence"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPaperMode((value) => !value)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                paperMode ? "bg-teal-600 text-white" : "border border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {paperMode ? "Paper mode" : "Idea mode"}
            </button>
          </div>
        )}
        {mode === "research" && paperMode && (
          <div className="mb-3 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex gap-2">
              <input
                value={paperSearch}
                onChange={(e) => setPaperSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") searchPapers(); }}
                placeholder="Find real papers on the web…"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-teal-500/50"
              />
              <button type="button" onClick={searchPapers} className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-500">
                Search
              </button>
            </div>
            {papers.length > 0 && (
              <div className="max-h-52 space-y-2 overflow-auto pr-1">
                {papers.map((paper) => (
                  <button
                    type="button"
                    key={paper.url + paper.title}
                    onClick={() => setQuestion(`${paper.title}\n${paper.abstract}\nSource: ${paper.url}`)}
                    className="w-full rounded-xl border border-white/5 bg-white/[0.03] p-2 text-left hover:border-teal-500/40 hover:bg-teal-500/5"
                  >
                    <p className="line-clamp-2 text-xs font-semibold text-zinc-200">{paper.title}</p>
                    <p className="mt-1 text-[10px] text-zinc-500">{paper.authors.join(", ")} · {paper.year || "n.d."} · {paper.citations} citations {paper.openAccess ? "· Open access" : ""}</p>
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-white/5 pt-2">
              <span className="truncate text-[11px] text-zinc-500">{fileName || "Add a paper, image, or notes file"}</span>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300 hover:bg-white/5">
                Add file
              </button>
            </div>
          </div>
        )}
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
            placeholder={
              mode === "research" && paperMode
                ? "Paste a paper abstract, passage, or research question…"
                : mode === "research"
                  ? "Describe your idea to validate (product, audience, problem)…"
                  : "What are you trying to decide or explore?"
            }
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
