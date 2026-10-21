# Mantra — AI Co-Founder Platform

<p align="center">
  <strong>Turn ambitious ideas into plans, workflows, and software.</strong>
</p>

<p align="center">
  <a href="https://github.com/Houdinnie/mantra/actions/workflows/ci.yml">
    <img src="https://img.shields.io/badge/CI-GitHub%20Actions-informational?style=flat-square" alt="GitHub Actions CI">
  </a>
  <a href="https://github.com/Houdinnie/mantra/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License">
  </a>
</p>

Mantra is an AI co-founder platform intended to help people research opportunities, plan and build products, coordinate AI-assisted workflows, and carry useful context between sessions. The repository combines a React/TypeScript client with an Express/TypeScript server and integrations for AI providers, tools, persistence, and external services.

> **Project status:** Mantra is actively being developed. The catalog below describes the project's intended direction and implemented code areas; it is not a guarantee that every provider, integration, or agent is configured or production-ready. Check the current CI results and configure the required services before deployment.

## What Mantra is for

- **Startup discovery:** explore communities, validate ideas, and turn repeatable work into processes.
- **Software development:** plan changes, review code, investigate bugs, and support testing workflows.
- **Research:** organize multi-step research and produce evidence-backed summaries when search integrations are configured.
- **Workflow automation:** connect supported third-party services through configured integrations.
- **Personal operating context:** use notes, files, and memory-related features where their storage and providers are configured.
- **Specialist workflows:** structure work around business operations, engineering, marketing, sales, compliance, travel, and finance.

Mantra is designed to help turn a broad goal into smaller tasks, route work to the right tools or agent roles, and keep the workflow understandable.

## Quick start

### Requirements

- Node.js compatible with the project's CI runtime (Node 22)
- pnpm (the repository declares its package manager in `package.json`)
- Git

### Install and run locally

```bash
git clone https://github.com/Houdinnie/mantra.git
cd mantra
pnpm install
pnpm dev
```

The development script starts the server entry point in watch mode. Open the local address printed by the development server; the client is served through the Vite development setup.

### Useful commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the development server |
| `pnpm check` | Run the TypeScript check |
| `pnpm test` | Run the Vitest test suite |
| `pnpm build` | Build the client and bundle the server |
| `pnpm start` | Start the production server after a successful build |
| `pnpm db:push` | Generate and apply Drizzle migrations; use only after configuring the intended database |

### Production build

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm start
```

A successful build alone does not prove that the production deployment is ready. Configure the required environment variables and backing services for your deployment, then verify authentication, database access, model-provider credentials, external integrations, and sandbox isolation in that environment. Do not run database migrations against a production database until you have reviewed the generated migration and have a backup/recovery plan.

## Architecture at a glance

```text
mantra/
├── client/             React, TypeScript, Vite UI
├── server/             Express server and application logic
│   ├── _core/          Runtime, agent, tool, and sandbox infrastructure
│   └── routers/        tRPC application routers
├── drizzle/            Database schema and migration assets
├── composio_skills/    Integration-related assets
├── .github/workflows/  CI workflow
├── package.json        Scripts and dependencies
└── pnpm-lock.yaml      Reproducible dependency lockfile
```

The client provides the user interface; the server handles application routes and privileged operations. Exact capabilities depend on the modules enabled and the external services configured for a particular environment.

## Agent roles and workflow concepts

Mantra's code and design draw on several complementary patterns:

- **Planning and review:** break work into steps and use code-review, security-review, and test-oriented workflows.
- **Company roles:** organize planning around responsibilities such as CEO, finance, engineering, operations, marketing, and sales.
- **Research and operations:** support research, monitoring, content, and workflow coordination.
- **Minimalist entrepreneurship:** start with a specific community and validated problem, processize the work, and automate only where it helps.

These are workflow concepts and code areas, not a claim that every named agent or external service is enabled in every installation.

## Security and operational notes

- The Express server sets baseline security headers and exposes `GET /health` for **process-level liveness**. A successful health response does not establish that the database, model provider, or external integrations are healthy.
- Treat code execution, sandbox access, file operations, payment flows, and third-party automation as privileged capabilities.
- Authenticate requests and enforce ownership checks on user-scoped resources. Do not trust a user ID supplied only in a request body.
- Keep credentials in environment variables or a secrets manager. Never commit API keys, session secrets, or production credentials.
- Treat model output, uploaded files, and retrieved web content as untrusted input.
- Review the current CI results and test authorization boundaries before exposing the service publicly.

## Verification

The repository includes scripts for TypeScript checking, Vitest, and production builds. CI is intended to run the checks below:

```bash
pnpm check
pnpm test
pnpm build
```

A command being configured does not mean it has passed. Review the [GitHub Actions runs](https://github.com/Houdinnie/mantra/actions) for the latest result. Security regression coverage—especially unauthenticated access and cross-user sandbox isolation—should be confirmed before considering sandbox functionality production-ready.

## Contributing

1. Create a focused branch for your change.
2. Install dependencies with `pnpm install`.
3. Make the smallest clear change that solves the problem.
4. Run `pnpm check`, `pnpm test`, and `pnpm build`.
5. Include reproduction steps and test evidence in your pull request. Be explicit about checks that could not be run.

Please do not include real secrets, customer data, or production credentials in issues, pull requests, fixtures, or logs.

## License

Mantra is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <strong>Build with intention. Validate early. Automate responsibly.</strong>
</p>
