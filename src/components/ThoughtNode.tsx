"use client";

import { useRef, useState } from "react";
import { Pin, Trash2, ImageIcon, Volume2 } from "lucide-react";
import { useMindStore } from "@/lib/store";
import { THOUGHT_COLORS, THOUGHT_LABELS, type Thought } from "@/lib/types";

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
      className={`absolute select-none transition-shadow duration-200 ${
        isDragging ? "z-50 cursor-grabbing" : "z-10 cursor-grab"
      } ${isSelected ? "z-40" : ""}`}
      style={{ left: thought.x, top: thought.y, width: thought.imageUrl ? 280 : 260 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className={`overflow-hidden rounded-2xl border-2 bg-white/95 shadow-lg backdrop-blur-md dark:bg-zinc-900/95 ${
          isSelected ? "ring-2 ring-offset-2 ring-offset-transparent" : ""
        } ${thought.pinned ? "ring-1 ring-amber-400" : ""}`}
        style={{
          borderColor: color,
          boxShadow: isSelected ? `0 0 0 2px ${color}50, 0 12px 28px -8px ${color}40` : undefined,
        }}
      >
        <div
          className="flex items-center justify-between gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white"
          style={{ backgroundColor: color }}
        >
          <span className="flex items-center gap-1.5 normal-case tracking-normal">
            {thought.author === "ai" ? "✦ AI" : "You"}
            <span className="opacity-90">· {THOUGHT_LABELS[thought.type] || thought.type}</span>
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={genImage}
              disabled={imgLoading}
              className="rounded p-1 hover:bg-white/20 disabled:opacity-50"
              title="Generate image"
            >
              <ImageIcon size={12} className={imgLoading ? "animate-pulse" : ""} />
            </button>
            <button
              onClick={speak}
              disabled={speaking}
              className="rounded p-1 hover:bg-white/20 disabled:opacity-50"
              title="Speak"
            >
              <Volume2 size={12} className={speaking ? "animate-pulse" : ""} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                pinThought(thought.id);
              }}
              className="rounded p-1 hover:bg-white/20"
              title="Pin"
            >
              <Pin size={12} className={thought.pinned ? "fill-current" : ""} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteThought(thought.id);
              }}
              className="rounded p-1 hover:bg-white/20"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {thought.imageUrl && (
          <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thought.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="px-3 py-2.5">
          {isEditing ? (
            <textarea
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                }
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-sm outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-800"
              rows={3}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <p
              className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-100"
              onDoubleClick={() => {
                setEditValue(thought.content);
                setIsEditing(true);
              }}
            >
              {thought.content}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
