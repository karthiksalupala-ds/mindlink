"use client";

import { useEffect, useRef } from "react";
import { useMindStore } from "@/lib/store";
import ThoughtNode from "./ThoughtNode";
import Connections from "./Connections";
import NetworkBackground from "./NetworkBackground";
import ThinkingLoader from "./ThinkingLoader";
import type { ThoughtType } from "@/lib/types";

export default function MindCanvas() {
  const session = useMindStore((s) => s.session);
  const isThinking = useMindStore((s) => s.isThinking);
  const addThought = useMindStore((s) => s.addThought);
  const addConnection = useMindStore((s) => s.addConnection);
  const setThinking = useMindStore((s) => s.setThinking);

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

        const thoughts = (data.thoughts || []) as { content: string; type: string }[];

        if (!thoughts.length) {
          addThought("What matters most right now?", "question", "ai");
          addThought("What small experiment can you run this week?", "idea", "ai");
          addThought("What risk is real vs assumed?", "risk", "ai");
        } else {
          const ids: string[] = [];
          for (let i = 0; i < thoughts.length; i++) {
            const t = thoughts[i];
            const id = addThought(t.content, (t.type || "idea") as ThoughtType, "ai");
            ids.push(id);
            await new Promise((r) => setTimeout(r, 50));
          }
          for (let i = 0; i < ids.length - 1; i++) {
            if (i % 2 === 0) addConnection(ids[i], ids[i + 1]);
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
    <div
      id="mind-canvas"
      className="relative h-full w-full overflow-auto bg-[#07070c]"
    >
      <NetworkBackground intensity={1.1} />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(88,28,135,0.15),transparent_55%)]" />

      <div className="relative" style={{ width: 1700, height: 1200, minHeight: "100%" }}>
        <Connections />
        {session.thoughts.map((t) => (
          <ThoughtNode key={t.id} thought={t} />
        ))}
      </div>

      {isThinking && (
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-24 z-50">
          <ThinkingLoader
            label={session.mode === "debate" ? "Debating both sides…" : "AI is thinking with you…"}
          />
        </div>
      )}
    </div>
  );
}
