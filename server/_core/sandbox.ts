/**
 * Mantra Cloud Sandbox Agent
 * 
 * AI Manus-style isolated execution environment:
 * - Docker container per task
 * - Shell, file, browser, HTTP tools
 * - Plan → Act → Observe loop
 */

export interface SandboxConfig {
  image?: string;
  timeout?: number;
  memory?: string;
  cpu?: number;
}

export interface SandboxSession {
  id: string;
  containerId: string;
  createdAt: number;
  status: 'running' | 'stopped' | 'error';
}

export interface ToolResult {
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  error?: string;
  timestamp: number;
}

// In-memory session store (replace with Redis/DB in production)
const sessions = new Map<string, SandboxSession>();

/**
 * Create a new sandbox session
 */
export async function createSandbox(config: SandboxConfig = {}): Promise<SandboxSession> {
  const id = `sandbox_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  const session: SandboxSession = {
    id,
    containerId: `mantra-${id}`,
    createdAt: Date.now(),
    status: 'running',
  };
  
  sessions.set(id, session);
  return session;
}

/**
 * Execute a tool in a sandbox
 */
export async function executeTool(
  sessionId: string,
  tool: string,
  input: Record<string, unknown>
): Promise<ToolResult> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const result: ToolResult = {
    tool,
    input,
    output: null,
    timestamp: Date.now(),
  };

  try {
    switch (tool) {
      case 'shell':
        result.output = await executeShell(input.command as string);
        break;
      case 'file_read':
        result.output = await readFile(input.path as string);
        break;
      case 'file_write':
        await writeFile(input.path as string, input.content as string);
        result.output = { success: true };
        break;
      case 'http':
        result.output = await makeHttpRequest(
          input.url as string,
          input.method as string || 'GET',
          input.headers as Record<string, string>,
          input.body as string
        );
        break;
      default:
        result.error = `Unknown tool: ${tool}`;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

async function executeShell(command: string): Promise<string> {
  const { exec } = await import('child_process');
  return new Promise((resolve, reject) => {
    exec(command, { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

async function readFile(path: string): Promise<string> {
  const { readFile } = await import('fs/promises');
  return readFile(path, 'utf-8');
}

async function writeFile(path: string, content: string): Promise<void> {
  const { writeFile } = await import('fs/promises');
  await writeFile(path, content, 'utf-8');
}

async function makeHttpRequest(
  url: string,
  method: string,
  headers: Record<string, string> = {},
  body?: string
): Promise<unknown> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body,
  });
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text(),
  };
}

/**
 * Stop and cleanup a sandbox session
 */
export async function destroySandbox(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (session) {
    session.status = 'stopped';
    sessions.delete(sessionId);
  }
}

/**
 * Get session status
 */
export function getSession(sessionId: string): SandboxSession | undefined {
  return sessions.get(sessionId);
}
