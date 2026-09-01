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
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        {!session ? (
          <StartScreen />
        ) : (
          <>
            <MindCanvas />

            {/* Final decision banner */}
            {session.status === "decided" && session.finalDecision && (
              <div className="absolute bottom-6 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4">
                <div className="rounded-2xl border border-pink-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4 shadow-xl dark:border-pink-900 dark:from-violet-950/80 dark:to-fuchsia-950/80">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-pink-700 dark:text-pink-300">
                    <Lock size={14} />
                    Decision Locked
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                    {session.finalDecision}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
