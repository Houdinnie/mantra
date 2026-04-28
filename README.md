# Mantra — AI Agent Platform

<p align="center">
  <img src="https://img.shields.io/badge/69-Agents-cyan" alt="69 AI Agents" />
  <img src="https://img.shields.io/badge/27-Tools-blue" alt="27 Integrated Tools" />
  <img src="https://img.shields.io/badge/Live-houdinnie.zo.space-purple" alt="Live Deployment" />
</p>

<p align="center">
  <strong>Speak it. The Swarm Executes it.</strong>
</p>

<p align="center">
  One intention. 69 specialized AI agents. Real tools. Actual results.<br/>
  The action-oriented AI platform that turns natural language into executed work.
</p>

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Landing Page** | https://houdinnie.zo.space |
| **Chat Interface** | https://houdinnie.zo.space/chat |
| **API Service** | https://mantra-api-houdinnie.zocomputer.io |

---

## ✨ Features

### 🤖 69 Specialized Agents

Powered by [Everything Claude Code](https://github.com/ComposioHQ/awesome-claude-skills):

| Agent | Purpose | Agent | Purpose |
|-------|---------|-------|---------|
| `planner` | Implementation planning | `code-reviewer` | Code quality review |
| `security-reviewer` | Vulnerability detection (OWASP) | `tdd-guide` | Test-driven development |
| `deep-research` | Multi-hop research with citations | `trading-agent` | Market analysis |
| `marketing-agent` | Campaign creation | `database-reviewer` | SQL optimization |

*+ 61 more specialized agents*

### 🔧 27 Integrated Tools

- **Browser Automation** — Real Chrome, form filling, screenshots
- **Code Execution** — Python, JavaScript, Bash, Go in sandbox
- **Web Search** — SearxNG-powered private search
- **Memory** — Cross-session persistent knowledge
- **Notes & Files** — Personal data vault
- **AI Company** — Autonomous agents with wallets (Franklin/ClawRouter)

### 📦 21 Integrated Repositories

| Source | Features |
|--------|----------|
| [Everything Claude Code](https://github.com/ComposioHQ/awesome-claude-skills) | 69 agents, 183 skills |
| [Claude-Mem](https://github.com/thedotmack/claude-mem) | Memory search, observations |
| [Composio](https://github.com/ComposioHQ/awesome-claude-skills) | 832 app automation skills |
| [AgenticSeek](https://github.com/Fosowl/agenticSeek) | Voice-enabled browsing |
| [OpenManus](https://github.com/henryalps/OpenManus) | Multi-agent coordination |
| [ClawCompany](https://github.com/wlstead/ClawCompany) | AI company framework |
| [Franklin](https://github.com/BlockRunAI/franklin) | AI agent with USDC wallet |

---

## 🚀 Quick Start

```bash
# Visit the live demo
open https://houdinnie.zo.space/chat

# Or clone and self-host
git clone https://github.com/Houdinnie/mantra.git
cd mantra && npm install && npm run dev
```

### Example Commands

```
"Plan a REST API with authentication"
"Review my code for security vulnerabilities"
"Research LLM benchmarks for 2026"
"Create a marketing campaign for my product"
"Analyze BTC trading opportunities"
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Mantra Frontend                    │
│  Landing Page → Chat Interface → Tools Panel         │
└─────────────────────────┬───────────────────────────┘
                          │ fetch()
                          ▼
┌─────────────────────────────────────────────────────┐
│                   Mantra API Service                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────────┐ │
│  │ Sessions  │  │  Agents   │  │     Tools     │ │
│  │  (SQLite) │  │   (69)    │  │     (27)      │ │
│  └───────────┘  └───────────┘  └───────────────┘ │
└─────────────────────────┬───────────────────────────┘
                          │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │    LLM   │    │  SearxNG │    │ Browser  │
  │ (Claude) │    │  (Web)   │    │ (Chrome) │
  └──────────┘    └──────────┘    └──────────┘
```

---

## 🎯 Use Cases

| Use Case | Best Agent | Example |
|----------|------------|---------|
| Software Planning | `planner` | "Plan a microservice architecture" |
| Code Review | `code-reviewer` | "Review my auth module" |
| Security Audit | `security-reviewer` | "Scan for OWASP Top 10" |
| Deep Research | `deep-research` | "Research competitors" |
| Trading | `trading-agent` | "Analyze Q2 opportunities" |
| Marketing | `marketing-agent` | "Create campaign for launch" |

---

## 📁 Project Structure

```
mantra/
├── client/                    # React frontend
│   └── src/
│       ├── pages/
│       │   ├── Landing.tsx     # Marketing landing
│       │   └── Chat.tsx         # AI chat interface
│       └── components/
├── server/                     # Express backend
│   └── _core/
│       ├── agents.ts           # 69 AI agents
│       ├── tools.ts            # 27 tools
│       ├── memory.ts           # Claude-Mem
│       ├── webSearch.ts        # SearxNG
│       ├── autonomous.ts       # Autonomous mode
│       └── sandbox.ts          # Cloud sandbox
├── agent_systems/             # Reference repos
└── README.md
```

---

## 🔧 Configuration

```env
# LLM Provider
FORGE_API_KEY=your_api_key

# Optional
ANTHROPIC_API_KEY=sk-ant-...
SEARXNG_BASE_URL=http://searxng:8080
```

---

## 📜 License

MIT — Built with precision and power.

---

<p align="center">
  <strong>Ready to manifest more?</strong><br/>
  <a href="https://houdinnie.zo.space/chat">Launch Mantra</a> •
  <a href="https://github.com/Houdinnie/mantra">GitHub</a>
</p>