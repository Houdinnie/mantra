/**
 * Mantra Agent Router
 *
 * Detects the active persona from conversation context, routes slash-command
 * skill invocations, and assembles the full system prompt that gets sent to
 * Claude on every turn.
 */

import { VENTUREMIND_SKILLS, MINIMALIST_PRINCIPLES, SKILL_GATE_RULES } from "./ventureMind";

// ─────────────────────────────────────────────────────────────
// Persona definitions
// ─────────────────────────────────────────────────────────────

export type PersonaId =
  | "ideator"
  | "tax-strategist"
  | "entity-lawyer"
  | "compliance-officer"
  | "nomad-navigator"
  | "luxury-concierge"
  | "health-wellness"
  | "wealth-advisor"
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
    id: "ideator",
    name: "Ideator",
    emoji: "💡",
    triggers: ["startup", "business idea", "validate", "community", "mvp", "launch", "product", "saas", "app idea"],
    systemAddendum: `You are operating as the Ideator persona. Your job is to help founders validate, processize and launch ideas using the Minimalist Entrepreneur methodology. Always push the user toward community validation before building. Reference the 7 pillars when relevant. Encourage shipping the smallest useful thing first.`,
  },
  {
    id: "tax-strategist",
    name: "Tax Strategist",
    emoji: "💰",
    triggers: ["tax", "nhr", "portugal", "uae", "singapore", "residency", "holding company", "treaty", "offshore", "taxation"],
    systemAddendum: `You are operating as the Tax Strategist persona. You specialise in international tax optimisation, NHR programs, UAE Freezone structures, Singapore incentives, and tax treaty analysis. Always clarify that you provide strategic frameworks, not formal legal or tax advice, and recommend consulting a qualified advisor for implementation.`,
  },
  {
    id: "entity-lawyer",
    name: "Entity Lawyer",
    emoji: "⚖️",
    triggers: ["llc", "company", "entity", "structure", "incorporate", "legal", "liability", "shareholder", "contract"],
    systemAddendum: `You are operating as the Entity Lawyer persona. You help founders choose and structure legal entities — LLCs, C-Corps, Freezone entities, holding structures. Explain trade-offs clearly. Always note that final legal decisions require a qualified attorney.`,
  },
  {
    id: "compliance-officer",
    name: "Compliance Officer",
    emoji: "🔐",
    triggers: ["gdpr", "soc2", "compliance", "audit", "data privacy", "regulation", "kyc", "aml"],
    systemAddendum: `You are operating as the Compliance Officer persona. You guide teams through regulatory requirements: GDPR, SOC 2, KYC/AML, and substance requirements for offshore structures. Be precise, cite relevant frameworks, and flag any areas requiring specialist legal review.`,
  },
  {
    id: "nomad-navigator",
    name: "Nomad Navigator",
    emoji: "🗺️",
    triggers: ["visa", "d7", "digital nomad", "travel", "nomad", "presence days", "183 days", "golden visa", "relocation"],
    systemAddendum: `You are operating as the Nomad Navigator persona. You help digital nomads and entrepreneurs optimise visa strategies, track physical presence requirements, plan compliant relocations, and navigate golden visa programs. Be practical, specific, and flag official sources to verify.`,
  },
  {
    id: "luxury-concierge",
    name: "Luxury Concierge",
    emoji: "✈️",
    triggers: ["luxury", "first class", "private jet", "hotel", "upgrade", "vip", "concierge", "premium", "points", "miles"],
    systemAddendum: `You are operating as the Luxury Concierge persona. You help high-net-worth individuals access premium travel, hotel programs, empty-leg flights, and exclusive experiences. Be specific about loyalty programs, upgrade strategies, and cost-saving tactics within the premium tier.`,
  },
  {
    id: "health-wellness",
    name: "Wellness Director",
    emoji: "🏥",
    triggers: ["health", "fitness", "wellness", "longevity", "biohacking", "sleep", "nutrition", "clinic", "insurance"],
    systemAddendum: `You are operating as the Wellness Director persona. You guide founders and nomads on health optimisation, international health insurance, longevity protocols, and finding quality clinics abroad. Always recommend consulting qualified medical professionals for specific health decisions.`,
  },
  {
    id: "wealth-advisor",
    name: "Wealth Architect",
    emoji: "📈",
    triggers: ["invest", "portfolio", "crypto", "stocks", "etf", "fund", "wealth", "asset", "banking", "dividend"],
    systemAddendum: `You are operating as the Wealth Architect persona. You help entrepreneurs build investment strategies, select banking structures, evaluate crypto positions, and construct resilient portfolios. Always note that you provide frameworks and context — not personalised financial advice — and encourage working with a licensed advisor.`,
  },
];

// ─────────────────────────────────────────────────────────────
// Skill routing
// ─────────────────────────────────────────────────────────────

type SkillMatch = {
  skill: (typeof VENTUREMIND_SKILLS)[number] | null;
  tier: "high" | "medium" | "low" | null;
  cleanedMessage: string;
};

export function detectSkillCommand(message: string): SkillMatch {
  const trimmed = message.trim();

  for (const skill of VENTUREMIND_SKILLS) {
    if (trimmed.toLowerCase().startsWith(skill.invoke)) {
      const tier = SKILL_GATE_RULES.highImpact.includes(skill.id)
        ? "high"
        : SKILL_GATE_RULES.mediumImpact.includes(skill.id)
        ? "medium"
        : "low";

      return {
        skill,
        tier,
        // Strip the command prefix so the remainder is the user's context
        cleanedMessage: trimmed.slice(skill.invoke.length).trim() || `Help me with: ${skill.name}`,
      };
    }
  }

  return { skill: null, tier: null, cleanedMessage: message };
}

// ─────────────────────────────────────────────────────────────
// Persona detection
// ─────────────────────────────────────────────────────────────

export function detectPersona(
  message: string,
  history: Array<{ role: string; content: string }>
): Persona {
  // Check the last few messages for context (current message first)
  const contextWindow = [message, ...history.slice(-4).map((m) => m.content)].join(" ").toLowerCase();

  let bestMatch: Persona | null = null;
  let bestScore = 0;

  for (const persona of PERSONAS) {
    const score = persona.triggers.reduce(
      (acc, trigger) => acc + (contextWindow.includes(trigger) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      bestMatch = persona;
    }
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

type RoutingResult = {
  systemPrompt: string;
  userMessage: string;
  persona: Persona;
  skill: SkillMatch["skill"];
  tier: SkillMatch["tier"];
};

/**
 * Main routing function. Takes the raw user message + conversation history,
 * returns the assembled system prompt and normalised user message to send to Claude.
 */
export function routeMessage(
  rawMessage: string,
  history: Array<{ role: string; content: string }>
): RoutingResult {
  // 1. Detect skill command
  const skillMatch = detectSkillCommand(rawMessage);

  // 2. Detect persona (use cleaned message so /commands don't confuse it)
  const persona = detectPersona(skillMatch.cleanedMessage, history);

  // 3. Build system prompt layers
  const parts: string[] = [BASE_SYSTEM];

  // Persona addendum
  if (persona.id !== "default") {
    parts.push(`\n---\n## Active Persona: ${persona.emoji} ${persona.name}\n${persona.systemAddendum}`);
  }

  // Skill addendum
  if (skillMatch.skill) {
    const depthInstruction =
      skillMatch.tier === "high"
        ? "Provide an in-depth, structured analysis. Use headers, numbered steps, and concrete examples. This is a high-impact decision."
        : skillMatch.tier === "medium"
        ? "Provide a thorough but focused response. Use practical steps and clear trade-offs."
        : "Provide a concise, actionable response. Keep it practical and brief.";

    parts.push(
      `\n---\n## Active Skill: ${skillMatch.skill.name}\nPrinciple: "${skillMatch.skill.principle}"\nDescription: ${skillMatch.skill.description}\n\nDepth instruction: ${depthInstruction}`
    );
  }

  // Available skills reminder (brief)
  parts.push(
    `\n---\nAvailable slash commands the user can invoke at any time:\n${VENTUREMIND_SKILLS.map((s) => `• ${s.invoke} — ${s.name}`).join("\n")}`
  );

  return {
    systemPrompt: parts.join("\n"),
    userMessage: skillMatch.cleanedMessage,
    persona,
    skill: skillMatch.skill,
    tier: skillMatch.tier,
  };
}
