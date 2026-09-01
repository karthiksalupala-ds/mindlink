"use client";

/** Premium animated brain / neural loader */
export default function ThinkingLoader({ label = "AI is thinking with you…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-2 border-violet-500/30" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-400 border-r-fuchsia-400" style={{ animationDuration: "1.2s" }} />
        <div
          className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-b-pink-400 border-l-violet-300"
          style={{ animationDuration: "1.8s", animationDirection: "reverse" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 animate-pulse rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_20px_rgba(139,92,246,0.8)]" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
          <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-violet-300" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "4s", animationDirection: "reverse" }}>
          <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-fuchsia-300" />
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-violet-500/20 bg-zinc-950/80 px-5 py-2.5 shadow-xl backdrop-blur-md">
        <span className="text-sm font-medium tracking-wide text-zinc-100">{label}</span>
        <span className="flex gap-0.5">
          <span className="h-1 w-1 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:-0.15s]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-pink-400" />
        </span>
      </div>
    </div>
  );
}
