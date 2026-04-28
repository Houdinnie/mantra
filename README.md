# Mantra — AI Co-Founder Platform

<p align="center">
  <img src="https://i.imgur.com/placeholder-logo.png" alt="Mantra AI" width="400"/>
</p>

<p align="center">
  <strong>From community to first-class cabin — validate, processize, optimize across borders, then scale sustainably.</strong>
</p>

<p align="center">
  <a href="https://github.com/Houdinnie/mantra/releases">
    <img src="https://img.shields.io/badge/version-2.0.0-blue?style=flat-square" alt="Version 2.0">
  </a>
  <a href="https://github.com/Houdinnie/mantra/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
  </a>
  <a href="https://discord.gg/mantra">
    <img src="https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square" alt="Discord">
  </a>
</p>

---

## 🧠 What is Mantra?

**Mantra is your AI Co-Founder** — a comprehensive platform combining:

- **69 specialized AI agents** from Everything Claude Code
- **10 Minimalist Entrepreneur principles** from slavingia/skills  
- **27 tools** for code execution, web search, browser automation
- **800+ app integrations** via Composio
- **Claude-Mem persistent memory** for cross-session learning
- **ClawRouter smart model routing** (92% cost savings)
- **Franklin autonomous economic agents** with x402 micropayments
- **8 personas** for business, tax, entity, compliance, lifestyle optimization

Mantra turns vague goals into concrete plans, routes complex tasks to specialized agents, and maintains memory across sessions.

---

## 🎯 Use Cases

| What you want | How Mantra helps |
|----------------|-------------------|
| **Start a business** | Use `/find-community` → `/validate-idea` → `/processize` before building |
| **Review code** | Route to Code Reviewer, Security Reviewer, or TDD Guide agents |
| **Research markets** | Deep Research agent with web search + citations |
| **Automate workflows** | 800+ Composio skills (GitHub, Slack, Notion, Salesforce) |
| **Tax optimization** | NHR Portugal, UAE Freezone, Singapore strategies |
| **Visa & travel** | Nomad Navigator for D7, digital nomad, golden visa guidance |
| **Trading signals** | Trading Agent with autonomous wallet + x402 payments |

---

## 🚀 Quick Start

### Live Demo
Visit **[houdinnie.zo.space](https://houdinnie.zo.space)** to try Mantra instantly.

### Local Development

```bash
# Clone the repo
git clone https://github.com/Houdinnie/mantra.git
cd mantra

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open `http://localhost:5173` to access the Mantra AI chat interface.

### Build for Production

```bash
# Build client
cd client && pnpm build

# Or build full stack
pnpm build
pnpm start
```

---

## 📚 Skills (slavingia/skills)

Mantra integrates 10 skills from [slavingia/skills](https://github.com/slavingia/skills) — the Minimalist Entrepreneur methodology by Sahil Lavingia:

| Skill | Impact | Description |
|-------|--------|-------------|
| `find-community` | 🔴 High | Identify communities to build a minimalist business around |
| `validate-idea` | 🔴 High | Validate business ideas before building anything |
| `processize` | 🔴 High | Turn product ideas into manual-first processes |
| `minimalist-review` | 🟡 Medium | Review decisions through the minimalist entrepreneur lens |
| `marketing` | 🟡 Medium | Community-driven marketing strategies |
| `company-values` | 🟢 Low | Define and embed company values |
| `pricing` | 🟢 Low | Pricing strategy for minimalist businesses |
| `set-visitor-free` | 🟢 Low | Configure Gumroad-style free product giveaways |
| `build受众` | 🟢 Low | Build your audience organically |
| `get-ready-for-indiehackers` | 🟢 Low | Prepare for Indie Hackers launch |

The **Skills Gate** automatically routes high-impact skills (community, validation, processizing) to deeper analysis, while lower-impact skills get streamlined responses.

---

## 🤖 Agent Catalog (69 Total)

### Everything Claude Code (48 agents)
| Agent | Model | Purpose |
|-------|-------|---------|
| `planner` | opus | Implementation planning for complex features |
| `code-reviewer` | sonnet | Code quality and maintainability review |
| `security-reviewer` | sonnet | Vulnerability detection and remediation |
| `tdd-guide` | sonnet | Test-driven development with 80%+ coverage |
| `build-error-resolver` | sonnet | Fix build/type errors across languages |
| `database-reviewer` | sonnet | PostgreSQL/Supabase schema and query optimization |
| `python-reviewer` | sonnet | Python code review |
| `typescript-reviewer` | sonnet | TypeScript/JavaScript code review |
| `rust-reviewer` | sonnet | Rust code review |
| `go-reviewer` | sonnet | Go code review |
| `cpp-reviewer` | sonnet | C/C++ code review |
| `java-reviewer` | sonnet | Java/Spring Boot code review |
| `e2e-runner` | sonnet | Playwright end-to-end testing |
| `docs-lookup` | haiku | Context7 documentation lookup |
| + 35 more | | |

### OpenJarvis (8 agents)
| Agent | Description |
|-------|-------------|
| `morning_digest` | Daily briefing from email, calendar, health, news with TTS |
| `deep_research` | Multi-hop research with citations across web + local docs |
| `monitor_operative` | Long-horizon monitoring with memory and retrieval |
| `orchestrator` | Multi-turn reasoning with automatic tool selection |
| `native_react` | ReAct (Thought-Action-Observation) loop agent |
| `operative` | Persistent autonomous agent with state management |
| `native_openhands` | CodeAct — generates and executes Python code |
| `simple` | Single-turn chat, no tools |

### ClawCompany (6 roles)
| Role | Model | Responsibility |
|------|-------|----------------|
| `ceo` | opus | Strategic decisions, mission orchestration |
| `cfo` | sonnet | Financial analysis, resource allocation |
| `cto` | sonnet | Technical architecture, implementation guidance |
| `coo` | sonnet | Operations coordination, workflow optimization |
| `cmo` | sonnet | Marketing strategy, campaign orchestration |
| `cso` | sonnet | Sales strategy, client engagement |

### Franklin (3 agents)
| Agent | Description |
|-------|-------------|
| `marketing_agent` | Campaigns, content, social outreach with x402 payments |
| `trading_agent` | Signals, research, risk analysis with autonomous wallet |
| `content_agent` | Blog posts, social media, video scripts generation |

---

## 🔧 Tools (27 Total)

### Execution
| Tool | Description |
|------|-------------|
| `web_search` | Search the web via SearxNG |
| `browser_control` | Navigate, fill forms, extract data from websites |
| `code_executor` | Run Python, JavaScript, Bash, Go, Java code |
| `file_manager` | Read, write, organize files in workspace |

### Personal Data (AutoMate)
| Tool | Description |
|------|-------------|
| `notes` | Markdown notes with tags and search |
| `files` | Content-addressed blob storage with deduplication |
| `reminders` | Push notifications to phone |
| `memory` | Cross-session key-value facts |
| `search_find` | BM25 hybrid search across notes and files |

### App Automation (Composio)
| Tool | Description |
|------|-------------|
| `github_automation` | Repos, issues, PRs, branches, actions |
| `slack_automation` | Messages, channels, threads |
| `Notion_automation` | Pages, databases, comments |
| `salesforce_automation` | Leads, opportunities, contacts |
| `stripe_automation` | Charges, subscriptions, refunds |
| `shopify_automation` | Products, orders, inventory |
| `google_sheets` | Read/write cells, formulas, batch operations |
| `postgres` | Safe read-only SQL queries |
| `sendgrid` | Transactional emails and campaigns |

### AI Infrastructure
| Tool | Description |
|------|-------------|
| `memory_search` | Claude-Mem progressive disclosure search |
| `timeline` | Chronological context around observations |
| `role_delegation` | Delegate to CEO, CFO, CTO, COO, CMO, CSO |
| `model_routing` | ClawRouter with 92% cost savings |
| `x402_payments` | Micropayments for API calls via USDC |

---

## 👤 8 Personas

| Persona | Trigger Phrases | Specialty |
|---------|-----------------|-----------|
| **Ideator** | startup, business idea, validate, community | Find community → Validate → Processize |
| **Tax Strategist** | tax, NHR, Portugal, UAE, Singapore | Tax optimization, residency programs |
| **Entity Lawyer** | company, LLC, structure, legal | Entity formation, liability protection |
| **Compliance Officer** | compliance, GDPR, audit | Regulatory requirements, data privacy |
| **Nomad Navigator** | visa, D7, digital nomad, travel | Visa strategies, travel planning |
| **Luxury Concierge** | luxury, premium, VIP | First-class experiences, exclusive access |
| **Health & Wellness** | health, fitness, wellness, longevity | Health optimization, biohacking |
| **Wealth Advisor** | investing, portfolio, crypto, stocks | Investment strategies, portfolio building |

---

## 🏛️ 7 Pillars of Mantra

Based on the Minimalist Entrepreneur philosophy:

| # | Pillar | Description |
|---|--------|-------------|
| 1 | **Community First** | Start with people, not products. Find your community before your idea. |
| 2 | **Validate Before Build** | Sell a manual version first. Don't code until people pay. |
| 3 | **Processize Before Productize** | Do it by hand. Write the magic piece of paper. Then automate. |
| 4 | **Ship in a Weekend** | Smallest version that makes someone's life better. |
| 5 | **Profitability is the Goal** | Default alive > default dead. Revenue before vanity metrics. |
| 6 | **Scale Mindfully** | Grow at the speed of your customers. |
| 7 | **Build the House You Want to Live In** | Values over growth. Build for the long term. |

---

## 🛠️ Project Structure

```
mantra/
├── client/                    # React frontend (Vite, TypeScript, Tailwind)
│   └── src/
│       ├── components/
│       │   ├── ui/           # shadcn/ui components
│       │   ├── NeuralNetwork.tsx
│       │   └── ToolsPanel.tsx
│       ├── pages/
│       │   ├── Landing.tsx   # Landing page
│       │   ├── Chat.tsx      # Main chat interface
│       │   └── Dashboard.tsx # User dashboard
│       ├── contexts/         # Auth, theme contexts
│       ├── lib/              # tRPC, utilities
│       └── App.tsx           # Router setup
├── server/                    # Express backend
│   └── _core/
│       ├── ventureMind.ts    # Minimalist Entrepreneur skills
│       ├── tools.ts          # All integrated tools
│       ├── aiCompany.ts      # ClawCompany framework
│       └── sandbox.ts        # Cloud sandbox agent
├── drizzle/                   # Database schema
├── composio_skills/           # 800+ Composio integrations
└── package.json
```

---

## 📖 License

MIT © 2026 Mantra. Built with precision, care, and the Minimalist Entrepreneur philosophy.

---

<p align="center">
  <strong>Built to help you go from idea to first dollar — the right way.</strong>
</p>