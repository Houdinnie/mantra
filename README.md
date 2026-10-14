# Mantra

A workspace for starting a business, with an assistant that keeps the context. Work through an idea in chat, run code in a sandbox, track tasks and notes, and let the assistant remember what you decided.

## What is in it

| Page | What it does |
|---|---|
| Chat | Streaming chat with the assistant, routed through personas (business, tax, entity, and others) |
| Sandbox | Runs code in a Docker container, with a restricted fallback when Docker is not available |
| Tasks | Task list with scheduled flows |
| Notes | Notes you keep alongside the chat |
| Channels | Connections to outside messaging channels |
| Memory | What the assistant has stored about your work |

The method behind the prompts is the Minimalist Entrepreneur approach: find a community, validate the idea, turn it into a repeatable process, then automate it. Prompts live in `server/_core/ventureMind.ts`.

## Quick Start

### Local Development

Requires Node 22+ and pnpm 10.

```bash
git clone https://github.com/Houdinnie/mantra.git
cd mantra
pnpm install
cp .env.example .env     # then edit it, see below
pnpm dev
```

The server and client run together on `http://localhost:3000` (set `PORT` to change it).

Only `JWT_SECRET` is needed to see the landing page. Everything else is optional and switches on a feature:

| Variable | What it enables |
|---|---|
| `DATABASE_URL` | MySQL storage for sessions, notes, tasks and memory. Run `pnpm db:push` once after setting it. |
| `OAUTH_SERVER_URL`, `VITE_APP_ID`, `OWNER_OPEN_ID` | Manus OAuth sign-in |
| `AUTH_MODE=local`, `VITE_AUTH_MODE=local`, `OWNER_NAME` | Local sign-in as a single owner account, no OAuth server. For your own machine only. |
| `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL` | Chat through a free-tier OpenAI-compatible provider instead of a paid one (see below) |
| `ANTHROPIC_API_KEY` | Claude-backed chat and agents (paid API) |
| `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` | Manus-hosted AI, storage and notifications |
| `OPENCLAW_URL`, `OPENCLAW_TOKEN` | External OpenClaw task gateway (falls back to the built-in runner) |
| `NEUROLINKED_URL` | External NeuroLinked brain (falls back to the embedded one) |

#### Running locally without Manus login

Set `AUTH_MODE=local` and `VITE_AUTH_MODE=local` in `.env`, run `pnpm dev`, and click "Open the app". You are signed in as the owner for 12 hours. Local sign-in only works with `NODE_ENV=development` (what `pnpm dev` sets), only on the loopback interface (the server binds to 127.0.0.1 in this mode), and only for requests to localhost. In production it is ignored. Without `DATABASE_URL` the app opens but nothing is saved. For storage, start a free local MySQL and push the schema:

```bash
docker run -d --name mantra-db -e MYSQL_ROOT_PASSWORD=dev -e MYSQL_DATABASE=mantra -p 3306:3306 mysql:8
# in .env: DATABASE_URL=mysql://root:dev@localhost:3306/mantra
pnpm db:push
```

#### Free AI provider

Set `LLM_PROVIDER` to `gemini`, `groq` or `openrouter`, add a free key from that provider as `LLM_API_KEY`, and chat uses it instead of Anthropic. `LLM_MODEL` overrides the default model and is required for `openrouter`. Use `custom` with `LLM_BASE_URL` for any other OpenAI-compatible endpoint. Free tiers have rate limits that the providers change, so check their pages: [Gemini API](https://ai.google.dev/gemini-api/docs/openai), [Groq](https://console.groq.com/docs/rate-limits), [OpenRouter](https://openrouter.ai/docs/api-reference/limits).

This covers the chat and general LLM calls. The agent loop and web search tool still call Anthropic directly, since they depend on its tool-use format, and need `ANTHROPIC_API_KEY`.

Other checks: `pnpm check` (types), `pnpm test` (the session test needs `DATABASE_URL`).

### Build for Production

```bash
# Build client
cd client && pnpm build

# Or build full stack
pnpm build
pnpm start
```

## Project structure

```
client/src/pages      Landing, Chat, Sandbox, Tasks, Notes, Channels, Brain (Memory), Dashboard
client/src/components Shared UI (shadcn/ui based)
server/_core          Express server, auth, LLM clients, agent loop, Docker sandbox, embedded runner
server/routers        tRPC routers
drizzle               MySQL schema and migrations
shared                Types and constants used by both sides
```

## License

MIT, as declared in `package.json`. There is no LICENSE file in the repo yet.
