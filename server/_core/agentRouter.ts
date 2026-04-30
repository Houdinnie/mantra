/**
 * Mantra Agent Router — v2
 *
 * Detects persona, routes slash commands, detects board/franklin invocations,
 * and assembles the full system prompt for every Claude call.
 */

import { VENTUREMIND_SKILLS, MINIMALIST_PRINCIPLES, SKILL_GATE_RULES } from "./ventureMind";

// ─────────────────────────────────────────────────────────────
// Persona definitions
// ─────────────────────────────────────────────────────────────

export type PersonaId =
  | "ideator" | "tax-strategist" | "entity-lawyer" | "compliance-officer"
  | "nomad-navigator" | "luxury-concierge" | "health-wellness" | "wealth-advisor"
  | "default";

type Persona = {
  id: PersonaId;
  name: string;
  emoji: string;
  triggers: string[];
  systemAddendum: string;
};

const PERSONAS: Persona[] = [
  {
    id: "ideator", name: "Ideator", emoji: "💡",
    triggers: ["startup", "business idea", "validate", "community", "mvp", "launch", "product", "saas", "app idea"],
    systemAddendum: `You are the Ideator persona. Help founders validate, processize and launch ideas using the Minimalist Entrepreneur methodology. Push community validation before building. Reference the 7 pillars when relevant.`,
  },
  {
    id: "tax-strategist", name: "Tax Strategist", emoji: "💰",
    triggers: ["tax", "nhr", "portugal", "uae", "singapore", "residency", "holding company", "treaty", "offshore", "taxation"],
    systemAddendum: `You are the Tax Strategist persona. Specialise in international tax optimisation, NHR programs, UAE Freezone, Singapore incentives, and tax treaty analysis. Provide strategic frameworks; recommend consulting a qualified advisor for implementation.`,
  },
  {
    id: "entity-lawyer", name: "Entity Lawyer", emoji: "⚖️",
    triggers: ["llc", "company", "entity", "structure", "incorporate", "legal", "liability", "shareholder", "contract"],
    systemAddendum: `You are the Entity Lawyer persona. Help founders choose and structure legal entities. Explain trade-offs clearly. Always note that final legal decisions require a qualified attorney.`,
  },
  {
    id: "compliance-officer", name: "Compliance Officer", emoji: "🔐",
    triggers: ["gdpr", "soc2", "compliance", "audit", "data privacy", "regulation", "kyc", "aml"],
    systemAddendum: `You are the Compliance Officer persona. Guide teams through GDPR, SOC 2, KYC/AML, and substance requirements. Be precise, cite relevant frameworks, flag areas requiring specialist legal review.`,
  },
  {
    id: "nomad-navigator", name: "Nomad Navigator", emoji: "🗺️",
    triggers: ["visa", "d7", "digital nomad", "travel", "nomad", "presence days", "183 days", "golden visa", "relocation"],
    systemAddendum: `You are the Nomad Navigator persona. Help digital nomads optimise visa strategies, track physical presence requirements, plan compliant relocations, and navigate golden visa programs.`,
  },
  {
    id: "luxury-concierge", name: "Luxury Concierge", emoji: "✈️",
    triggers: ["luxury", "first class", "private jet", "hotel", "upgrade", "vip", "concierge", "premium", "points", "miles"],
    systemAddendum: `You are the Luxury Concierge persona. Help access premium travel, hotel programs, empty-leg flights, and exclusive experiences. Be specific about loyalty programs, upgrade strategies, and cost-saving tactics.`,
  },
  {
    id: "health-wellness", name: "Wellness Director", emoji: "🏥",
    triggers: ["health", "fitness", "wellness", "longevity", "biohacking", "sleep", "nutrition", "clinic", "insurance"],
    systemAddendum: `You are the Wellness Director persona. Guide founders on health optimisation, international health insurance, longevity protocols, and finding quality clinics abroad. Always recommend consulting qualified medical professionals.`,
  },
  {
    id: "wealth-advisor", name: "Wealth Architect", emoji: "📈",
    triggers: ["invest", "portfolio", "crypto", "stocks", "etf", "fund", "wealth", "asset", "banking", "dividend"],
    systemAddendum: `You are the Wealth Architect persona. Help build investment strategies, select banking structures, evaluate crypto positions. Provide frameworks and context — not personalised financial advice.`,
  },
];

// ─────────────────────────────────────────────────────────────
// Route types
// ─────────────────────────────────────────────────────────────

export type RouteType =
  | "standard"
  | "skill"
  | "board_session"
  | "marketing"
  | "trading"
  | "content"
  | "web_search"
  | "morning_digest"
  | "milliondollaridea"
  | "brain_status"
  | "brain_recall"
  | "task_dispatch"
  | "deep_read"
  | "sandbox_redirect";

// ─────────────────────────────────────────────────────────────
// Slash command detection
// ─────────────────────────────────────────────────────────────

type SkillMatch = {
  skill: (typeof VENTUREMIND_SKILLS)[number] | null;
  tier: "high" | "medium" | "low" | null;
  cleanedMessage: string;
  routeType: RouteType;
  franklinType?: "marketing" | "trading" | "content";
  boardRoles?: string[];
};

const SPECIAL_COMMANDS: Record<string, RouteType> = {
  "/board": "board_session",
  "/ceo": "board_session",
  "/search": "web_search",
  "/research": "web_search",
  "/digest": "morning_digest",
  "/morning": "morning_digest",
  "/milliondollaridea": "milliondollaridea",
  "/mdi": "milliondollaridea",
  "/brain": "brain_status",
  "/neuro": "brain_status",
  "/recall": "brain_recall",
  "/remember": "brain_recall",
  "/task": "task_dispatch",
  "/do": "task_dispatch",
  "/automate": "task_dispatch",
  "/deepread": "deep_read",
  "/read": "deep_read",
  "/ingest": "deep_read",
  "/sandbox": "sandbox_redirect",
  "/box": "sandbox_redirect",
  "/execute": "sandbox_redirect",
};

const FRANKLIN_COMMANDS: Record<string, "marketing" | "trading" | "content"> = {
  "/marketing": "marketing",
  "/trading": "trading",
  "/content": "content",
  "/franklin": "marketing",
};

export function detectSkillCommand(message: string): SkillMatch {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();
  const firstWord = lower.split(/\s/)[0];

  // Check special commands
  if (SPECIAL_COMMANDS[firstWord]) {
    return {
      skill: null, tier: null,
      cleanedMessage: trimmed.slice(firstWord.length).trim() || trimmed,
      routeType: SPECIAL_COMMANDS[firstWord],
    };
  }

  // Check Franklin commands
  if (FRANKLIN_COMMANDS[firstWord]) {
    return {
      skill: null, tier: null,
      cleanedMessage: trimmed.slice(firstWord.length).trim() || trimmed,
      routeType: FRANKLIN_COMMANDS[firstWord] as RouteType,
      franklinType: FRANKLIN_COMMANDS[firstWord],
    };
  }

  // Check VentureMind skill commands
  for (const skill of VENTUREMIND_SKILLS) {
    if (lower.startsWith(skill.invoke)) {
      const tier = SKILL_GATE_RULES.highImpact.includes(skill.id) ? "high"
        : SKILL_GATE_RULES.mediumImpact.includes(skill.id) ? "medium" : "low";
      return {
        skill, tier,
        cleanedMessage: trimmed.slice(skill.invoke.length).trim() || `Help me with: ${skill.name}`,
        routeType: "skill",
      };
    }
  }

  return { skill: null, tier: null, cleanedMessage: message, routeType: "standard" };
}

// ─────────────────────────────────────────────────────────────
// Persona detection
// ─────────────────────────────────────────────────────────────

export function detectPersona(message: string, history: Array<{ role: string; content: string }>): Persona {
  const contextWindow = [message, ...history.slice(-4).map((m) => m.content)].join(" ").toLowerCase();
  let bestMatch: Persona | null = null;
  let bestScore = 0;

  for (const persona of PERSONAS) {
    const score = persona.triggers.reduce((acc, t) => acc + (contextWindow.includes(t) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestMatch = persona; }
  }

  return bestMatch ?? ({ id: "default", name: "Mantra", emoji: "🤖" } as unknown as Persona);
}

// ─────────────────────────────────────────────────────────────
// System prompt assembly
// ─────────────────────────────────────────────────────────────

const BASE_SYSTEM = `You are Mantra — an AI Co-Founder platform powered by Claude. You combine the Minimalist Entrepreneur methodology with specialist expertise across tax, legal, compliance, nomad life, luxury, wellness, and wealth.

Your core operating principles:
${MINIMALIST_PRINCIPLES.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Always:
- Be direct, concrete, and action-oriented
- Break complex tasks into verifiable steps
- Flag when a decision requires a licensed professional (legal/tax/medical/financial)
- Mirror the user's language and energy
- Avoid filler — every sentence should move the user forward`;

export type RoutingResult = {
  systemPrompt: string;
  userMessage: string;
  persona: Persona | { id: "default"; name: string; emoji: string };
  skill: SkillMatch["skill"];
  tier: SkillMatch["tier"];
  routeType: RouteType;
  franklinType?: "marketing" | "trading" | "content";
  useWebSearch: boolean;
};

export function routeMessage(rawMessage: string, history: Array<{ role: string; content: string }>): RoutingResult {
  const skillMatch = detectSkillCommand(rawMessage);
  const persona = detectPersona(skillMatch.cleanedMessage, history);

  // Detect if this is a research-heavy question even without /search command
  const needsSearch = skillMatch.routeType === "web_search"
    || /\b(latest|current|today|this week|news|recent|2024|2025|2026|market cap|stock price|exchange rate)\b/i.test(rawMessage);

  const parts: string[] = [BASE_SYSTEM];

  if (persona.id !== "default") {
    parts.push(`\n---\n## Active Persona: ${(persona as Persona).emoji} ${persona.name}\n${(persona as Persona).systemAddendum}`);
  }

  if (skillMatch.skill) {
    const depth = skillMatch.tier === "high"
      ? "Provide an in-depth, structured analysis with headers, numbered steps, and concrete examples. This is a high-impact decision."
      : skillMatch.tier === "medium"
      ? "Provide a thorough but focused response with practical steps and clear trade-offs."
      : "Provide a concise, actionable response.";
    parts.push(`\n---\n## Active Skill: ${skillMatch.skill.name}\nPrinciple: "${skillMatch.skill.principle}"\n${skillMatch.skill.description}\n\nDepth: ${depth}`);
  }

  if (needsSearch) {
    parts.push(`\n---\nThis query benefits from current information. Use your web search capability to find up-to-date data before responding. Cite sources inline.`);
  }

  parts.push(`\n---\nAvailable slash commands:\n${VENTUREMIND_SKILLS.map((s) => `• ${s.invoke} — ${s.name}`).join("\n")}\n• /board — Convene C-suite (CEO, CFO, CTO, COO, CMO, CSO)\n• /search — Web search mode\n• /marketing — Franklin marketing agent\n• /trading — Franklin trading research\n• /content — Franklin content creator\n• /digest — Morning briefing`);

  return {
    systemPrompt: parts.join("\n"),
    userMessage: skillMatch.cleanedMessage,
    persona,
    skill: skillMatch.skill,
    tier: skillMatch.tier,
    routeType: skillMatch.routeType,
    franklinType: skillMatch.franklinType,
    useWebSearch: needsSearch,
  };
}
