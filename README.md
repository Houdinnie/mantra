# Mantra — AI Agent Platform

<p align="center">
  <img src="https://img.shields.io/badge/69-Agents-cyan" alt="69 AI Agents" />
  <img src="https://img.shields.io/badge/27-Tools-blue" alt="27 Integrated Tools" />
  <img src="https://img.shields.io/badge/21-Repos-green" alt="21 Integrated Repositories" />
  <img src="https://img.shields.io/badge/License-MIT-purple" alt="License" />
</p>

<p align="center">
  <strong>Action-oriented AI agent platform that turns ideas into executable plans.</strong>
</p>

---

## 🌐 Live Deployment

| Service | URL |
|---------|-----|
| **Landing Page** | https://houdinnie.zo.space |
| **Chat App** | https://houdinnie.zo.space/chat |
| **API Service** | https://mantra-api-houdinnie.zocomputer.io |

---

## ✨ Features

### 🤖 69 AI Agents

Powered by [Everything Claude Code](https://github.com/ComposioHQ/awesome-claude-skills):

| Agent | Purpose |
|-------|---------|
| `planner` | Implementation planning for complex features |
| `code-reviewer` | Code quality and maintainability review |
| `security-reviewer` | Vulnerability detection (OWASP Top 10) |
| `tdd-guide` | Test-driven development with 80%+ coverage |
| `database-reviewer` | PostgreSQL/Supabase optimization |
| `build-error-resolver` | Fix build/type errors across languages |
| `deep-research` | Multi-hop research with citations |
| `trading-agent` | Market analysis and trading signals |
| `marketing-agent` | Campaign creation and content generation |
| + 60 more specialized agents |

### 🔧 27 Integrated Tools

From [Composio](https://github.com/ComposioHQ/awesome-claude-skills):
- **Web Search** — SearxNG-powered search engine
- **Browser Automation** — Real Chrome control, form filling, screenshots
- **Code Execution** — Python, JavaScript, Bash, Go in sandboxed environment
- **Notes** — Markdown documents with tags and search
- **Memory** — Cross-session persistent memory
- **Reminders** — Push notifications to your devices
- **File Vault** — Content-addressed file storage
- **AI Company** — Autonomous economic agents with wallets (Franklin/ClawRouter)
- + 19 more tools

### 📦 21 Integrated Repositories

| Source | Features Added |
|--------|---------------|
| [Everything Claude Code](https://github.com/ComposioHQ/awesome-claude-skills) | 69 agents, 183 skills, 79 commands |
| [Claude-Mem](https://github.com/thedotmack/claude-mem) | Memory search, observations, session history |
| [Composio](https://github.com/ComposioHQ/awesome-claude-skills) | 832 app automation skills |
| [AgenticSeek](https://github.com/Fosowl/agenticSeek) | Voice-enabled web browsing, autonomous coding |
| [AIPex](https://github.com/AIPexNL/APEX) | Chrome extension browser automation |
| [AutoMate](https://github.com/yuruotong1/autoMate) | Personal data NAS, 31 SaaS integrations |
| [ClawCompany](https://github.com/wlstead/ClawCompany) | AI company framework with roles |
| [OpenJarvis](https://github.com/open-jarvis/OpenJarvis) | Local LLM, morning digest, deep research |
| [OpenManus](https://github.com/henryalps/OpenManus) | Multi-agent coordination |
| [Claw3D](https://github.com/team-astronauts/Claw3D) | 3D virtual office for AI agents |
| [ClawDeck](https://github.com/win4r/ClawDeck) | Kanban-style task management |
| [ClawTeam](https://github.com/HKUDS/ClawTeam) | Multi-agent swarm orchestration |
| [ClawSwarm](https://github.com/1Panel-dev/ClawSwarm) | Group chat for agents |
| [MemOS](https://github.com/MemTensor/memos-openclaw-plugin) | Lifecycle memory plugin |
| [Franklin](https://github.com/BlockRunAI/franklin) | AI agent with USDC wallet |
| [Awesome OpenClaw Money Maker](https://github.com/BlockRunAI/awesome-OpenClaw-Money-Maker) | Revenue strategies, trading bots |
| + 5 more |

---

## 🚀 Quick Start

### Web Interface
1. Visit https://houdinnie.zo.space/chat
2. Start typing your request

### Example Commands
```
"Plan a feature for me"
"Review my code for security vulnerabilities"  
"Search for latest AI news"
"Help me with my marketing campaign"
"Research this topic deeply"
"Create a trading strategy for BTC"
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Mantra Frontend                       │
│   Landing Page → Chat Interface → Tools Panel               │
└────────────────────────────┬────────────────────────────────┘
                             │ fetch()
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Mantra API Service                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│   │  Sessions   │  │  Agents    │  │      Tools         ││
│   │  (SQLite)   │  │  (69)      │  │      (27)           ││
│   └─────────────┘  └─────────────┘  └─────────────────────┘│
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │   LLM   │  │  SearxNG │  │ Browser │
        │ (Claude)│  │  (Web)  │  │ (Chrome)│
        └──────────┘  └──────────┘  └──────────┘
```

---

## 📁 Project Structure

```
mantra/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── Landing.tsx     # Marketing landing page
│       │   └── Chat.tsx         # AI chat interface
│       └── components/
│           └── ToolsPanel.tsx    # Agent & tool showcase
├── server/                  # Express backend
│   └── _core/
│       ├── agents.ts           # 69 AI agent definitions
│       ├── tools.ts            # 27 integrated tools
│       ├── memory.ts           # Claude-Mem integration
│       ├── webSearch.ts        # SearxNG search
│       ├── browserAuto.ts      # Browser automation
│       ├── codeExec.ts         # Code execution
│       ├── personalData.ts     # Notes, memory, reminders
│       ├── moneyMaking.ts      # Franklin/ClawRouter
│       ├── aiCompany.ts        # ClawCompany framework
│       ├── autonomous.ts       # Autonomous agent mode
│       └── sandbox.ts          # Cloud sandbox agent
├── drizzle/                 # Database schema
├── agent_systems/           # Copied reference repos
│   ├── everything-claude-code/
│   ├── claude-mem/
│   ├── composio_skills/
│   ├── agenticseek/
│   ├── ai-manus/
│   ├── openmanus/
│   └── ... (15 more)
└── README.md
```

---

## 🔧 Configuration

### Environment Variables

```env
# LLM Provider (Manus/Forge compatible)
FORGE_API_URL=https://forge.manus.im/v1/chat/completions
FORGE_API_KEY=your_api_key

# Optional: Custom LLM
ANTHROPIC_API_KEY=sk-ant-...

# Web Search (SearxNG)
SEARXNG_BASE_URL=http://searxng:8080

# Browser Automation
CHROME_BINARY=/usr/bin/chromium
```

---

## 🎯 Use Cases

| Use Case | Best Agent | Command Example |
|----------|------------|-----------------|
| Plan a feature | `planner` | "Plan a REST API with auth" |
| Code review | `code-reviewer` | "Review my React component" |
| Security scan | `security-reviewer` | "Scan for SQL injection risks" |
| Write tests | `tdd-guide` | "Add tests for the auth module" |
| Research | `deep-research` | "Research LLM benchmarks 2026" |
| Trading | `trading-agent` | "Analyze BTC trend for Q2 2026" |
| Marketing | `marketing-agent` | "Create campaign for new product" |
| Browser tasks | Browser tools | "Fill out this form", "Take screenshot" |

---

## 📜 License

MIT — See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ using React, Express, SQLite, and Claude</strong>
</p>