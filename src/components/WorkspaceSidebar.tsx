"use client";

import { useRef, useState } from "react";
import { BookOpen, FilePlus2, Headphones, ImagePlus, Lightbulb, Map, PanelLeftClose, Search, Sparkles } from "lucide-react";
import { useMindStore } from "@/lib/store";

interface PaperResult {
  title: string;
  year: number | null;
  authors: string[];
  citations: number;
  url: string;
  openAccess: boolean;
  abstract: string;
}

export default function WorkspaceSidebar({ onClose }: { onClose: () => void }) {
  const { session, selectedId, getThought, addThought, addConnection, setThinking, isThinking } = useMindStore();
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState<PaperResult[]>([]);
  const [message, setMessage] = useState("Your research desk is ready.");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selected = selectedId ? getThought(selectedId) : undefined;

  if (!session) return null;

  const runThinking = async (label: string, task: () => Promise<void>) => {
    if (isThinking) return;
    setMessage(label);
    setThinking(true);
    try {
      await task();
      setMessage("Added to your connected workspace.");
    } catch {
      setMessage("That action needs another try.");
    } finally {
      setThinking(false);
    }
  };

  const searchPapers = async () => {
    if (!query.trim() || isThinking) return;
    await runThinking("Searching OpenAlex for related papers…", async () => {
      const response = await fetch(`/api/papers?search=${encodeURIComponent(query.trim())}`);
      const data = await response.json();
      setPapers(data.papers || []);
    });
  };

  const addPaper = (paper: PaperResult) => {
    const id = addThought(
      `${paper.title}${paper.abstract ? `\n\n${paper.abstract.slice(0, 420)}` : ""}`,
      "evidence",
      "ai",
      undefined,
      undefined,
      undefined,
      { sourceLabel: "OpenAlex", sourceUrl: paper.url, trust: "high" }
    );
    if (selected) addConnection(selected.id, id, "related paper");
    setMessage("Paper added to the canvas.");
  };

  const explainSelected = () => {
    if (!selected) return;
    runThinking("Translating the evidence into plain language…", async () => {
      const response = await fetch("/api/think", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `Explain this research idea simply, define technical terms, and state what is uncertain: ${selected.content}`,
          mode: "research",
        }),
      });
      const data = await response.json();
      const thought = data.thoughts?.[0];
      if (thought) {
        const id = addThought(thought.content, "insight", "ai", selected.x + 300, selected.y + 20, undefined, {
          sourceLabel: "Plain-language explanation",
          trust: "unverified",
        });
        addConnection(selected.id, id, "explains");
      }
    });
  };

  const makeStoryMap = () => {
    runThinking("Shaping the research into a visual story…", async () => {
      const response = await fetch("/api/think", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `Create a simple story arc for this research workspace: ${session.question}. Return five short beats: problem, method, discovery, limitation, next question.`,
          mode: "research",
        }),
      });
      const data = await response.json();
      let previousId: string | undefined;
      for (const thought of (data.thoughts || []).slice(0, 5)) {
        const id = addThought(thought.content, thought.type || "insight", "ai", undefined, undefined, undefined, {
          sourceLabel: "Research story",
          trust: "unverified",
        });
        if (previousId) addConnection(previousId, id, "next");
        previousId = id;
      }
    });
  };

  const playAudio = async () => {
    await runThinking("Preparing your audio brief…", async () => {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${session.question}. ${selected?.content || "Here is the current research map."}` }),
      });
      if (!response.headers.get("content-type")?.includes("audio")) return;
      const audio = new Audio(URL.createObjectURL(await response.blob()));
      audio.onended = () => URL.revokeObjectURL(audio.src);
      await audio.play();
    });
  };

  const addFile = async (file: File) => {
    if (file.type.startsWith("text/") || file.name.endsWith(".md")) {
      addThought(await file.text(), "evidence", "human", undefined, undefined, undefined, {
        sourceLabel: file.name,
        trust: "unverified",
      });
    } else if (file.type.startsWith("image/")) {
      addThought(`Image note: ${file.name}`, "data", "human", undefined, undefined, URL.createObjectURL(file), {
        sourceLabel: file.name,
        trust: "unverified",
      });
    } else {
      addThought(`Paper file added: ${file.name}. Extract text and verify the source before relying on it.`, "question", "human", undefined, undefined, undefined, {
        sourceLabel: file.name,
        trust: "unverified",
      });
    }
    setMessage(`${file.name} added to the canvas.`);
  };

  return (
    <aside className="relative z-20 flex w-full shrink-0 flex-col border-r border-white/10 bg-[#0b0b12]/95 backdrop-blur-xl md:w-72">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-teal-300">
            <BookOpen size={16} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Research desk</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close research desk" title="Close research desk" className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/10 hover:text-white">
            <PanelLeftClose size={15} />
          </button>
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">{session.question.replace(/^\[PAPER EXPLAINER\]\s*/i, "")}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <section className="rounded-2xl border border-teal-500/20 bg-teal-500/[0.06] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-zinc-200"><Search size={13} className="text-teal-300" /> Find papers</div>
          <div className="flex gap-1.5">
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") searchPapers(); }} placeholder="Topic or question" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-teal-500/50" />
            <button type="button" onClick={searchPapers} disabled={isThinking} aria-label="Search papers" className="rounded-lg bg-teal-600 px-2.5 text-white hover:bg-teal-500 disabled:opacity-50"><Search size={13} /></button>
          </div>
          {papers.length > 0 && <div className="mt-2 space-y-1.5">{papers.slice(0, 4).map((paper) => <button type="button" key={paper.url + paper.title} onClick={() => addPaper(paper)} className="w-full rounded-lg border border-white/5 p-2 text-left hover:border-teal-500/40"><span className="line-clamp-2 block text-[11px] font-medium text-zinc-200">{paper.title}</span><span className="mt-1 block text-[10px] text-zinc-500">{paper.year || "n.d."} · {paper.citations} citations</span></button>)}</div>}
        </section>

        <section className="space-y-1.5">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Make meaning</p>
          <button type="button" onClick={explainSelected} disabled={!selected || isThinking} className="flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-left text-xs text-zinc-300 hover:border-violet-500/40 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-40"><Lightbulb size={14} className="text-violet-300" /> Explain selected simply</button>
          <button type="button" onClick={makeStoryMap} disabled={isThinking} className="flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-left text-xs text-zinc-300 hover:border-pink-500/40 hover:bg-pink-500/10 disabled:opacity-40"><Map size={14} className="text-pink-300" /> Build research story map</button>
          <button type="button" onClick={playAudio} disabled={isThinking} className="flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-left text-xs text-zinc-300 hover:border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-40"><Headphones size={14} className="text-amber-300" /> Listen to audio brief</button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between"><p className="text-xs font-semibold text-zinc-300">Bring your context</p><FilePlus2 size={14} className="text-zinc-500" /></div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">Add notes, images, or paper files to this live map.</p>
          <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) addFile(file); }} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 px-3 py-2 text-xs text-zinc-400 hover:border-teal-500/50 hover:text-teal-200"><ImagePlus size={13} /> Add file or image</button>
        </section>
      </div>

      <div className="border-t border-white/10 px-3 py-3"><p className="text-[11px] leading-relaxed text-zinc-600">{message}</p><div className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-700"><Sparkles size={11} /> {session.thoughts.length} connected thoughts</div></div>
    </aside>
  );
}
