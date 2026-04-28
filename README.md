# Mantra — AI Agent Platform

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-green.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/tools-25+-yellow.svg" alt="Tools">
  <img src="https://img.shields.io/badge/agents-48+-purple.svg" alt="Agents">
</p>

<p align="center">
  <strong>Cloud Sandbox Agent</strong> — AI Manus-style agent that executes tasks in isolated Docker containers
</p>

<p align="center">
  <a href="https://houdinnie.zo.space/">Live Demo</a> •
  <a href="https://houdinnie.zo.space/cloud-agent">Cloud Agent UI</a> •
  <a href="https://houdinnie.zo.space/autonomous">Autonomous Mode</a>
</p>

---

## What is Mantra?

Mantra is an **AI Agent Platform** that combines the best ideas from Manus, OpenClaw, ClawCompany, and 20+ other agent frameworks into one unified system.

---

## What Mantra Can Do

### 🌥️ Cloud Sandbox Agent
AI Manus-style agent that executes tasks in isolated Docker containers.

```typescript
const result = await fetch('/api/cloud/task', {
  method: 'POST',
  body: JSON.stringify({
    task: "Build a web scraper in Python",
    tools: ["shell", "file", "http"]
  })
});
```

**How it works:**
1. Create isolated Docker sandbox
2. Plan → Act → Observe loop
3. Stream results via SSE
4. Auto-cleanup after timeout

### 🌐 Web Search
Search the internet using multiple engines:
- **SearxNG** — Private, self-hosted meta-search engine
- **Bing** — Microsoft Search API
- **Google** — Google Custom Search
- **DuckDuckGo** — No API key required

### 🌐 Browser Automation
Control a headless browser to interact with websites:

| Action | Description |
|--------|-------------|
| `navigate` | Open any URL |
| `click` | Click elements by CSS selector |
| `type` | Type text into input fields |
| `screenshot` | Capture page screenshots |
| `evaluate` | Run JavaScript in page context |
| `extract` | Extract content from DOM elements |

### 💻 Code Execution
create_or_rewrite_file and run code in multiple languages:

| Language | Run Command | Compile |
|----------|-------------|---------|
| Python | `python3` | — |
| JavaScript | `node` | — |
| Bash | `bash` | — |
| Go | `go run` | — |
| Java | `java` | `javac` |
| C++ | — | `g++` |

### 📝 Personal Notes
Create and manage markdown notes with tags and search:

```typescript
await trpc.tools.notes.create.mutate({
  title: "Project Ideas",
  content: "# Ideas\n\n- Build an AI agent",
  tags: ["ideas", "projects"]
});
```

### 🧠 Memory
Store key-value facts that persist across sessions:

```typescript
await trpc.tools.memory.set.mutate({
  key: "preferred_language",
  value: "TypeScript"
});
```

### ⏰ Reminders
Schedule notifications:

```typescript
await trpc.tools.reminders.create.mutate({
  title: "Meeting with team",
  scheduledAt: Date.now() + 3600000,
  content: "Don't forget the sprint planning"
});
```

### ✅ Task Management (Kanban)
Kanban boards with projects, task lists, priorities:

```typescript
await trpc.tools.tasks.createProject.mutate({ name: "New Project" });
await trpc.tools.tasks.createTask.mutate({
  projectId, title: "Fix bug", priority: "high"
});
```

### 🤖 AI Company (ClawCompany)
Run a complete AI company with 38 roles across 6 templates:

```typescript
// Execute a mission with an AI company
const result = await trpc.tools.company.executeMission.mutate({
  objective: "Analyze NVDA for 2026 investment potential",
  template: "trading"
});
```

**6 Templates:**

| Template | Roles | Focus |
|----------|-------|-------|
| 🦞 Default | 9 | General purpose |
| 🚀 YC Startup | 7 | YC methodology |
| 📈 Trading Desk | 7 | Investment analysis |
| 🔬 Research Lab | 5 | Deep research |
| 💻 Software Dev | 6 | Sprint development |
| 🏗️ Harness Builder | 3 | GAN-inspired |

### 💰 Money Making (Franklin/ClawRouter)
Autonomous economic agent with x402 micropayments:

```typescript
// Smart model routing (92% cost savings)
const result = await trpc.tools.routing.mutate({
  prompt: "Analyze this contract for risks",
  profile: "auto"
});
```

**Key Features:**
- x402 micropayment protocol
- Smart model routing (up to 92% savings)
- 41+ LLM providers via ClawRouter
- Franklin-style autonomous spending
- Usage reports and diagnostics

### 🏢 3D Office (Claw3D)
Virtual office for AI agents

### 💾 Persistent Memory (Claude-Mem)
Cross-session context preservation

### 🔗 App Automation (Composio)
800+ app integrations

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Mantra Client                      │
│              React 19 + Tailwind CSS                   │
└─────────────────────────┬───────────────────────────┘
                          │ tRPC
                          ▼
┌─────────────────────────────────────────────────────┐
│                   Mantra Server                       │
│           Express + tRPC + Drizzle ORM               │
│                                                      │
│   ┌──────────────────────────────────────────────┐  │
│   │              Tools Router                     │  │
│   │  Search · Browser · Code · Notes · Memory   │  │
│   │  Reminders · Files · Tasks · Company         │  │
│   │  Money Making · Routing · Automation         │  │
│   └──────────────────────────────────────────────┘  │
│                                                      │
│   ┌──────────────────────────────────────────────┐  │
│   │         AI Company (ClawCompany)             │  │
│   │  38 roles · 6 templates · 4-layer memory     │  │
│   └──────────────────────────────────────────────┘  │
│                                                      │
│   ┌──────────────────────────────────────────────┐  │
│   │        Money Making (Franklin)               │  │
│   │  x402 payments · ClawRouter · 41+ LLMs       │  │
│   └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Radix UI |
| **Backend** | Express, tRPC, Drizzle ORM |
| **Database** | MySQL (sessions), SQLite (personal data) |
| **Auth** | OAuth 2.0 (Manus), JWT |

---

## Integrations

| Source | Feature | Implementation |
|--------|---------|----------------|
| **AgenticSeek** | Web search, Code execution | `server/_core/webSearch.ts`, `server/_core/codeExecution.ts` |
| **Manus/AIPex** | Browser automation | `server/_core/browserAutomation.ts` |
| **autoMate** | Personal data | `server/_core/personalData.ts` |
| **Everything Claude Code** | 48 agents, 183 skills | `agents_ecc/`, `skills_ecc/` |
| **Claude-Mem** | Persistent memory | `server/_core/memory.ts` |
| **Composio** | 800+ app automation | `composio_skills/` |
| **ClawDeck** | Task management | `server/_core/tasks.ts` |
| **Claw3D** | 3D office | `server/_core/claw3d.ts` |
| **OpenJarvis** | Local AI engine | `server/_core/localAI.ts` |
| **Franklin/ClawRouter** | Money making | `server/_core/moneyMaking.ts` |
| **ClawCompany** | AI company framework | `server/_core/aiCompany.ts` |
| **ClawSwarm** | Multi-agent swarm | `server/_core/swarm.ts` |
| **MemOS** | Lifecycle memory | `server/_core/memos.ts` |
| **ClawCode** | ECAP learning | `server/_core/learning.ts` |
| **Advertising Skills** | Marketing assets | `advertising_skills/` |

---

## License

MIT
