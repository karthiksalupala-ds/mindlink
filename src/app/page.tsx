"use client";

import { useEffect, useState } from "react";
import { useMindStore } from "@/lib/store";
import { useWebMCPTools } from "@/lib/webmcp";
import Header from "@/components/Header";
import StartScreen from "@/components/StartScreen";
import MindCanvas from "@/components/MindCanvas";
import WorkspaceSidebar from "@/components/WorkspaceSidebar";
import { Lock, PanelLeftOpen } from "lucide-react";

export default function Home() {
  useWebMCPTools();
  const { session, hydrate, hydrated } = useMindStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#07070c]">
      <Header />
      <main className="relative flex-1 overflow-hidden">
        {!hydrated ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Loading mind…
          </div>
        ) : !session ? (
          <StartScreen />
        ) : (
          <div className="flex h-full min-h-0 flex-col md:flex-row">
            {sidebarOpen && <WorkspaceSidebar onClose={() => setSidebarOpen(false)} />}
            <div className="relative min-h-0 flex-1">
              {!sidebarOpen && (
                <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open research desk" title="Open research desk" className="absolute left-3 top-3 z-50 rounded-xl border border-white/10 bg-[#11111a]/90 p-2 text-zinc-400 shadow-xl backdrop-blur hover:bg-white/10 hover:text-white">
                  <PanelLeftOpen size={16} />
                </button>
              )}
              <MindCanvas />
            </div>
            {session.status === "decided" && session.finalDecision && (
              <div className="absolute bottom-6 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4">
                <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-r from-violet-950/90 to-fuchsia-950/90 p-4 shadow-2xl shadow-violet-900/40 backdrop-blur-xl">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-pink-300">
                    <Lock size={14} />
                    Decision Locked
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-200">{session.finalDecision}</p>
                  {session.outcomes && session.outcomes.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {session.outcomes.map((o) => (
                        <div
                          key={o.label}
                          className="rounded-lg border border-white/10 bg-black/30 p-2 text-[11px] text-zinc-300"
                        >
                          <p className="font-semibold text-zinc-100">{o.title}</p>
                          <p className="mt-0.5 opacity-80">{o.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
