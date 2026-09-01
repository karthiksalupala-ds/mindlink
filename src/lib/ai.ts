import type { ThoughtType } from "./types";

export interface AIThought {
  content: string;
  type: ThoughtType;
  connectToIndex?: number; // index of previous thought to connect to
}

/**
 * Generates a realistic set of thoughts for a given question.
 * In production this would call Groq / OpenAI / Claude.
 * For the prototype we use high-quality structured responses.
 */
export async function generateInitialThoughts(question: string): Promise<AIThought[]> {
  // Short delay so UI feels responsive
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));

  const q = question.toLowerCase();

  // Prioritize / 90 days / focus
  if (
    q.includes("priorit") ||
    q.includes("90 day") ||
    q.includes("next month") ||
    q.includes("focus") ||
    q.includes("what should i")
  ) {
    return [
      {
        content: "What is the single outcome that would make the next 90 days a clear win?",
        type: "question",
      },
      {
        content: "Risk: Spreading effort across too many goals usually means none move far enough.",
        type: "risk",
        connectToIndex: 0,
      },
      {
        content: "Opportunity: One high-leverage priority compounds; small wins stack into momentum.",
        type: "opportunity",
      },
      {
        content: "Insight: Priority is what you say no to, not only what you say yes to.",
        type: "insight",
      },
      {
        content: "Idea: Pick 1 primary goal + 1 supporting habit for the next 2 weeks, then review.",
        type: "idea",
        connectToIndex: 0,
      },
      {
        content: "Challenge: Is this your priority, or someone else's expectation dressed as yours?",
        type: "challenge",
      },
      {
        content: "Decision frame: Define a 14-day experiment with a clear success metric.",
        type: "decision",
      },
    ];
  }

  // Decision / life choice questions
  if (
    q.includes("quit") ||
    q.includes("job") ||
    q.includes("startup") ||
    q.includes("resign") ||
    q.includes("career")
  ) {
    return [
      {
        content: "What is the real cost of staying vs leaving in the next 12 months?",
        type: "question",
      },
      {
        content: "Runway: Do you have 6–12 months of savings or a clear side-income plan?",
        type: "risk",
        connectToIndex: 0,
      },
      {
        content: "Opportunity: Building something of your own compounds skill + equity in a way a job rarely does.",
        type: "opportunity",
      },
      {
        content: "Most people who regret quitting waited too long. Most who regret starting moved too early without validation.",
        type: "insight",
      },
      {
        content: "Can you validate the idea while still employed (nights/weekends)?",
        type: "question",
        connectToIndex: 2,
      },
      {
        content: "Identity risk: A large part of self-worth may currently be tied to the job title.",
        type: "challenge",
      },
      {
        content: "Decision framework: Define a 90-day experiment instead of a permanent leap.",
        type: "decision",
      },
    ];
  }

  // Relationship / personal
  if (q.includes("relationship") || q.includes("marry") || q.includes("break up") || q.includes("love")) {
    return [
      {
        content: "What does 'good enough' look like vs what you actually want long-term?",
        type: "question",
      },
      {
        content: "Are the recurring problems solvable, or are they fundamental mismatches?",
        type: "challenge",
      },
      {
        content: "Opportunity cost of staying: emotional energy that could go elsewhere.",
        type: "risk",
      },
      {
        content: "People who leave and thrive usually had clarity on their non-negotiables first.",
        type: "insight",
      },
      {
        content: "Try writing the future you want in vivid detail — does this person fit naturally?",
        type: "idea",
      },
    ];
  }

  // Business / product / marketing
  if (
    q.includes("product") ||
    q.includes("launch") ||
    q.includes("market") ||
    q.includes("feature") ||
    q.includes("idea") ||
    q.includes("startup")
  ) {
    return [
      {
        content: "Who is the single most specific user this solves a painful problem for?",
        type: "question",
      },
      {
        content: "Risk: Building for 'everyone' usually means building for no one.",
        type: "risk",
      },
      {
        content: "Opportunity: A narrow wedge can expand once you have real pull.",
        type: "opportunity",
      },
      {
        content: "What would a 2-week experiment look like to test the riskiest assumption?",
        type: "idea",
      },
      {
        content: "Data point: Most successful products started with a painful, frequent problem for a small group.",
        type: "data",
      },
      {
        content: "Challenge the assumption that more features = more value.",
        type: "challenge",
      },
    ];
  }

  // Generic deep thinking
  return [
    {
      content: `Core question underneath: "${question}"`,
      type: "question",
    },
    {
      content: "What would the version of you 3 years from now advise?",
      type: "question",
    },
    {
      content: "Biggest hidden risk if you move forward without more information.",
      type: "risk",
    },
    {
      content: "Biggest upside that is easy to underestimate right now.",
      type: "opportunity",
    },
    {
      content: "One insight: clarity usually comes after small experiments, not before.",
      type: "insight",
    },
    {
      content: "Possible next move: define a 7-day or 30-day test instead of a permanent decision.",
      type: "idea",
    },
    {
      content: "Challenge: Are you solving the real problem or a more comfortable version of it?",
      type: "challenge",
    },
  ];
}

export async function expandThought(
  original: string,
  question: string
): Promise<AIThought[]> {
  await new Promise((r) => setTimeout(r, 900));

  return [
    {
      content: `Deeper look at: "${original.slice(0, 60)}${original.length > 60 ? "…" : ""}"`,
      type: "insight",
    },
    {
      content: "What evidence supports or contradicts this?",
      type: "question",
    },
    {
      content: "A practical next step related to this thought.",
      type: "idea",
    },
  ];
}

export async function challengeThought(content: string): Promise<AIThought> {
  await new Promise((r) => setTimeout(r, 700));
  return {
    content: `Counter-point: Is there a scenario where the opposite of "${content.slice(0, 50)}…" is actually true?`,
    type: "challenge",
  };
}

export async function generateDecisionSummary(
  question: string,
  thoughts: { content: string; type: string }[]
): Promise<string> {
  await new Promise((r) => setTimeout(r, 1000));

  const risks = thoughts.filter((t) => t.type === "risk").length;
  const opportunities = thoughts.filter((t) => t.type === "opportunity").length;
  const ideas = thoughts.filter((t) => t.type === "idea").length;

  return `Based on the exploration of "${question}", the canvas shows ${risks} key risks, ${opportunities} opportunities, and ${ideas} concrete ideas. A balanced path is to design a time-boxed experiment rather than an irreversible leap. Lock a clear next action and a review date.`;
}
