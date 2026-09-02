"use client";

import { useEffect } from "react";
import { useMindStore } from "./store";
import { generateInitialThoughts, expandThought, challengeThought, generateDecisionSummary } from "./ai";

/**
 * Registers MindLink capabilities as WebMCP tools.
 * Works when the browser supports document.modelContext (Chrome flag / ChatGPT browser).
 * Gracefully no-ops otherwise.
 */
export function useWebMCPTools() {
  const store = useMindStore;

  useEffect(() => {
    const ctx =
      typeof document !== "undefined"
        ? (document as any).modelContext || (navigator as any).modelContext
        : null;

    if (!ctx || typeof ctx.registerTool !== "function") {
      console.info("[MindLink] WebMCP not available in this browser — tools not registered.");
      return;
    }

    const controllers: AbortController[] = [];

    const register = (tool: any) => {
      const controller = new AbortController();
      controllers.push(controller);
      try {
        ctx.registerTool(tool, { signal: controller.signal });
      } catch (e) {
        // Some implementations take only the tool object
        try {
          ctx.registerTool(tool);
        } catch (err) {
          console.warn("[MindLink] Failed to register tool", tool.name, err);
        }
      }
    };

    // 1. Start a new thinking session
    register({
      name: "start_thinking_session",
      description:
        "Start a new shared thinking session on MindLink with a question or decision the user wants to explore. The AI will begin adding thoughts to the canvas.",
      inputSchema: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The question, decision, or topic to explore together",
          },
        },
        required: ["question"],
      },
      async execute({ question }: { question: string }) {
        store.getState().startSession(question);
        return {
          content: [
            {
              type: "text",
              text: `Started MindLink session for: "${question}". AI is now generating thoughts on the canvas.`,
            },
          ],
        };
      },
    });

    // 2. Add a thought
    register({
      name: "add_thought",
      description:
        "Add a new thought bubble to the shared mind canvas. Use this to contribute ideas, risks, opportunities, questions, insights, challenges or data points.",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "The text content of the thought" },
          type: {
            type: "string",
            enum: ["question", "idea", "risk", "opportunity", "insight", "decision", "challenge", "data"],
            description: "Category of the thought",
          },
        },
        required: ["content", "type"],
      },
      async execute({ content, type }: { content: string; type: any }) {
        const id = store.getState().addThought(content, type, "ai");
        return {
          content: [{ type: "text", text: `Added ${type} thought (id: ${id}): ${content}` }],
        };
      },
    });

    // 3. Expand a thought
    register({
      name: "expand_thought",
      description: "Deepen a specific thought by generating related questions, insights and next steps around it.",
      inputSchema: {
        type: "object",
        properties: {
          thought_id: { type: "string", description: "ID of the thought to expand" },
        },
        required: ["thought_id"],
      },
      async execute({ thought_id }: { thought_id: string }) {
        const thought = store.getState().getThought(thought_id);
        if (!thought) {
          return { content: [{ type: "text", text: "Thought not found" }] };
        }
        const expansions = await expandThought(thought.content, store.getState().session?.question || "");
        const ids: string[] = [];
        for (const e of expansions) {
          const id = store.getState().addThought(e.content, e.type, "ai");
          store.getState().addConnection(thought_id, id);
          ids.push(id);
        }
        return {
          content: [
            {
              type: "text",
              text: `Expanded thought. Created ${ids.length} new related thoughts.`,
            },
          ],
        };
      },
    });

    // 4. Challenge a thought
    register({
      name: "challenge_thought",
      description: "Generate a counter-point or critical challenge to an existing thought on the canvas.",
      inputSchema: {
        type: "object",
        properties: {
          thought_id: { type: "string", description: "ID of the thought to challenge" },
        },
        required: ["thought_id"],
      },
      async execute({ thought_id }: { thought_id: string }) {
        const thought = store.getState().getThought(thought_id);
        if (!thought) {
          return { content: [{ type: "text", text: "Thought not found" }] };
        }
        const challenge = await challengeThought(thought.content);
        const id = store.getState().addThought(challenge.content, challenge.type, "ai");
        store.getState().addConnection(thought_id, id, "challenges");
        return {
          content: [{ type: "text", text: `Challenged the thought. New challenge id: ${id}` }],
        };
      },
    });

    // 5. Get current canvas state
    register({
      name: "get_canvas_state",
      description:
        "Return the current state of the MindLink canvas: the question being explored, all thoughts with their types and IDs, and connections.",
      inputSchema: {
        type: "object",
        properties: {},
      },
      async execute() {
        const session = store.getState().session;
        if (!session) {
          return { content: [{ type: "text", text: "No active session. Call start_thinking_session first." }] };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  question: session.question,
                  status: session.status,
                  thoughts: session.thoughts.map((t) => ({
                    id: t.id,
                    type: t.type,
                    content: t.content,
                    author: t.author,
                    pinned: t.pinned,
                  })),
                  connections: session.connections,
                  finalDecision: session.finalDecision,
                },
                null,
                2
              ),
            },
          ],
        };
      },
    });

    // 6. Lock decision
    register({
      name: "lock_decision",
      description:
        "Lock a final decision summary on the canvas. Only call this when the human has reviewed the thinking and is ready to conclude.",
      inputSchema: {
        type: "object",
        properties: {
          decision: {
            type: "string",
            description: "The final decision or conclusion text",
          },
          confirmed_by_human: {
            type: "boolean",
            description: "Must be true — confirms the human approved locking",
          },
        },
        required: ["decision", "confirmed_by_human"],
      },
      async execute({
        decision,
        confirmed_by_human,
      }: {
        decision: string;
        confirmed_by_human: boolean;
      }) {
        if (!confirmed_by_human) {
          return {
            content: [
              {
                type: "text",
                text: "Cannot lock decision without explicit human confirmation (confirmed_by_human must be true).",
              },
            ],
          };
        }
        store.getState().lockDecision(decision);
        return {
          content: [{ type: "text", text: `Decision locked: ${decision}` }],
        };
      },
    });

    // 7. Add human-style thought (for agents acting as collaborator)
    register({
      name: "list_thought_types",
      description: "List available thought types and their meanings on the MindLink canvas.",
      inputSchema: { type: "object", properties: {} },
      async execute() {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  question: "Open questions to explore",
                  idea: "Concrete ideas or next steps",
                  risk: "Downside / danger",
                  opportunity: "Upside / potential",
                  insight: "Realization or principle",
                  decision: "A possible conclusion",
                  challenge: "Counter-argument or critique",
                  data: "Fact or evidence",
                },
                null,
                2
              ),
            },
          ],
        };
      },
    });

    // 8. Retrieve real research papers for the workspace
    register({
      name: "find_research_papers",
      description:
        "Search OpenAlex for real research papers related to a topic, returning titles, authors, years, citations, open-access status, abstracts, and source links.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Research topic, question, or keywords" },
        },
        required: ["query"],
      },
      async execute({ query }: { query: string }) {
        const response = await fetch(`/api/papers?search=${encodeURIComponent(query)}`);
        const data = await response.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data) }],
        };
      },
    });

    console.info("[MindLink] WebMCP tools registered successfully.");

    return () => {
      controllers.forEach((c) => c.abort());
    };
  }, []);
}
