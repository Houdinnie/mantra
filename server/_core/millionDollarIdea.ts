/**
 * Million Dollar Idea Agent
 *
 * Runs a full board ideation session:
 * 1. CEO generates 5 raw ideas based on user context
 * 2. CFO stress-tests unit economics on each
 * 3. CMO validates market demand and community signals
 * 4. Web search confirms market size and competition for top idea
 * 5. Synthesises into 3 ranked opportunities with first actions
 */

import { callClaude } from "./anthropic";
import { callClaudeWithSearch } from "./searchTool";

export type IdeaContext = {
  skills?: string; // "I can code, write, and have 10 years in fintech"
  audience?: string; // "I work with solopreneurs"
  constraints?: string; // "bootstrapped, solo, remote"
  industries?: string; // "fintech, education, creator economy"
  rawContext?: string; // Free-form user input
};

export type BusinessIdea = {
  name: string;
  problem: string;
  solution: string;
  community: string; // Who you'd build for
  revenueModel: string;
  estimatedMRR: string; // "£1k–£5k MRR in 6 months"
  timeToFirstRevenue: string;
  buildComplexity: "weekend" | "1-month" | "3-months";
  whyNow: string;
  firstAction: string;
  cfoScore: number; // 1-10 unit economics rating
  cmoScore: number; // 1-10 market demand rating
  overallScore: number;
};

export type MillionDollarResult = {
  ideas: BusinessIdea[];
  topIdeaValidation: {
    marketSize: string;
    competitors: string[];
    whitespace: string;
    validationStep: string;
    sources: Array<{ url: string; title: string }>;
  };
  boardSummary: string;
};

const CEO_IDEATION_SYSTEM = `You are the CEO of Mantra running a high-stakes ideation board session. Your job is to generate raw business ideas using the Minimalist Entrepreneur framework.

Rules:
- Every idea must be buildable solo in under 3 months
- Every idea must be able to charge from day one
- Every idea must start with a specific community, not a product
- Prefer recurring revenue (subscriptions, retainers) over one-time sales
- Prefer boring problems that are underserved over exciting problems that are crowded
- Avoid VC-track ideas — focus on profitable lifestyle businesses

Output ONLY valid JSON array, no preamble:
[
  {
    "name": "string",
    "problem": "string (1 sentence, specific pain)",
    "solution": "string (1 sentence, minimum viable)",
    "community": "string (specific group of people)",
    "revenueModel": "string",
    "estimatedMRR": "string",
    "timeToFirstRevenue": "string",
    "buildComplexity": "weekend|1-month|3-months",
    "whyNow": "string (1-2 sentences, timing signal)"
  }
]`;

const CFO_SCORING_SYSTEM = `You are the CFO. Score each business idea on unit economics quality (1-10).
Consider: realistic LTV, low CAC potential, recurring revenue, gross margin, time to profitability.
Output ONLY JSON: [{ "name": "idea name", "cfoScore": number, "cfoNote": "1 sentence" }]`;

const CMO_SCORING_SYSTEM = `You are the CMO. Score each business idea on market demand and community accessibility (1-10).
Consider: community size, existing channels to reach them, content angle, word-of-mouth potential.
Output ONLY JSON: [{ "name": "idea name", "cmoScore": number, "cmoNote": "1 sentence" }]`;

const SYNTHESIS_SYSTEM = `You are the CEO synthesising a board session into a final ranked shortlist.
You will receive ideas with scores from CFO and CMO.
Output the top 3 ideas ranked by overall opportunity (combine scores, weight toward simplicity and speed to revenue).
Add a "firstAction" field to each (specific, doable this week).
Output ONLY valid JSON array of 3 BusinessIdea objects with all fields including cfoScore, cmoScore, overallScore, firstAction.`;

export async function runMillionDollarIdea(
  context: IdeaContext
): Promise<MillionDollarResult> {
  const contextStr =
    [
      context.skills && `Skills/background: ${context.skills}`,
      context.audience && `Audience I know: ${context.audience}`,
      context.constraints && `Constraints: ${context.constraints}`,
      context.industries && `Interested in: ${context.industries}`,
      context.rawContext && `Additional context: ${context.rawContext}`,
    ]
      .filter(Boolean)
      .join("\n") ||
    "No specific context provided — generate broadly applicable opportunities.";

  // Step 1 — CEO generates 5 raw ideas
  const rawIdeasJson = await callClaude({
    system: CEO_IDEATION_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Generate 5 business ideas for a founder with this context:\n\n${contextStr}\n\nReturn only the JSON array.`,
      },
    ],
    maxTokens: 2000,
  });

  let rawIdeas: Array<
    Omit<BusinessIdea, "cfoScore" | "cmoScore" | "overallScore" | "firstAction">
  > = [];
  try {
    rawIdeas = JSON.parse(rawIdeasJson.replace(/```json|```/g, "").trim());
  } catch {
    // Fallback: extract JSON array from response
    const match = rawIdeasJson.match(/\[[\s\S]*\]/);
    if (match) rawIdeas = JSON.parse(match[0]);
  }

  const ideasSummary = rawIdeas
    .map(
      (idea, i) =>
        `${i + 1}. ${idea.name}: ${idea.problem} → ${idea.solution} (${idea.revenueModel})`
    )
    .join("\n");

  // Step 2 — CFO and CMO score in parallel
  const [cfoJson, cmoJson] = await Promise.all([
    callClaude({
      system: CFO_SCORING_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Score these ideas:\n${ideasSummary}\n\nReturn only JSON array.`,
        },
      ],
      maxTokens: 500,
    }),
    callClaude({
      system: CMO_SCORING_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Score these ideas:\n${ideasSummary}\n\nReturn only JSON array.`,
        },
      ],
      maxTokens: 500,
    }),
  ]);

  let cfoScores: Array<{ name: string; cfoScore: number; cfoNote: string }> =
    [];
  let cmoScores: Array<{ name: string; cmoScore: number; cmoNote: string }> =
    [];

  try {
    cfoScores = JSON.parse(cfoJson.replace(/```json|```/g, "").trim());
  } catch {}
  try {
    cmoScores = JSON.parse(cmoJson.replace(/```json|```/g, "").trim());
  } catch {}

  // Step 3 — CEO synthesises top 3 with first actions
  const scoredIdeas = rawIdeas.map(idea => ({
    ...idea,
    cfoScore: cfoScores.find(s => s.name === idea.name)?.cfoScore ?? 5,
    cmoScore: cmoScores.find(s => s.name === idea.name)?.cmoScore ?? 5,
  }));

  const synthesisInput = JSON.stringify(scoredIdeas, null, 2);
  const topIdeasJson = await callClaude({
    system: SYNTHESIS_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Rank and refine these scored ideas into the top 3. Add firstAction and overallScore to each:\n\n${synthesisInput}\n\nReturn only JSON array of 3.`,
      },
    ],
    maxTokens: 2000,
  });

  let topIdeas: BusinessIdea[] = [];
  try {
    topIdeas = JSON.parse(topIdeasJson.replace(/```json|```/g, "").trim());
  } catch {
    const match = topIdeasJson.match(/\[[\s\S]*\]/);
    if (match) topIdeas = JSON.parse(match[0]);
  }

  // Step 4 — Web search validates the #1 idea
  const topIdea = topIdeas[0];
  let topIdeaValidation = {
    marketSize: "Unable to fetch",
    competitors: [] as string[],
    whitespace: "",
    validationStep:
      topIdea?.firstAction ??
      "Find 3 people with this problem and offer to solve it manually",
    sources: [] as Array<{ url: string; title: string }>,
  };

  if (topIdea) {
    const { reply, sources } = await callClaudeWithSearch({
      system: `You research market opportunities. Output ONLY valid JSON:
{
  "marketSize": "string (TAM estimate with source)",
  "competitors": ["string", "string", "string"],
  "whitespace": "string (1-2 sentences on the gap)",
  "validationStep": "string (specific action to validate this week)"
}`,
      messages: [
        {
          role: "user",
          content: `Research the market for: "${topIdea.name}" — ${topIdea.problem}
Targeting: ${topIdea.community}
Solution: ${topIdea.solution}

Find: market size, top 3 competitors, and the biggest whitespace opportunity. Return only JSON.`,
        },
      ],
      maxTokens: 1000,
    });

    try {
      const parsed = JSON.parse(reply.replace(/```json|```/g, "").trim());
      topIdeaValidation = { ...parsed, sources };
    } catch {
      topIdeaValidation.sources = sources;
    }
  }

  // Board summary
  const boardSummary = `Board session complete. ${topIdeas.length} ideas ranked. Top pick: **${topIdea?.name ?? "See list"}** scored ${topIdea?.overallScore ?? "—"}/10. Web-validated market: ${topIdeaValidation.marketSize}. Your first move: ${topIdeaValidation.validationStep}`;

  return { ideas: topIdeas, topIdeaValidation, boardSummary };
}
