"use client";

import { create } from "zustand";
import type { Thought, Connection, MindSession, ThoughtType, SessionMode } from "./types";

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

interface MindState {
  session: MindSession | null;
  selectedId: string | null;
  isThinking: boolean;

  startSession: (question: string, mode?: SessionMode) => void;
  addThought: (
    content: string,
    type: ThoughtType,
    author: "human" | "ai",
    x?: number,
    y?: number,
    imageUrl?: string
  ) => string;
  updateThought: (id: string, updates: Partial<Thought>) => void;
  deleteThought: (id: string) => void;
  moveThought: (id: string, x: number, y: number) => void;
  pinThought: (id: string) => void;
  addConnection: (fromId: string, toId: string, label?: string) => void;
  setSelected: (id: string | null) => void;
  setThinking: (v: boolean) => void;
  setMode: (mode: SessionMode) => void;
  lockDecision: (decision: string) => void;
  clearSession: () => void;
  getThought: (id: string) => Thought | undefined;
}

export const useMindStore = create<MindState>((set, get) => ({
  session: null,
  selectedId: null,
  isThinking: false,

  startSession: (question, mode = "explore") => {
    set({
      session: {
        id: uid(),
        question,
        thoughts: [],
        connections: [],
        status: "thinking",
        mode,
        createdAt: Date.now(),
      },
      selectedId: null,
      isThinking: true,
    });
  },

  addThought: (content, type, author, x, y, imageUrl) => {
    const id = uid();
    const session = get().session;
    if (!session) return id;

    const existing = session.thoughts.length;
    const angle = existing * 137.5 * (Math.PI / 180);
    const radius = 160 + existing * 28;
    const defaultX = x ?? 420 + Math.cos(angle) * radius;
    const defaultY = y ?? 300 + Math.sin(angle) * radius;

    const thought: Thought = {
      id,
      content,
      type,
      x: defaultX,
      y: defaultY,
      author,
      imageUrl,
      createdAt: Date.now(),
    };

    set({
      session: {
        ...session,
        thoughts: [...session.thoughts, thought],
        status: "ready",
      },
    });
    return id;
  },

  updateThought: (id, updates) => {
    const session = get().session;
    if (!session) return;
    set({
      session: {
        ...session,
        thoughts: session.thoughts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      },
    });
  },

  deleteThought: (id) => {
    const session = get().session;
    if (!session) return;
    set({
      session: {
        ...session,
        thoughts: session.thoughts.filter((t) => t.id !== id),
        connections: session.connections.filter((c) => c.fromId !== id && c.toId !== id),
      },
      selectedId: get().selectedId === id ? null : get().selectedId,
    });
  },

  moveThought: (id, x, y) => {
    const session = get().session;
    if (!session) return;
    set({
      session: {
        ...session,
        thoughts: session.thoughts.map((t) => (t.id === id ? { ...t, x, y } : t)),
      },
    });
  },

  pinThought: (id) => {
    const session = get().session;
    if (!session) return;
    set({
      session: {
        ...session,
        thoughts: session.thoughts.map((t) =>
          t.id === id ? { ...t, pinned: !t.pinned } : t
        ),
      },
    });
  },

  addConnection: (fromId, toId, label) => {
    const session = get().session;
    if (!session) return;
    const exists = session.connections.some(
      (c) =>
        (c.fromId === fromId && c.toId === toId) ||
        (c.fromId === toId && c.toId === fromId)
    );
    if (exists) return;
    set({
      session: {
        ...session,
        connections: [...session.connections, { id: uid(), fromId, toId, label }],
      },
    });
  },

  setSelected: (id) => set({ selectedId: id }),
  setThinking: (v) => set({ isThinking: v }),

  setMode: (mode) => {
    const session = get().session;
    if (!session) return;
    set({ session: { ...session, mode } });
  },

  lockDecision: (decision) => {
    const session = get().session;
    if (!session) return;
    set({
      session: { ...session, status: "decided", finalDecision: decision },
    });
  },

  clearSession: () => set({ session: null, selectedId: null, isThinking: false }),

  getThought: (id) => get().session?.thoughts.find((t) => t.id === id),
}));
