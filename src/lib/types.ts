export type ThoughtType =
  | "question"
  | "idea"
  | "risk"
  | "opportunity"
  | "insight"
  | "decision"
  | "challenge"
  | "data"
  | "optimist"
  | "pessimist";

export type PathId = "main" | "pathA" | "pathB" | "pathC";

export interface Thought {
  id: string;
  content: string;
  type: ThoughtType;
  x: number;
  y: number;
  author: "human" | "ai";
  pinned?: boolean;
  imageUrl?: string;
  path?: PathId;
  createdAt: number;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
}

export type SessionMode = "explore" | "debate" | "parallel";

export interface MindSession {
  id: string;
  question: string;
  thoughts: Thought[];
  connections: Connection[];
  status: "idle" | "thinking" | "ready" | "decided";
  mode: SessionMode;
  finalDecision?: string;
  createdAt: number;
}

export const THOUGHT_COLORS: Record<ThoughtType, string> = {
  question: "#8B5CF6",
  idea: "#3B82F6",
  risk: "#EF4444",
  opportunity: "#10B981",
  insight: "#F59E0B",
  decision: "#EC4899",
  challenge: "#F97316",
  data: "#06B6D4",
  optimist: "#22C55E",
  pessimist: "#F43F5E",
};

export const THOUGHT_LABELS: Record<ThoughtType, string> = {
  question: "Question",
  idea: "Idea",
  risk: "Risk",
  opportunity: "Opportunity",
  insight: "Insight",
  decision: "Decision",
  challenge: "Challenge",
  data: "Data",
  optimist: "Optimist",
  pessimist: "Pessimist",
};
