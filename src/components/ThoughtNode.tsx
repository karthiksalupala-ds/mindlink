"use client";

import { useRef, useState } from "react";
import { Pin, Trash2, ImageIcon, Volume2 } from "lucide-react";
import { useMindStore } from "@/lib/store";
import { THOUGHT_COLORS, THOUGHT_LABELS, ROLES, type Thought } from "@/lib/types";

interface Props {
  thought: Thought;
}

export default function ThoughtNode({ thought }: Props) {
  const { selectedId, setSelected, moveThought, deleteThought, pinThought, updateThought } =
    useMindStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(thought.content);
  const [imgLoading, setImgLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedId === thought.id;
  const color = THOUGHT_COLORS[thought.type] || "#8B5CF6";

  const onPointerDown = (e: React.PointerEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    setSelected(thought.id);
    setIsDragging(true);
    const rect = nodeRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const canvas = document.getElementById("mind-canvas");
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.current.x + canvas.scrollLeft;
    const y = e.clientY - canvasRect.top - dragOffset.current.y + canvas.scrollTop;
    moveThought(thought.id, Math.max(0, x), Math.max(0, y));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const saveEdit = () => {
    if (editValue.trim()) updateThought(thought.id, { content: editValue.trim() });
    setIsEditing(false);
  };

  const genImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgLoading(true);
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: thought.content }),
      });
      const data = await res.json();
      if (data.url) updateThought(thought.id, { imageUrl: data.url });
    } finally {
      setImgLoading(false);
    }
  };

  const speak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: thought.content }),
      });
      if (res.headers.get("content-type")?.includes("audio")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setSpeaking(false);
        };
        await audio.play();
      } else {
        setSpeaking(false);
      }
    } catch {
      setSpeaking(false);
    }
  };

  return (
    <div
      ref={nodeRef}
      className={`absolute select-none transition-all duration-300 ${
        isDragging ? "z-50 cursor-grabbing scale-[1.02]" : "z-10 cursor-grab"
      } ${isSelected ? "z-40" : ""}`}
      style={{
        left: thought.x,
        top: thought.y,
        width: thought.imageUrl ? 280 : 268,
        animation: "mindlink-pop 0.45s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className={`overflow-hidden rounded-2xl border backdrop-blur-xl transition-shadow duration-300 ${
          thought.pinned ? "ring-1 ring-amber-400/80" : ""
        }`}
        style={{
          borderColor: `${color}99`,
          background: `linear-gradient(145deg, rgba(12,12,20,0.92), rgba(18,18,28,0.88))`,
          boxShadow: isSelected
            ? `0 0 0 1px ${color}, 0 0 28px ${color}55, 0 16px 40px rgba(0,0,0,0.45)`
            : `0 8px 28px rgba(0,0,0,0.35), 0 0 0 1px ${color}22, inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}
      >
        {/* accent bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}66)` }} />

        <div className="flex items-center justify-between gap-2 px-3 py-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide" style={{ color }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
            {thought.author === "ai" ? "AI" : "You"}
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-300">
              {thought.role
                ? ROLES.find((r) => r.id === thought.role)?.label || thought.role
                : THOUGHT_LABELS[thought.type] || thought.type}
            </span>
          </span>
          <div className="flex items-center gap-0.5 text-zinc-400">
            <button onClick={genImage} disabled={imgLoading} className="rounded-lg p-1 hover:bg-white/10 hover:text-white disabled:opacity-50" title="Generate image">
              <ImageIcon size={12} className={imgLoading ? "animate-pulse" : ""} />
            </button>
            <button onClick={speak} disabled={speaking} className="rounded-lg p-1 hover:bg-white/10 hover:text-white disabled:opacity-50" title="Speak">
              <Volume2 size={12} className={speaking ? "animate-pulse" : ""} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); pinThought(thought.id); }} className="rounded-lg p-1 hover:bg-white/10 hover:text-white" title="Pin">
              <Pin size={12} className={thought.pinned ? "fill-amber-400 text-amber-400" : ""} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); deleteThought(thought.id); }} className="rounded-lg p-1 hover:bg-white/10 hover:text-red-400" title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {thought.imageUrl && (
          <div className="relative aspect-[4/3] w-full bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thought.imageUrl} alt="" className="h-full w-full object-cover opacity-90" loading="lazy" />
          </div>
        )}

        <div className="px-3 pb-3 pt-1">
          {isEditing ? (
            <textarea
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/40 p-2 text-sm text-zinc-100 outline-none focus:border-violet-500/50"
              rows={3}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <p
                className="text-[13px] leading-relaxed text-zinc-200"
                onDoubleClick={() => { setEditValue(thought.content); setIsEditing(true); }}
              >
                {thought.content}
              </p>
              {(thought.sourceLabel || thought.trust) && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                  {thought.sourceLabel && (
                    <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-zinc-400">
                      {thought.sourceUrl ? (
                        <a href={thought.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-violet-300">
                          {thought.sourceLabel}
                        </a>
                      ) : (
                        thought.sourceLabel
                      )}
                    </span>
                  )}
                  {thought.trust && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 font-medium ${
                        thought.trust === "high"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : thought.trust === "medium"
                            ? "bg-amber-500/15 text-amber-300"
                            : thought.trust === "low"
                              ? "bg-orange-500/15 text-orange-300"
                              : "bg-zinc-500/15 text-zinc-400"
                      }`}
                    >
                      {thought.trust}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
