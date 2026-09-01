"use client";

import { useMindStore } from "@/lib/store";
import { useWebMCPTools } from "@/lib/webmcp";
import Header from "@/components/Header";
import StartScreen from "@/components/StartScreen";
import MindCanvas from "@/components/MindCanvas";
import { Lock } from "lucide-react";

export default function Home() {
  useWebMCPTools();
  const { session } = useMindStore();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#07070c]">
      <Header />
      <main className="relative flex-1 overflow-hidden">
        {!session ? (
          <StartScreen />
        ) : (
          <>
            <MindCanvas />
            {session.status === "decided" && session.finalDecision && (
              <div className="absolute bottom-6 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4">
                <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-r from-violet-950/90 to-fuchsia-950/90 p-4 shadow-2xl backdrop-blur-xl">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-pink-300">
                    <Lock size={14} />
                    Decision Locked
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-200">{session.finalDecision}</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
