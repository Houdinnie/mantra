/**
 * Franklin Agents — Autonomous specialist agents with tool access
 *
 * marketing_agent: campaigns, content strategy, social outreach
 * trading_agent: market research, signals, risk analysis
 * content_agent: blog posts, social media, video scripts
 *
 * Each agent can use web search and returns structured output
 * alongside its reasoning.
 */

import { callClaudeWithSearch } from "./searchTool";
import { callClaude } from "./anthropic";

// ─────────────────────────────────────────────────────────────
// Marketing Agent
// ─────────────────────────────────────────────────────────────

export type MarketingBrief = {
  productDescription: string;
  targetAudience: string;
  goal: string; // "launch" | "growth" | "retention" | "awareness"
  budget?: string;
  channels?: string[];
};

export type MarketingPlan = {
  positioning: string;
  coreMessage: string;
  channels: Array<{ channel: string; tactics: string[]; kpis: string[] }>;
  contentCalendar: Array<{ week: number; theme: string; formats: string[] }>;
  firstAction: string;
  sources: Array<{ url: string; title: string }>;
};

const MARKETING_SYSTEM = `You are the Mantra Marketing Agent. You build data-driven marketing strategies for early-stage founders using the Minimalist Entrepreneur methodology: community first, content before ads, organic before paid, and marketing only after achieving basic product-market fit.

You have access to web search to research competitor strategies, market trends, and channel benchmarks. Use it to ground your recommendations in real data.

Output your response as valid JSON matching the MarketingPlan schema:
{
  "positioning": "string",
  "coreMessage": "string",
  "channels": [{ "channel": "string", "tactics": ["string"], "kpis": ["string"] }],
  "contentCalendar": [{ "week": number, "theme": "string", "formats": ["string"] }],
  "firstAction": "string"
}`;

export async function runMarketingAgent(brief: MarketingBrief): Promise<MarketingPlan> {
  const prompt = `Build a marketing strategy for:
Product: ${brief.productDescription}
Target audience: ${brief.targetAudience}
Goal: ${brief.goal}
${brief.budget ? `Budget: ${brief.budget}` : ""}
${brief.channels?.length ? `Preferred channels: ${brief.channels.join(", ")}` : ""}

Research competitor marketing approaches and current channel benchmarks. Return valid JSON only.`;

  const { reply, sources } = await callClaudeWithSearch({
    system: MARKETING_SYSTEM,
    messages: [{ role: "user", content: prompt }],
    maxTokens: 3000,
  });

  try {
    const clean = reply.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(clean) as MarketingPlan;
    return { ...plan, sources };
  } catch {
    return {
      positioning: "Unable to parse structured output",
      coreMessage: reply.substring(0, 200),
      channels: [],
      contentCalendar: [],
      firstAction: "Review raw response",
      sources,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Trading Agent
// ─────────────────────────────────────────────────────────────

export type TradingResearchRequest = {
  asset: string; // e.g. "EURUSD", "BTC", "AAPL"
  timeframe?: string; // e.g. "short-term", "medium-term", "long-term"
  context?: string; // Additional context about the trade idea
};

export type TradingResearch = {
  asset: string;
  sentiment: "bullish" | "bearish" | "neutral";
  keyLevels: { support: string[]; resistance: string[] };
  catalysts: string[];
  risks: string[];
  recommendation: string;
  confidence: "high" | "medium" | "low";
  disclaimer: string;
  sources: Array<{ url: string; title: string }>;
};

const TRADING_SYSTEM = `You are the Mantra Trading Research Agent. You conduct market research, identify key price levels, analyse sentiment, and assess catalysts and risks for assets.

You have web search access to find current news, analyst views, and market data. Always search for the latest information before forming a view.

Output as valid JSON:
{
  "asset": "string",
  "sentiment": "bullish|bearish|neutral",
  "keyLevels": { "support": ["string"], "resistance": ["string"] },
  "catalysts": ["string"],
  "risks": ["string"],
  "recommendation": "string",
  "confidence": "high|medium|low",
  "disclaimer": "This is research only, not financial advice. Always use a stop loss."
}

IMPORTANT: Always include the disclaimer. Never make absolute predictions.`;

export async function runTradingAgent(request: TradingResearchRequest): Promise<TradingResearch> {
  const prompt = `Research ${request.asset} for ${request.timeframe ?? "medium-term"} trading.
${request.context ? `Additional context: ${request.context}` : ""}

Search for:
1. Latest news and events affecting ${request.asset}
2. Current technical levels and analyst price targets
3. Macro factors and sentiment

Return valid JSON only.`;

  const { reply, sources } = await callClaudeWithSearch({
    system: TRADING_SYSTEM,
    messages: [{ role: "user", content: prompt }],
    maxTokens: 2000,
  });

  try {
    const clean = reply.replace(/```json|```/g, "").trim();
    const research = JSON.parse(clean) as TradingResearch;
    return { ...research, sources };
  } catch {
    return {
      asset: request.asset,
      sentiment: "neutral",
      keyLevels: { support: [], resistance: [] },
      catalysts: [],
      risks: ["Could not parse structured output"],
      recommendation: reply.substring(0, 300),
      confidence: "low",
      disclaimer: "This is research only, not financial advice.",
      sources,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Content Agent
// ─────────────────────────────────────────────────────────────

export type ContentRequest = {
  format: "blog_post" | "twitter_thread" | "linkedin_post" | "video_script" | "email_sequence";
  topic: string;
  audience: string;
  tone?: string; // "professional" | "casual" | "educational" | "controversial"
  wordCount?: number;
  includeResearch?: boolean;
};

export type ContentOutput = {
  format: string;
  title: string;
  content: string;
  seoKeywords?: string[];
  estimatedReadTime?: string;
  callToAction?: string;
};

const CONTENT_SYSTEM = `You are the Mantra Content Agent. You create high-quality content that drives organic growth for founders: blog posts, Twitter/X threads, LinkedIn posts, video scripts, and email sequences.

You follow the Minimalist Entrepreneur content philosophy:
- Teach everything you know
- Document your journey, not just your wins
- Answer the questions your community is already asking
- Be specific and tactical, not generic and fluffy
- Every piece of content should be genuinely useful on its own

When research is requested, use web search to find current data, recent examples, and trending angles.`;

export async function runContentAgent(request: ContentRequest): Promise<ContentOutput> {
  const prompt = `Create a ${request.format.replace("_", " ")} about "${request.topic}" for ${request.audience}.
Tone: ${request.tone ?? "educational and direct"}
${request.wordCount ? `Target length: ~${request.wordCount} words` : ""}

Format guidelines:
- blog_post: H1, intro, 3-5 H2 sections, conclusion, CTA
- twitter_thread: numbered tweets (1/n), hook tweet, value-dense thread, CTA tweet
- linkedin_post: hook line, body paragraphs, hashtags, CTA
- video_script: [HOOK], [INTRO], [MAIN CONTENT], [CTA]
- email_sequence: Subject line, preview text, body, CTA button text

Return your response as:
TITLE: <title>
KEYWORDS: <comma,separated,seo,keywords>
READ_TIME: <X min read>
CTA: <call to action>
---
<full content here>`;

  const useSearch = request.includeResearch !== false && request.format === "blog_post";

  let reply: string;
  if (useSearch) {
    const result = await callClaudeWithSearch({
      system: CONTENT_SYSTEM,
      messages: [{ role: "user", content: prompt }],
      maxTokens: 4096,
    });
    reply = result.reply;
  } else {
    reply = await callClaude({
      system: CONTENT_SYSTEM,
      messages: [{ role: "user", content: prompt }],
      maxTokens: 4096,
    });
  }

  // Parse the structured header
  const titleMatch = reply.match(/TITLE:\s*(.+)/);
  const keywordsMatch = reply.match(/KEYWORDS:\s*(.+)/);
  const readTimeMatch = reply.match(/READ_TIME:\s*(.+)/);
  const ctaMatch = reply.match(/CTA:\s*(.+)/);
  const contentStart = reply.indexOf("---\n");
  const content = contentStart > -1 ? reply.slice(contentStart + 4).trim() : reply;

  return {
    format: request.format,
    title: titleMatch?.[1]?.trim() ?? request.topic,
    content,
    seoKeywords: keywordsMatch?.[1]?.split(",").map((k) => k.trim()),
    estimatedReadTime: readTimeMatch?.[1]?.trim(),
    callToAction: ctaMatch?.[1]?.trim(),
  };
}
