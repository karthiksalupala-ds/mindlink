"use client";

import { create } from "zustand";
import type {
  Thought,
  Connection,
  MindSession,
  ThoughtType,
  SessionMode,
  PathId,
  RoleId,
  SavedDecision,
  OutcomeScenario,
} from "./types";

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

const HISTORY_KEY = "mindlink_decisions_v1";
const SESSION_KEY = "mindlink_session_v1";

function loadHistory(): SavedDecision[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items: SavedDecision[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 40)));
  } catch {}
}

function loadSession(): MindSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MindSession;
  } catch {
    return null;
  }
}

function persistSession(session: MindSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (!session) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

interface MindState {
  session: MindSession | null;
  selectedId: string | null;
  isThinking: boolean;
  history: SavedDecision[];
  hydrated: boolean;

  hydrate: () => void;
  startSession: (question: string, mode?: SessionMode) => void;
  addThought: (
    content: string,
    type: ThoughtType,
    author: "human" | "ai",
    x?: number,
    y?: number,
    imageUrl?: string,
    extra?: { path?: PathId; role?: RoleId }
  ) => string;
  updateThought: (id: string, updates: Partial<Thought>) => void;
  deleteThought: (id: string) => void;
  moveThought: (id: string, x: number, y: number) => void;
  pinThought: (id: string) => void;
  addConnection: (fromId: string, toId: string, label?: string) => void;
  setSelected: (id: string | null) => void;
  setThinking: (v: boolean) => void;
  setMode: (mode: SessionMode) => void;
  lockDecision: (decision: string, outcomes?: OutcomeScenario[]) => void;
  clearSession: () => void;
  getThought: (id: string) => Thought | undefined;
  clearHistory: () => void;
}

export const useMindStore = create<MindState>((set, get) => ({
  session: null,
  selectedId: null,
  isThinking: false,
  history: [],
  hydrated: false,

  hydrate: () => {
    const history = loadHistory();
    const session = loadSession();
    set({ history, session, hydrated: true });
  },

  startSession: (question, mode = "explore") => {
    const session: MindSession = {
      id: uid(),
      question,
      thoughts: [],
      connections: [],
      status: "thinking",
      mode,
      createdAt: Date.now(),
    };
    set({ session, selectedId: null, isThinking: true });
    persistSession(session);
  },

  addThought: (content, type, author, x, y, imageUrl, extra) => {
    const id = uid();
    const session = get().session;
    if (!session) return id;

    const existing = session.thoughts.length;
    const path = extra?.path || "main";

    let defaultX = x;
    let defaultY = y;
    if (defaultX === undefined || defaultY === undefined) {
      if (session.mode === "parallel" && path !== "main") {
        const col = path === "pathA" ? 80 : path === "pathB" ? 520 : 960;
        const countInPath = session.thoughts.filter((t) => t.path === path).length;
        defaultX = col;
        defaultY = 120 + countInPath * 140;
      } else {
        const angle = existing * 137.5 * (Math.PI / 180);
        const radius = 160 + existing * 28;
        defaultX = 420 + Math.cos(angle) * radius;
        defaultY = 280 + Math.sin(angle) * radius;
      }
    }

    const thought: Thought = {
      id,
      content,
      type,
      x: defaultX!,
      y: defaultY!,
      author,
      imageUrl,
      path,
      role: extra?.role,
      createdAt: Date.now(),
    };

    const next = {
      ...session,
      thoughts: [...session.thoughts, thought],
      status: "ready" as const,
    };
    set({ session: next });
    persistSession(next);
    return id;
  },

  updateThought: (id, updates) => {
    const session = get().session;
    if (!session) return;
    const next = {
      ...session,
      thoughts: session.thoughts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    };
    set({ session: next });
    persistSession(next);
  },

  deleteThought: (id) => {
    const session = get().session;
    if (!session) return;
    const next = {
      ...session,
      thoughts: session.thoughts.filter((t) => t.id !== id),
      connections: session.connections.filter((c) => c.fromId !== id && c.toId !== id),
    };
    set({
      session: next,
      selectedId: get().selectedId === id ? null : get().selectedId,
    });
    persistSession(next);
  },

  moveThought: (id, x, y) => {
    const session = get().session;
    if (!session) return;
    const next = {
      ...session,
      thoughts: session.thoughts.map((t) => (t.id === id ? { ...t, x, y } : t)),
    };
    set({ session: next });
    persistSession(next);
  },

  pinThought: (id) => {
    const session = get().session;
    if (!session) return;
    const next = {
      ...session,
      thoughts: session.thoughts.map((t) =>
        t.id === id ? { ...t, pinned: !t.pinned } : t
      ),
    };
    set({ session: next });
    persistSession(next);
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
    const next = {
      ...session,
      connections: [...session.connections, { id: uid(), fromId, toId, label }],
    };
    set({ session: next });
    persistSession(next);
  },

  setSelected: (id) => set({ selectedId: id }),
  setThinking: (v) => set({ isThinking: v }),

  setMode: (mode) => {
    const session = get().session;
    if (!session) return;
    const next = { ...session, mode };
    set({ session: next });
    persistSession(next);
  },

  lockDecision: (decision, outcomes) => {
    const session = get().session;
    if (!session) return;
    const next: MindSession = {
      ...session,
      status: "decided",
      finalDecision: decision,
      outcomes,
    };
    set({ session: next });
    persistSession(next);

    const entry: SavedDecision = {
      id: uid(),
      question: session.question,
      decision,
      mode: session.mode,
      thoughtCount: session.thoughts.length,
      createdAt: Date.now(),
    };
    const history = [entry, ...get().history].slice(0, 40);
    set({ history });
    saveHistory(history);
  },

  clearSession: () => {
    set({ session: null, selectedId: null, isThinking: false });
    persistSession(null);
  },

  getThought: (id) => get().session?.thoughts.find((t) => t.id === id),

  clearHistory: () => {
    set({ history: [] });
    saveHistory([]);
  },
}));
