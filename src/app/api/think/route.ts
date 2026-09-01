import { NextRequest, NextResponse } from "next/server";
import { groqChat, getGroqKey } from "@/lib/groq";

export async function POST(req: NextRequest) {
  let question = "";
  let mode: string | undefined;

  try {
    const body = await req.json();
    question = (body.question || "").trim();
    mode = body.mode;

    if (!question) {
      return NextResponse.json({ error: "question required", thoughts: [] }, { status: 400 });
    }

    if (!getGroqKey()) {
      return NextResponse.json({
        source: "mock",
        thoughts: getMockThoughts(question, mode),
      });
    }

    try {
      const system = buildSystem(mode);
      const raw = await groqChat([
        { role: "system", content: system },
        { role: "user", content: question },
      ]);
      const thoughts = parseThoughts(raw);
      return NextResponse.json({
        source: "groq",
        thoughts: thoughts.length ? thoughts : getMockThoughts(question, mode),
      });
    } catch (groqErr: any) {
      console.error("Groq failed, using mock:", groqErr?.message);
      return NextResponse.json({
        source: "mock",
        error: groqErr?.message || "groq failed",
        thoughts: getMockThoughts(question, mode),
      });
    }
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({
      source: "mock",
      error: e?.message || "think failed",
      thoughts: getMockThoughts(question || "fallback", mode),
    });
  }
}

function buildSystem(mode?: string) {
  if (mode === "debate") {
    return `You are MindLink debate engine. Return ONLY valid JSON array of 6-8 objects:
{"content":"...","type":"optimist"|"pessimist"|"question"|"insight"}
Alternate optimist and pessimist views. No markdown.`;
  }
  return `You are MindLink, a collaborative thinking partner. Return ONLY a valid JSON array of 6-8 objects:
{"content":"short thoughtful sentence","type":"question"|"idea"|"risk"|"opportunity"|"insight"|"decision"|"challenge"|"data"}
Be specific to the user's question. No markdown outside JSON.`;
}

function parseThoughts(raw: string): { content: string; type: string }[] {
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((t) => t.content && t.type)
      .map((t) => ({ content: String(t.content), type: String(t.type) }));
  } catch {
    return [];
  }
}

function getMockThoughts(question: string, mode?: string) {
  const q = (question || "").toLowerCase();
  if (mode === "debate") {
    return [
      { content: "This path opens growth and autonomy you may never get otherwise.", type: "optimist" },
      { content: "The downside risk and uncertainty could be larger than it looks now.", type: "pessimist" },
      { content: "What evidence would change your mind either way?", type: "question" },
      { content: "Most people overestimate short-term pain and underestimate long-term drift.", type: "insight" },
      { content: "You can design a reversible experiment instead of a permanent leap.", type: "optimist" },
      { content: "Identity and income shocks often hit harder than plans admit.", type: "pessimist" },
    ];
  }
  if (q.includes("priorit") || q.includes("90")) {
    return [
      { content: "What single outcome would make the next 90 days a clear win?", type: "question" },
      { content: "Spreading effort across too many goals usually means none move far.", type: "risk" },
      { content: "One high-leverage priority compounds; small wins build momentum.", type: "opportunity" },
      { content: "Priority is what you say no to, not only what you say yes to.", type: "insight" },
      { content: "Pick 1 primary goal + 1 habit for 2 weeks, then review.", type: "idea" },
      { content: "Is this your priority, or someone else's expectation?", type: "challenge" },
    ];
  }
  if (q.includes("quit") || q.includes("job") || q.includes("startup")) {
    return [
      { content: "What is the real cost of staying vs leaving in the next 12 months?", type: "question" },
      { content: "Runway: Do you have 6–12 months savings or a clear side-income plan?", type: "risk" },
      { content: "Building something of your own compounds skill + equity in a way a job rarely does.", type: "opportunity" },
      { content: "Most who regret quitting waited too long; most who regret starting moved too early.", type: "insight" },
      { content: "Can you validate the idea while still employed?", type: "question" },
      { content: "Define a 90-day experiment instead of a permanent leap.", type: "decision" },
    ];
  }
  return [
    { content: `Core question underneath: "${question.slice(0, 80)}"`, type: "question" },
    { content: "What would the version of you 3 years from now advise?", type: "question" },
    { content: "Biggest hidden risk if you move forward without more information.", type: "risk" },
    { content: "Biggest upside that is easy to underestimate right now.", type: "opportunity" },
    { content: "Clarity usually comes after small experiments, not before.", type: "insight" },
    { content: "Define a 7-day or 30-day test instead of a permanent decision.", type: "idea" },
  ];
}