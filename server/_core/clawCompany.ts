/**
 * ClawCompany — Multi-Agent C-Suite Delegation
 *
 * Routes tasks to the right executive agent (CEO/CFO/CTO/COO/CMO/CSO).
 * Each role has its own system prompt, focus area, and response style.
 * The orchestrator (CEO) can delegate to specialists and synthesize.
 */

import { callClaude, streamClaude, type ClaudeMessage } from "./anthropic";

export type ExecutiveRole = "ceo" | "cfo" | "cto" | "coo" | "cmo" | "cso";

type ExecutiveConfig = {
  role: ExecutiveRole;
  title: string;
  emoji: string;
  model: "claude-opus-4-20250514" | "claude-sonnet-4-20250514";
  focus: string;
  systemPrompt: string;
};

const EXECUTIVES: Record<ExecutiveRole, ExecutiveConfig> = {
  ceo: {
    role: "ceo",
    title: "Chief Executive Officer",
    emoji: "👑",
    model: "claude-opus-4-20250514",
    focus: "vision, strategy, high-stakes decisions, orchestration",
    systemPrompt: `You are the CEO of Mantra, an AI Co-Founder platform. You operate at the strategic level — mission, vision, priorities, and high-stakes decisions. You see the whole chess board.

Your job:
- Set direction and priorities when given ambiguous or complex goals
- Make final calls when trade-offs exist between speed, cost, and quality
- Synthesise input from your C-suite and present unified strategic recommendations
- Always root advice in the Minimalist Entrepreneur principles: community first, validate before building, processize before productizing, profitability over growth

Be decisive, concise, and ambitious. Think in years, not weeks.`,
  },
  cfo: {
    role: "cfo",
    title: "Chief Financial Officer",
    emoji: "💹",
    model: "claude-sonnet-4-20250514",
    focus: "financial strategy, unit economics, tax, fundraising, cash management",
    systemPrompt: `You are the CFO of Mantra. You own financial strategy, unit economics, and capital allocation.

Your responsibilities:
- Model unit economics (CAC, LTV, payback period, gross margin)
- Advise on fundraising strategy (bootstrapped vs VC, SAFE vs priced round)
- Tax structure: NHR Portugal, UAE Freezone, Singapore, holding companies
- Cash runway: burn rate, default alive scenarios, revenue forecasting
- International banking and treasury management

Always provide specific numbers and frameworks. Flag when assumptions are speculative. Think in first principles about whether a business model can be profitable.`,
  },
  cto: {
    role: "cto",
    title: "Chief Technology Officer",
    emoji: "⚙️",
    model: "claude-sonnet-4-20250514",
    focus: "technical architecture, stack decisions, code quality, scaling",
    systemPrompt: `You are the CTO of Mantra. You own technical architecture, engineering standards, and technology decisions.

Your responsibilities:
- Architecture decisions: monolith vs microservices, database selection, API design
- Stack recommendations: match technology to team size and scale requirements
- Code quality: review approaches, testing strategies, CI/CD
- Infrastructure: hosting, CDN, edge computing, observability
- Security: auth patterns, data encryption, compliance

Always justify technology choices with trade-offs. Prefer boring, proven technology for early-stage companies. Avoid premature optimization.`,
  },
  coo: {
    role: "coo",
    title: "Chief Operating Officer",
    emoji: "⚡",
    model: "claude-sonnet-4-20250514",
    focus: "operations, processes, team, execution, systems",
    systemPrompt: `You are the COO of Mantra. You own operations, processes, and execution.

Your responsibilities:
- Process design: turn manual workflows into repeatable systems
- Team structure: hiring order, org design, remote team management
- Execution frameworks: OKRs, sprints, weekly reviews
- Vendor management: tools, services, contractors
- Customer operations: support, onboarding, retention playbooks

Always bias toward doing things manually first (processize before productize). Build the simplest process that could possibly work. Document it before automating it.`,
  },
  cmo: {
    role: "cmo",
    title: "Chief Marketing Officer",
    emoji: "📣",
    model: "claude-sonnet-4-20250514",
    focus: "marketing strategy, content, growth, brand, community",
    systemPrompt: `You are the CMO of Mantra. You own marketing strategy, brand, and growth.

Your responsibilities:
- Go-to-market: positioning, messaging, launch strategy
- Content marketing: editorial calendar, SEO, thought leadership
- Community building: where your audience lives and how to serve them
- Paid acquisition: channel selection, creative strategy, ROAS targets
- Brand: voice, visual identity, differentiation

Always apply Minimalist Entrepreneur principles: community first, content before ads, organic before paid. Marketing comes after product-market fit. Start with the channel where your customers already gather.`,
  },
  cso: {
    role: "cso",
    title: "Chief Sales Officer",
    emoji: "🤝",
    model: "claude-sonnet-4-20250514",
    focus: "sales strategy, pipeline, pricing, partnerships, customer success",
    systemPrompt: `You are the CSO of Mantra. You own revenue generation, sales process, and customer success.

Your responsibilities:
- Sales strategy: ICP definition, outreach sequences, closing techniques
- Pipeline: CRM setup, stage definitions, forecasting
- Pricing: packaging, value-based pricing, enterprise vs PLG
- Partnerships: channel partners, referrals, integrations
- Customer success: onboarding, expansion, churn prevention

Always start with manual sales before hiring. The founder should close the first 10-25 customers personally. Don't build a sales process until you understand why people buy and why they churn.`,
  },
};

// ─────────────────────────────────────────────────────────────
// Delegation detection — figures out which exec should handle it
// ─────────────────────────────────────────────────────────────

const ROLE_TRIGGERS: Record<ExecutiveRole, string[]> = {
  ceo: ["strategy", "vision", "priority", "ceo", "orchestrate", "roadmap", "direction", "goal"],
  cfo: ["budget", "revenue", "profit", "unit economics", "fundraise", "runway", "burn", "cfo", "financial", "cac", "ltv", "saas metrics", "valuation"],
  cto: ["architecture", "stack", "database", "api", "code", "deploy", "infrastructure", "cto", "technical", "backend", "frontend", "security", "performance"],
  coo: ["process", "operations", "team", "hiring", "coo", "workflow", "system", "onboarding", "vendor", "okr"],
  cmo: ["marketing", "brand", "content", "growth", "cmo", "seo", "ads", "campaign", "launch", "community", "audience"],
  cso: ["sales", "pipeline", "cso", "customer", "pricing", "outreach", "close", "churn", "partnership", "crm"],
};

export function detectExecutiveRole(message: string): ExecutiveRole {
  const lower = message.toLowerCase();
  let bestRole: ExecutiveRole = "ceo";
  let bestScore = 0;

  for (const [role, triggers] of Object.entries(ROLE_TRIGGERS)) {
    const score = triggers.reduce((acc, t) => acc + (lower.includes(t) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestRole = role as ExecutiveRole;
    }
  }
  return bestRole;
}

// ─────────────────────────────────────────────────────────────
// Single-exec call
// ─────────────────────────────────────────────────────────────

export async function callExecutive(
  role: ExecutiveRole,
  messages: ClaudeMessage[]
): Promise<{ role: ExecutiveRole; title: string; emoji: string; reply: string }> {
  const config = EXECUTIVES[role];
  const reply = await callClaude({
    system: config.systemPrompt,
    messages,
    model: config.model,
    maxTokens: 2048,
  });
  return { role, title: config.title, emoji: config.emoji, reply };
}

// ─────────────────────────────────────────────────────────────
// Board session — CEO delegates to relevant specialists, synthesises
// ─────────────────────────────────────────────────────────────

export type BoardSessionResult = {
  synthesis: string;
  contributions: Array<{ role: ExecutiveRole; title: string; emoji: string; insight: string }>;
};

export async function runBoardSession(
  task: string,
  history: ClaudeMessage[],
  roles: ExecutiveRole[] = ["cfo", "cto", "coo"]
): Promise<BoardSessionResult> {
  // Run specialist execs in parallel
  const specialistPrompt = `${task}\n\nProvide your specialist perspective in 2-3 focused paragraphs. Be concrete and actionable.`;
  
  const specialistResults = await Promise.all(
    roles.map((role) =>
      callExecutive(role, [...history, { role: "user", content: specialistPrompt }])
    )
  );

  // CEO synthesises
  const contributionsSummary = specialistResults
    .map((r) => `${r.emoji} ${r.title}:\n${r.reply}`)
    .join("\n\n---\n\n");

  const ceoBriefing = `You asked your C-suite to weigh in on: "${task}"

Here is what your executive team said:

${contributionsSummary}

---
As CEO, synthesise their input into a clear, decisive recommendation. Identify the #1 priority and the first concrete action to take. Be direct.`;

  const ceoCfg = EXECUTIVES["ceo"];
  const synthesis = await callClaude({
    system: ceoCfg.systemPrompt,
    messages: [...history, { role: "user", content: ceoBriefing }],
    model: ceoCfg.model,
    maxTokens: 1024,
  });

  return {
    synthesis,
    contributions: specialistResults.map((r) => ({
      role: r.role,
      title: r.title,
      emoji: r.emoji,
      insight: r.reply,
    })),
  };
}

export { EXECUTIVES };
