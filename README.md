# Mantra — AI Agent Platform

An action-oriented AI agent platform powered by Anthropic Claude that breaks down complex goals into concrete, executable steps and delivers verifiable results.

## Tech Stack

| Layer     | Technology                                                    |
| --------- | -------------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Tailwind CSS v4, Radix UI, Recharts    |
| Backend   | Express, tRPC, Drizzle ORM, MySQL                              |
| Auth      | OAuth 2.0 (Manus platform), JWT (HS256) via `jose`            |
| LLM       | Anthropic Claude via `@anthropic-ai/sdk`                      |
| Build     | Vite 7, esbuild, pnpm                                          |
| Testing   | Vitest                                                        |

## Project Structure

```
mantra/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx      # Marketing landing page
│   │   │   ├── Chat.tsx        # AI chat interface
│   │   │   ├── Dashboard.tsx   # Session history + stats
│   │   │   └── ComponentShowcase.tsx
│   │   ├── components/
│   │   │   ├── AIChatBox.tsx       # Chat message renderer
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── NeuralNetwork.tsx  # 60fps canvas animation
│   │   │   └── ui/                 # 40+ Radix UI primitives
│   │   ├── _core/hooks/useAuth.ts
│   │   ├── contexts/ThemeContext.tsx
│   │   └── lib/trpc.ts, utils.ts
│   └── public/__manus__/       # Manus debug collector
├── server/                  # Express + tRPC backend
│   ├── _core/
│   │   ├── sdk.ts          # OAuth + session management
│   │   ├── llm.ts          # Claude LLM integration
│   │   ├── map.ts          # Intent decomposition logic
│   │   ├── auth.ts         # Auth middleware
│   │   ├── trpc.ts         # tRPC setup
│   │   └── voiceTranscription.ts
│   ├── routers/
│   │   └── chat.ts         # Chat tRPC procedures
│   ├── storage.ts
│   └── db.ts               # Drizzle DB wrapper
├── drizzle/                 # Database schema + migrations
│   ├── schema.ts           # chat_sessions, chat_messages, users
│   ├── meta/               # Snapshot + journal files
│   └── migrations/
├── shared/                  # Shared types + constants
│   ├── _core/errors.ts
│   ├── const.ts
│   └── types.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
└── vitest.config.ts
```

## Features

- **Intent Decomposition** — Claude LLM breaks down user goals into structured, actionable steps
- **Real-time Chat** — Streaming AI responses with markdown rendering via Streamdown
- **Persistent Sessions** — MySQL-backed chat history with full-text context retention
- **Neural Visualization** — 60fps canvas animation (green pulses, breathing nodes)
- **OAuth Authentication** — Manus platform SSO with JWT session cookies
- **Protected Routes** — Auth guards on `/app` (Chat) and `/app/dashboard`
- **Dark Futuristic UI** — Fraunces (display) + Inter (body) typography, cyan accent palette
- **Dashboard** — Session history, usage statistics, message counts

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+ (`npm install -g pnpm`)
- MySQL 8+ (or MariaDB 10.5+)
- [Manus platform](https://manus.im) account (for OAuth)

### Environment Variables

Create a `.env` file at the project root:

```env
# Manus OAuth (from your Manus developer settings)
OAUTH_SERVER_URL=https://your-manus-server.com
APP_ID=your_app_id
COOKIE_SECRET=your_random_256bit_secret

# Claude LLM
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=mysql://user:password@localhost:3306/mantra

# Optional
NODE_ENV=development
```

### Installation

```bash
pnpm install
```

### Database Setup

```bash
# Push schema to MySQL (creates tables)
pnpm db:push
```

### Development

```bash
pnpm dev
```

Opens at `http://localhost:5173` (Vite dev server). The Express API runs on the same port via Vite's proxy.

### Production Build

```bash
pnpm build
pnpm start
```

### Testing

```bash
pnpm test        # Run all tests (Vitest)
pnpm check       # TypeScript type check
pnpm format      # Prettier format
```

## Database Schema

### `users`
| Column        | Type         | Notes               |
| ------------- | ------------ | ------------------- |
| openId        | varchar(255) | PK, OAuth subject   |
| name          | varchar(255) | nullable           |
| email         | varchar(255) | nullable           |
| loginMethod   | varchar(50)  | nullable           |
| lastSignedIn  | datetime     |                    |
| createdAt     | datetime     | default now()      |

### `chat_sessions`
| Column     | Type         | Notes                  |
| ---------- | ------------ | ---------------------- |
| id         | varchar(255) | PK (nanoid)           |
| userId     | varchar(255) | FK → users, indexed   |
| title      | varchar(255) | nullable              |
| createdAt  | datetime     |                       |
| updatedAt  | datetime     | indexed               |

### `chat_messages`
| Column     | Type         | Notes                  |
| ---------- | ------------ | ---------------------- |
| id         | int          | PK, auto-increment    |
| sessionId  | varchar(255) | FK → sessions, indexed |
| role       | enum         | 'user' / 'assistant'  |
| content    | text         |                       |
| createdAt  | datetime     |                       |

## API Design

All API routes are tRPC procedures under `/trpc`:

| Procedure            | Type   | Description                          |
| -------------------- | ------ | ------------------------------------ |
| `chat.sendMessage`   | mutate | Send message, returns AI response    |
| `chat.getSessions`   | query  | List all sessions for current user   |
| `chat.getSession`    | query  | Get session + messages by ID         |
| `chat.deleteSession` | mutate | Delete a session and its messages    |

## Key Dependencies

- **`@anthropic-ai/sdk`** — Claude LLM API client
- **`streamdown`** — Markdown streaming renderer for chat
- **`drizzle-orm`** — Type-safe SQL query builder
- **`jose`** — JWT signing/verification for sessions
- **`wouter`** — Lightweight React router (with patch applied)
- **`framer-motion`** — Animations throughout the UI
- **`recharts`** — Charts on the dashboard
- **`radix-ui`** — 40+ unstyled, accessible UI primitives

## License

MIT
