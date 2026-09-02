"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { useMindStore } from "@/lib/store";
import ThoughtNode from "./ThoughtNode";
import Connections from "./Connections";
import NetworkBackground from "./NetworkBackground";
import ThinkingLoader from "./ThinkingLoader";
import type { ThoughtType, PathId } from "@/lib/types";

export default function MindCanvas() {
  const session = useMindStore((s) => s.session);
  const isThinking = useMindStore((s) => s.isThinking);
  const addThought = useMindStore((s) => s.addThought);
  const addConnection = useMindStore((s) => s.addConnection);
  const setThinking = useMindStore((s) => s.setThinking);
  const [zoom, setZoom] = useState(1);

  const bootedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!session) {
      bootedFor.current = null;
      return;
    }

    if (session.thoughts.length > 0) {
      bootedFor.current = session.id;
      setThinking(false);
      return;
    }

    if (bootedFor.current === session.id) return;

    const sessionId = session.id;
    const question = session.question;
    const mode = session.mode;
    bootedFor.current = sessionId;

    (async () => {
      setThinking(true);
      try {
        const res = await fetch("/api/think", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, mode }),
        });
        const data = await res.json();
        console.log("[MindCanvas] count:", data.thoughts?.length, data.source);

        const current = useMindStore.getState().session;
        if (!current || current.id !== sessionId) return;
        if (current.thoughts.length > 0) {
          setThinking(false);
          return;
        }

        const thoughts = (data.thoughts || []) as {
          content: string;
          type: string;
          path?: string;
          sourceLabel?: string;
          trust?: string;
        }[];

        if (!thoughts.length) {
          addThought("What matters most right now?", "question", "ai");
          addThought("What small experiment can you run this week?", "idea", "ai");
          addThought("What risk is real vs assumed?", "risk", "ai");
        } else {
          const ids: string[] = [];
          for (let i = 0; i < thoughts.length; i++) {
            const th = thoughts[i];
            const path = (th.path as PathId) || undefined;
            const extra: any = {};
            if (path) extra.path = path;
            if (th.sourceLabel) extra.sourceLabel = th.sourceLabel;
            if (th.trust) extra.trust = th.trust;
            const id = addThought(
              th.content,
              (th.type || "idea") as ThoughtType,
              "ai",
              undefined,
              undefined,
              undefined,
              Object.keys(extra).length ? extra : undefined
            );
            ids.push(id);
            await new Promise((r) => setTimeout(r, 45));
          }
          if (mode !== "parallel") {
            for (let i = 0; i < ids.length - 1; i++) {
              if (i % 2 === 0) addConnection(ids[i], ids[i + 1]);
            }
          }
        }
      } catch (err) {
        console.error(err);
        addThought("Something went wrong. Click New and try again.", "challenge", "ai");
      } finally {
        setThinking(false);
      }
    })();
  }, [session?.id, session?.question, session?.mode, session?.thoughts.length, addThought, addConnection, setThinking]);

  if (!session) return null;

  return (
    <div id="mind-canvas" className="relative h-full w-full overflow-auto bg-[#07070c]">
      <NetworkBackground intensity={1.1} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(88,28,135,0.15),transparent_55%)]" />

      <div className="absolute left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-white/15 bg-[#11111a]/95 p-1 shadow-2xl shadow-black/40 backdrop-blur">
        <span className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Canvas</span>
        <button type="button" onClick={() => setZoom((value) => Math.max(0.55, Number((value - 0.1).toFixed(2))))} aria-label="Zoom out" title="Zoom out" className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white">
          <Minus size={14} /> <span className="hidden sm:inline">Out</span>
        </button>
        <span className="min-w-12 text-center text-[11px] font-medium text-zinc-500">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((value) => Math.min(1.6, Number((value + 0.1).toFixed(2))))} aria-label="Zoom in" title="Zoom in" className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white">
          <Plus size={14} /> <span className="hidden sm:inline">In</span>
        </button>
        <button type="button" onClick={() => setZoom(1)} aria-label="Reset canvas zoom" title="Reset zoom" className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-zinc-400 hover:bg-white/10 hover:text-white">
          <Maximize2 size={14} />
        </button>
      </div>

      {session.mode === "parallel" && (
        <div className="pointer-events-none absolute top-4 left-0 right-0 z-20 flex justify-center gap-8 px-8">
          {[
            { id: "pathA", label: "Path A · Act now", color: "#22C55E" },
            { id: "pathB", label: "Path B · Wait", color: "#F59E0B" },
            { id: "pathC", label: "Path C · Pilot", color: "#38BDF8" },
          ].map((p) => (
            <div
              key={p.id}
              className="rounded-full border px-4 py-1.5 text-xs font-semibold backdrop-blur"
              style={{ borderColor: `${p.color}55`, color: p.color, background: `${p.color}15` }}
            >
              {p.label}
            </div>
          ))}
        </div>
      )}

      <div style={{ width: 1700 * zoom, height: 1200 * zoom, minHeight: "100%" }}>
        <div className="relative" style={{ width: 1700, height: 1200, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
          <Connections />
          {session.thoughts.map((t) => (
            <ThoughtNode key={t.id} thought={t} />
          ))}
        </div>
      </div>

      {isThinking && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-start justify-center pt-24">
          <ThinkingLoader
            label={
              session.mode === "debate"
                ? "Debating both sides…"
                : session.mode === "parallel"
                  ? "Mapping parallel lives…"
                  : session.mode === "research"
                    ? "Gathering evidence for your idea…"
                    : "AI is thinking with you…"
            }
          />
        </div>
      )}
    </div>
  );
}
