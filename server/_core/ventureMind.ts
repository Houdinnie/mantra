/**
 * VentureMind - Minimalist Entrepreneur Operating System
 *
 * Powered by: Mantra (69 agents, 27 tools) + slavingia/skills (10 principles)
 *
 * Tagline: "From community to first-class cabin — validate, processize, optimize across borders, then scale sustainably."
 */

export const VENTUREMIND_SKILLS = [
  {
    id: "find-community",
    name: "Find Community",
    description:
      "Identify and evaluate communities to build a minimalist business around",
    principle: "Start with community, not with a product idea",
    invoke: "/find-community",
  },
  {
    id: "validate-idea",
    name: "Validate Idea",
    description:
      "Test if a business idea is worth pursuing before building anything",
    principle: "Validation happens through selling, not building",
    invoke: "/validate-idea",
  },
  {
    id: "mvp",
    name: "MVP Builder",
    description: "Define minimal scope; build as little as possible",
    principle: "Can I ship it in the span of a weekend?",
    invoke: "/mvp",
  },
  {
    id: "processize",
    name: "Processize",
    description: "Turn ideas into manual processes before coding or automating",
    principle: "Processize before you productize",
    invoke: "/processize",
  },
  {
    id: "first-customers",
    name: "First Customers",
    description: "Acquire the first 100 (or 10) customers",
    principle: "Manual sales = 99% of early growth",
    invoke: "/first-customers",
  },
  {
    id: "pricing",
    name: "Pricing Strategy",
    description: "Set and adjust pricing from day one",
    principle: "There is a massive difference between free and $1",
    invoke: "/pricing",
  },
  {
    id: "marketing-plan",
    name: "Marketing Plan",
    description: "Build content-driven growth after PMF",
    principle: "Sell before you scale; marketing second",
    invoke: "/marketing-plan",
  },
  {
    id: "grow-sustainably",
    name: "Grow Sustainably",
    description: "Make disciplined decisions on spending, hiring, and scaling",
    principle: "Profitability is the goal; default alive not default dead",
    invoke: "/grow-sustainably",
  },
  {
    id: "company-values",
    name: "Company Values",
    description: "Define culture and prepare for hiring/team building",
    principle: "Build the house you want to live in",
    invoke: "/company-values",
  },
  {
    id: "minimalist-review",
    name: "Minimalist Review",
    description:
      "Apply minimalist principles to evaluate any business decision",
    principle: "Is this the simplest approach? Is this reversible?",
    invoke: "/minimalist-review",
  },
  {
    id: "milliondollaridea",
    name: "Million Dollar Idea",
    description:
      "Full board ideation session: generates 3 validated business ideas ranked by opportunity, with unit economics, market signal, and a clear first action for each",
    principle: "The best idea is the one you can validate this week",
    invoke: "/milliondollaridea",
  },
];

export const MINIMALIST_PRINCIPLES = [
  "Community First — Don't start with a product, start with people you understand deeply",
  "Start Manual — Processize before you productize; prove value by hand first",
  "Build as Little as Possible — Can you ship it in a weekend?",
  "Sell Before You Scale — Manual sales first, marketing second",
  "Spend Time Before Money — Use free channels (content, outreach) before paid ads",
  "Profitability is the Goal — Default alive, not default dead",
  "Grow at the Speed of Your Customers — Let demand drive growth",
  "Build the House You Want to Live In — Align decisions with your values and lifestyle",
];

export const SKILL_GATE_RULES = {
  highImpact: ["minimalist-review", "validate-idea", "milliondollaridea"],
  mediumImpact: ["processize", "pricing", "grow-sustainably"],
  lowImpact: ["mvp", "first-customers"],
};
