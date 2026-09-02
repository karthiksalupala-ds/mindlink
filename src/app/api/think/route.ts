import { NextRequest, NextResponse } from "next/server";
import { groqChat, getGroqKey } from "@/lib/groq";

export async function POST(req: NextRequest) {
  let question = "";
  let mode: string | undefined;
  let role: string | undefined;
  let action: string | undefined;

  try {
    const body = await req.json();
    question = (body.question || "").trim();
    mode = body.mode;
    role = body.role;
    action = body.action; // "outcomes" | undefined

    if (!question) {
      return NextResponse.json({
        error: "question required",
        thoughts: getMockThoughts("empty", mode),
      });
    }

    if (!getGroqKey()) {
      return NextResponse.json({
        source: "mock",
        thoughts: getMockThoughts(question, mode, role, action),
        outcomes: action === "outcomes" ? getMockOutcomes(question) : undefined,
      });
    }

    try {
      const system = buildSystem(mode, role, action, question);
      const raw = await groqChat([
        { role: "system", content: system },
        { role: "user", content: question },
      ]);
      console.log("[think] raw length:", raw?.length);

      if (action === "outcomes") {
        const outcomes = parseOutcomes(raw) || getMockOutcomes(question);
        return NextResponse.json({ source: "groq", thoughts: [], outcomes });
      }

      let thoughts = parseThoughts(raw);
      if (!thoughts.length && raw && raw.length > 20) {
        thoughts = proseToThoughts(raw, mode);
      }
      if (!thoughts.length) {
        thoughts = getMockThoughts(question, mode, role, action);
      }

      return NextResponse.json({ source: "groq", thoughts });
    } catch (groqErr: any) {
      console.error("Groq failed, using mock:", groqErr?.message);
      return NextResponse.json({
        source: "mock",
        error: groqErr?.message || "groq failed",
        thoughts: getMockThoughts(question, mode, role, action),
        outcomes: action === "outcomes" ? getMockOutcomes(question) : undefined,
      });
    }
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({
      source: "mock",
      error: e?.message || "think failed",
      thoughts: getMockThoughts(question || "fallback", mode, role, action),
    });
  }
}

function buildSystem(mode?: string, role?: string, action?: string, question = "") {
  if (action === "outcomes") {
    return `Return ONLY a JSON array of exactly 3 objects:
[{"label":"best","title":"...","content":"2 sentences"},{"label":"likely","title":"...","content":"..."},{"label":"worst","title":"...","content":"..."}]
No markdown. About the decision context the user provides.`;
  }

  if (role) {
    const roleGuide: Record<string, string> = {
      future_you: "You are the user's wiser self 10 years later. Calm, long-term, honest.",
      investor: "You are a ruthless fair investor. ROI, risk, traction, downside only.",
      mentor: "You are a supportive mentor. Clarity and small experiments.",
      devil: "You are the devil's advocate. Attack weak assumptions.",
      expert: "You are a careful domain expert. Evidence and unknowns.",
    };
    return `${roleGuide[role] || "You are a specialist advisor."}
Return ONLY a JSON array of 4-5 objects:
{"content":"...","type":"role"}
Specific to the user's question. No markdown.`;
  }

  if (mode === "debate") {
    return `Return ONLY JSON array of 6 objects alternating optimist/pessimist:
{"content":"...","type":"optimist"|"pessimist"|"question"|"insight"}
No markdown.`;
  }

  if (mode === "parallel") {
    return `Return ONLY a JSON array of 9 objects for 3 paths:
{"content":"...","type":"idea"|"risk"|"opportunity"|"insight","path":"pathA"|"pathB"|"pathC"}
pathA = bold move now, pathB = wait and prepare, pathC = small reversible experiment.
3 thoughts per path. No markdown.`;
  }

  if (mode === "research") {
    if (question.startsWith("[PAPER EXPLAINER]")) {
      return `You are a research paper explainer. The user provides a paper abstract, passage, or research question.
Return ONLY a JSON array of 8-10 objects. Each object:
{"content":"plain-language explanation","type":"claim"|"evidence"|"question"|"insight"|"risk"|"gap"|"contradiction"|"data","sourceLabel":"paper passage or section","trust":"high"|"medium"|"low"|"unverified"}
Build a connected learning map covering: the research question, method, key finding, evidence, practical meaning, limitation, contradiction or uncertainty, and one open question.
Explain technical ideas simply without inventing facts. If the input is too short to establish evidence, mark trust as unverified and say what is missing. No markdown outside JSON.\n\nInput:\n${question.slice("[PAPER EXPLAINER]".length).trim()}`;
    }
    return `You are an idea-validation researcher. The user describes a product/startup idea.
Return ONLY a JSON array of 8-10 objects. Each object:
{"content":"one clear finding or claim","type":"claim"|"evidence"|"competitor"|"gap"|"market"|"risk"|"contradiction"|"question","sourceLabel":"short source name or Unknown","trust":"high"|"medium"|"low"|"unverified"}
Cover: existing competitors, market signals, supporting claims, contradictions, white-space gaps, key risks.
Be specific to the idea. No markdown outside JSON. Prefer honest uncertainty over fake certainty.`;
  }

  return `Return ONLY a JSON array of 6-8 objects:
{"content":"short thoughtful sentence","type":"question"|"idea"|"risk"|"opportunity"|"insight"|"decision"|"challenge"|"data"}
Specific to the user question. No markdown outside JSON.`;
}

function parseThoughts(raw: string): {
  content: string;
  type: string;
  path?: string;
  sourceLabel?: string;
  trust?: string;
}[] {
  if (!raw) return [];
  try {
    let text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) return [];
    const valid = new Set([
      "question", "idea", "risk", "opportunity", "insight",
      "decision", "challenge", "data", "optimist", "pessimist", "role",
      "claim", "evidence", "competitor", "gap", "market", "contradiction",
    ]);
    const trusts = new Set(["high", "medium", "low", "unverified"]);
    return arr
      .filter((t: any) => t && (t.content || t.text))
      .map((t: any) => {
        let type = String(t.type || "idea").toLowerCase();
        if (!valid.has(type)) type = "idea";
        const path = t.path && ["pathA", "pathB", "pathC", "main"].includes(t.path) ? t.path : undefined;
        const trust = trusts.has(String(t.trust || "").toLowerCase())
          ? String(t.trust).toLowerCase()
          : undefined;
        const sourceLabel = t.sourceLabel ? String(t.sourceLabel).slice(0, 80) : undefined;
        return {
          content: String(t.content || t.text).trim(),
          type,
          path,
          sourceLabel,
          trust,
        };
      })
      .filter((t: any) => t.content.length > 0)
      .slice(0, 12);
  } catch {
    return [];
  }
}

function parseOutcomes(raw: string) {
  try {
    let text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) return null;
    return arr
      .filter((o: any) => o && o.content)
      .map((o: any) => ({
        label: (["best", "likely", "worst"].includes(o.label) ? o.label : "likely") as
          | "best"
          | "likely"
          | "worst",
        title: String(o.title || o.label || "Scenario"),
        content: String(o.content),
      }))
      .slice(0, 3);
  } catch {
    return null;
  }
}

function proseToThoughts(raw: string, mode?: string) {
  const lines = raw
    .split(/\n+/)
    .map((l) => l.replace(/^[\s\-*•\d.]+/, "").trim())
    .filter((l) => l.length > 15 && l.length < 300);
  if (lines.length < 2) return [];
  const types =
    mode === "debate"
      ? ["optimist", "pessimist", "question", "insight", "optimist", "pessimist"]
      : ["question", "risk", "opportunity", "insight", "idea", "challenge"];
  return lines.slice(0, 8).map((content, i) => ({
    content,
    type: types[i % types.length],
  }));
}

function getMockOutcomes(question: string) {
  return [
    {
      label: "best" as const,
      title: "Best case (90 days)",
      content: `You act with clarity on "${question.slice(0, 40)}". Early feedback compounds and confidence rises.`,
    },
    {
      label: "likely" as const,
      title: "Likely case",
      content: "Progress is uneven. You adjust after two short experiments and keep optionality.",
    },
    {
      label: "worst" as const,
      title: "Worst case",
      content: "You overcommit without a kill switch. Time and energy drain; recovery takes months.",
    },
  ];
}

function getMockThoughts(question: string, mode?: string, role?: string, action?: string) {
  if (action === "outcomes") return [];
  if (mode === "research" && question.startsWith("[PAPER EXPLAINER]")) {
    return [
      { content: "Research question: How can shared solar improve access for renters?", type: "question", sourceLabel: "Input passage", trust: "medium" },
      { content: "Plain-language claim: Community solar lets people benefit from renewable energy without owning a rooftop system.", type: "claim", sourceLabel: "Input passage", trust: "medium" },
      { content: "Method: The authors compare outcomes across three pilot programs.", type: "data", sourceLabel: "Input passage", trust: "medium" },
      { content: "Key evidence: Access appears to improve for renters, but the passage does not provide the underlying numbers.", type: "evidence", sourceLabel: "Input passage", trust: "unverified" },
      { content: "Why it matters: Financing and local policy may determine whether the model works outside the pilots.", type: "insight", sourceLabel: "Interpretation", trust: "low" },
      { content: "Limitation: The evidence is early and lacks long-term results.", type: "risk", sourceLabel: "Input passage", trust: "high" },
      { content: "Open question: Which financing and policy conditions produce durable adoption?", type: "gap", sourceLabel: "Derived question", trust: "unverified" },
      { content: "Suggested next step: Find the full paper and verify the pilot sample sizes, timeframe, and measured outcomes.", type: "idea", sourceLabel: "Research follow-up", trust: "high" },
    ];
  }
  if (role) {
    return [
      { content: `[${role}] Name the real constraint you're avoiding naming.`, type: "role" },
      { content: `[${role}] What would change your mind in 14 days?`, type: "role" },
      { content: `[${role}] Separate reversible moves from permanent ones.`, type: "role" },
      { content: `[${role}] One metric that proves this is working.`, type: "role" },
    ];
  }
  if (mode === "debate") {
    return [
      { content: "This path opens growth you may not get later.", type: "optimist" },
      { content: "Downside and uncertainty may be larger than they look.", type: "pessimist" },
      { content: "What evidence would change your mind either way?", type: "question" },
      { content: "People overestimate short-term pain, underestimate drift.", type: "insight" },
      { content: "Design a reversible experiment instead of a permanent leap.", type: "optimist" },
      { content: "Identity and income shocks hit harder than plans admit.", type: "pessimist" },
    ];
  }
  if (mode === "parallel") {
    return [
      { content: "Ship a minimal version now and learn in public.", type: "opportunity", path: "pathA" },
      { content: "Risk: reputation hit if quality is rough.", type: "risk", path: "pathA" },
      { content: "Insight: speed compounds only if feedback is real.", type: "insight", path: "pathA" },
      { content: "Wait, strengthen the offer, then launch once.", type: "idea", path: "pathB" },
      { content: "Risk: waiting becomes endless polish.", type: "risk", path: "pathB" },
      { content: "Opportunity: better positioning with more signal.", type: "opportunity", path: "pathB" },
      { content: "Run a 2-week pilot with 10 users only.", type: "idea", path: "pathC" },
      { content: "Risk: pilot too small to teach anything.", type: "risk", path: "pathC" },
      { content: "Insight: reversible tests beat binary decisions.", type: "insight", path: "pathC" },
    ];
  }
  if (mode === "research") {
    const idea = (question || "this idea").slice(0, 60);
    return [
      {
        content: `Core problem behind "${idea}" needs a crisp one-line definition before building.`,
        type: "question",
        sourceLabel: "Validation frame",
        trust: "medium",
      },
      {
        content: "Similar tools already exist; differentiation must be distribution or niche, not features alone.",
        type: "competitor",
        sourceLabel: "Market pattern",
        trust: "medium",
      },
      {
        content: "Students/users often try productivity apps once then churn without habit loops.",
        type: "claim",
        sourceLabel: "Behavioral pattern",
        trust: "medium",
      },
      {
        content: "Willingness to pay is weak unless the tool saves time weekly or is required by a course/job.",
        type: "market",
        sourceLabel: "Demand signal",
        trust: "low",
      },
      {
        content: "Gap: few products combine evidence-backed research with a decision canvas (not another chat).",
        type: "gap",
        sourceLabel: "White space",
        trust: "unverified",
      },
      {
        content: "Counter: building research UX is hard; shallow summaries create false confidence.",
        type: "contradiction",
        sourceLabel: "Risk of AI research",
        trust: "high",
      },
      {
        content: "Evidence needed: 10 target users interviewed; 3 would pay or switch from current tool.",
        type: "evidence",
        sourceLabel: "Suggested test",
        trust: "medium",
      },
      {
        content: "Biggest risk: looking researched while shipping opinions labeled as evidence.",
        type: "risk",
        sourceLabel: "Integrity risk",
        trust: "high",
      },
    ];
  }
  const q = (question || "").toLowerCase();
  if (q.includes("quit") || q.includes("job") || q.includes("startup")) {
    return [
      { content: "What is the real cost of staying vs leaving in 12 months?", type: "question" },
      { content: "Runway: 6–12 months savings or clear side income?", type: "risk" },
      { content: "Building your own compounds skill + equity differently.", type: "opportunity" },
      { content: "Validate while employed if possible.", type: "idea" },
      { content: "Define a 90-day experiment, not a permanent leap.", type: "decision" },
      { content: "Is fear of regret louder than evidence?", type: "challenge" },
    ];
  }
  return [
    { content: `Core question: "${(question || "").slice(0, 80)}"`, type: "question" },
    { content: "What would future-you advise in 3 years?", type: "question" },
    { content: "Biggest hidden risk without more data.", type: "risk" },
    { content: "Biggest upside easy to underestimate.", type: "opportunity" },
    { content: "Clarity comes after small experiments.", type: "insight" },
    { content: "Define a 7 or 30-day test, not a permanent decision.", type: "idea" },
  ];
}
