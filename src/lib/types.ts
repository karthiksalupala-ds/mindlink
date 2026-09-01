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
  | "pessimist"
  | "role";

export type PathId = "main" | "pathA" | "pathB" | "pathC";

export type SessionMode = "explore" | "debate" | "parallel";

export type RoleId =
  | "future_you"
  | "investor"
  | "mentor"
  | "devil"
  | "expert";

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
  role?: RoleId;
  createdAt: number;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
}

export interface OutcomeScenario {
  label: "best" | "likely" | "worst";
  title: string;
  content: string;
}

export interface MindSession {
  id: string;
  question: string;
  thoughts: Thought[];
  connections: Connection[];
  status: "idle" | "thinking" | "ready" | "decided";
  mode: SessionMode;
  finalDecision?: string;
  outcomes?: OutcomeScenario[];
  createdAt: number;
}

export interface SavedDecision {
  id: string;
  question: string;
  decision: string;
  mode: SessionMode;
  thoughtCount: number;
  createdAt: number;
}

export const ROLES: {
  id: RoleId;
  label: string;
  color: string;
  prompt: string;
}[] = [
  {
    id: "future_you",
    label: "Future You",
    color: "#A78BFA",
    prompt: "Speak as the user's wiser self 10 years in the future. Be honest, calm, long-term.",
  },
  {
    id: "investor",
    label: "Investor",
    color: "#F59E0B",
    prompt: "Speak as a ruthless but fair investor. Focus on risk, ROI, traction, downside.",
  },
  {
    id: "mentor",
    label: "Mentor",
    color: "#34D399",
    prompt: "Speak as a supportive experienced mentor. Encourage clarity and small experiments.",
  },
  {
    id: "devil",
    label: "Devil's Advocate",
    color: "#F43F5E",
    prompt: "Attack weak assumptions. Find holes, biases, and comfortable lies.",
  },
  {
    id: "expert",
    label: "Domain Expert",
    color: "#38BDF8",
    prompt: "Speak as a careful domain expert. Prefer evidence, constraints, and unknowns.",
  },
];

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
  role: "#A78BFA",
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
  role: "Role",
};

export const PATH_COLORS: Record<PathId, string> = {
  main: "#8B5CF6",
  pathA: "#22C55E",
  pathB: "#F59E0B",
  pathC: "#38BDF8",
};
