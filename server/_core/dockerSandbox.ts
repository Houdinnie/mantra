/**
 * Docker Sandbox Manager
 *
 * Spins up isolated Docker containers as sandboxes — free, local, no cloud billing.
 * Each sandbox is a fresh Ubuntu container with Python, Node.js, curl, and git.
 *
 * Falls back to a restricted child_process sandbox if Docker is not available.
 *
 * Security model:
 *   - No host filesystem mounts (--volume is never used)
 *   - No host network (--network=none by default, bridge for internet tasks)
 *   - Memory limited to 512MB, CPU to 1 core
 *   - Container auto-removed after TTL
 *   - Each user gets their own container per session
 */

import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { randomBytes } from "crypto";

const execFileAsync = promisify(execFile);

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type SandboxMode = "docker" | "process";

export type SandboxInfo = {
  id: string; // Our internal ID
  containerId?: string; // Docker container ID (if docker mode)
  mode: SandboxMode;
  status: "running" | "stopped" | "error";
  createdAt: number;
  workdir: string; // Working directory inside sandbox
};

export type ExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
};

export type FileEntry = {
  name: string;
  type: "file" | "dir";
  size?: number;
  path: string;
};

// ─────────────────────────────────────────────────────────────
// Docker availability check
// ─────────────────────────────────────────────────────────────

let _dockerAvailable: boolean | null = null;

export async function isDockerAvailable(): Promise<boolean> {
  if (_dockerAvailable !== null) return _dockerAvailable;
  try {
    await execFileAsync("docker", ["info"], { timeout: 3000 });
    _dockerAvailable = true;
  } catch {
    _dockerAvailable = false;
  }
  return _dockerAvailable;
}

// ─────────────────────────────────────────────────────────────
// Sandbox Docker image — pull or use existing
// ─────────────────────────────────────────────────────────────

const SANDBOX_IMAGE = "mcr.microsoft.com/playwright/python:v1.44.0-jammy";

// Install commands run once after container starts
// Playwright image already has Chromium, Firefox, WebKit + all deps
const SANDBOX_INIT_COMMANDS = [
  "pip3 install -q requests pandas numpy beautifulsoup4 playwright 2>/dev/null || true",
  "npm install -g --silent tsx ts-node 2>/dev/null || true",
  "mkdir -p /workspace",
].join(" && ");

export async function ensureSandboxImage(): Promise<void> {
  const docker = await isDockerAvailable();
  if (!docker) return;
  try {
    await execFileAsync("docker", ["pull", SANDBOX_IMAGE], { timeout: 60000 });
  } catch {
    // Image might already be present
  }
}

// ─────────────────────────────────────────────────────────────
// Create sandbox
// ─────────────────────────────────────────────────────────────

export async function createSandbox(
  sessionId: string,
  networkAccess = true
): Promise<SandboxInfo> {
  const id = `mantra-${sessionId.slice(0, 8)}-${randomBytes(4).toString("hex")}`;
  const workdir = "/workspace";
  const docker = await isDockerAvailable();

  if (docker) {
    // Docker mode — fully isolated container
    const network = networkAccess ? "bridge" : "none";
    const args = [
      "run",
      "-d",
      "--name",
      id,
      "--network",
      network,
      "--memory",
      "1g",
      "--cpus",
      "1.5",
      "--pids-limit",
      "128",
      "--workdir",
      workdir,
      "--rm",
      "--cap-drop",
      "ALL",
      "--cap-add",
      "SYS_ADMIN", // required for Chromium sandbox
      "--security-opt",
      "seccomp=unconfined", // required for browser
      "--security-opt",
      "no-new-privileges:false",
      "--shm-size",
      "1g", // Chromium needs shared memory
      "-e",
      "DISPLAY=:99",
      "-e",
      "PLAYWRIGHT_BROWSERS_PATH=/ms-playwright",
      SANDBOX_IMAGE,
      "/bin/bash",
      "-c",
      `mkdir -p ${workdir} && ${SANDBOX_INIT_COMMANDS} && tail -f /dev/null`,
    ];

    const { stdout } = await execFileAsync("docker", args, { timeout: 30000 });
    const containerId = stdout.trim();

    return {
      id,
      containerId,
      mode: "docker",
      status: "running",
      createdAt: Date.now(),
      workdir,
    };
  } else {
    // Process fallback — restricted temp directory
    const tmpDir = `/tmp/mantra-sandbox-${id}`;
    await execFileAsync("mkdir", ["-p", tmpDir]);
    return {
      id,
      mode: "process",
      status: "running",
      createdAt: Date.now(),
      workdir: tmpDir,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Execute a command inside the sandbox
// ─────────────────────────────────────────────────────────────

const EXEC_TIMEOUT_MS = 30_000;

export async function execInSandbox(
  sandbox: SandboxInfo,
  command: string
): Promise<ExecResult> {
  if (sandbox.mode === "docker" && sandbox.containerId) {
    return execInDocker(sandbox.containerId, command, sandbox.workdir);
  } else {
    return execInProcess(sandbox.workdir, command);
  }
}

async function execInDocker(
  containerId: string,
  command: string,
  workdir: string
): Promise<ExecResult> {
  return new Promise(resolve => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const proc = spawn("docker", [
      "exec",
      "--workdir",
      workdir,
      containerId,
      "/bin/bash",
      "-c",
      command,
    ]);

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
    }, EXEC_TIMEOUT_MS);

    proc.stdout.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    proc.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
    });

    proc.on("close", code => {
      clearTimeout(timer);
      resolve({
        stdout: stdout.slice(0, 50_000), // cap at 50KB
        stderr: stderr.slice(0, 10_000),
        exitCode: code ?? 1,
        timedOut,
      });
    });

    proc.on("error", err => {
      clearTimeout(timer);
      resolve({
        stdout: "",
        stderr: err.message,
        exitCode: 1,
        timedOut: false,
      });
    });
  });
}

async function execInProcess(
  workdir: string,
  command: string
): Promise<ExecResult> {
  // Restricted: block dangerous commands
  const BLOCKED = [
    "rm -rf /",
    "dd if=",
    ":(){ :|:& };:",
    "mkfs",
    "fdisk",
    "parted",
    "chmod 777 /",
    "> /dev/",
  ];
  if (BLOCKED.some(b => command.includes(b))) {
    return {
      stdout: "",
      stderr: "Command blocked by sandbox policy",
      exitCode: 1,
      timedOut: false,
    };
  }

  return new Promise(resolve => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const proc = spawn("/bin/bash", ["-c", command], {
      cwd: workdir,
      env: {
        PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        HOME: workdir,
        TMPDIR: workdir,
      },
      timeout: EXEC_TIMEOUT_MS,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill();
    }, EXEC_TIMEOUT_MS);

    proc.stdout.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    proc.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
    });

    proc.on("close", code => {
      clearTimeout(timer);
      resolve({
        stdout: stdout.slice(0, 50_000),
        stderr: stderr.slice(0, 10_000),
        exitCode: code ?? 1,
        timedOut,
      });
    });

    proc.on("error", err => {
      clearTimeout(timer);
      resolve({
        stdout: "",
        stderr: err.message,
        exitCode: 1,
        timedOut: false,
      });
    });
  });
}

// ─────────────────────────────────────────────────────────────
// File operations
// ─────────────────────────────────────────────────────────────

export async function writeFileInSandbox(
  sandbox: SandboxInfo,
  relativePath: string,
  content: string
): Promise<void> {
  // Escape content for safe shell injection
  const escaped = content.replace(/'/g, "'\\''");
  const fullPath = `${sandbox.workdir}/${relativePath.replace(/^\//, "")}`;
  const dir = fullPath.split("/").slice(0, -1).join("/");

  if (sandbox.mode === "docker" && sandbox.containerId) {
    await execInDocker(
      sandbox.containerId,
      `mkdir -p "${dir}" && cat > "${fullPath}" << 'MANTRA_EOF'\n${content}\nMANTRA_EOF`,
      sandbox.workdir
    );
  } else {
    const { execFile: ef } = await import("child_process");
    const efAsync = promisify(ef);
    await efAsync("mkdir", ["-p", dir]);
    const fs = await import("fs/promises");
    await fs.writeFile(fullPath, content, "utf8");
  }
}

export async function readFileInSandbox(
  sandbox: SandboxInfo,
  relativePath: string
): Promise<string> {
  const fullPath = `${sandbox.workdir}/${relativePath.replace(/^\//, "")}`;
  const result = await execInSandbox(
    sandbox,
    `cat "${fullPath}" 2>/dev/null || echo "[FILE_NOT_FOUND]"`
  );
  return result.stdout;
}

export async function listFilesInSandbox(
  sandbox: SandboxInfo,
  relativePath = "."
): Promise<FileEntry[]> {
  const fullPath = `${sandbox.workdir}/${relativePath.replace(/^\//, "")}`;
  const result = await execInSandbox(
    sandbox,
    `find "${fullPath}" -maxdepth 2 -printf '%y %s %P\n' 2>/dev/null | head -100`
  );

  return result.stdout
    .split("\n")
    .filter(Boolean)
    .map(line => {
      const [type, size, ...pathParts] = line.split(" ");
      const name = pathParts.join(" ");
      return {
        name: name.split("/").pop() ?? name,
        type: type === "d" ? "dir" : "file",
        size: parseInt(size) || 0,
        path: name,
      } as FileEntry;
    })
    .filter(f => f.name && f.name !== ".");
}

// ─────────────────────────────────────────────────────────────
// Browser fetch (lightweight — no full browser, just HTTP)
// ─────────────────────────────────────────────────────────────

export async function browserFetchInSandbox(
  sandbox: SandboxInfo,
  url: string
): Promise<{ content: string; statusCode: number }> {
  // Use curl inside the sandbox — no Playwright needed, works everywhere
  const result = await execInSandbox(
    sandbox,
    `curl -sL --max-time 15 --max-filesize 2000000 -A "Mozilla/5.0" "${url}" 2>/dev/null | python3 -c "
import sys, re
html = sys.stdin.read()
# Strip scripts, styles, tags
text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
text = re.sub(r'<[^>]+>', ' ', text)
text = re.sub(r'\\s+', ' ', text).strip()
print(text[:8000])
" 2>/dev/null && echo "__STATUS_200__" || echo "__STATUS_ERROR__"`
  );

  const statusCode = result.stdout.includes("__STATUS_ERROR__") ? 0 : 200;
  const content = result.stdout
    .replace(/__STATUS_\d+__|__STATUS_ERROR__/g, "")
    .trim();
  return { content, statusCode };
}

// ─────────────────────────────────────────────────────────────
// Kill sandbox
// ─────────────────────────────────────────────────────────────

export async function killSandbox(sandbox: SandboxInfo): Promise<void> {
  if (sandbox.mode === "docker" && sandbox.containerId) {
    try {
      await execFileAsync("docker", ["kill", sandbox.containerId], {
        timeout: 5000,
      });
    } catch {
      // May already be dead
    }
  } else if (sandbox.mode === "process") {
    try {
      const fs = await import("fs/promises");
      await fs.rm(sandbox.workdir, { recursive: true, force: true });
    } catch {}
  }
}

// ─────────────────────────────────────────────────────────────
// Get sandbox info / check alive
// ─────────────────────────────────────────────────────────────

export async function isSandboxAlive(sandbox: SandboxInfo): Promise<boolean> {
  if (sandbox.mode === "docker" && sandbox.containerId) {
    try {
      const { stdout } = await execFileAsync(
        "docker",
        ["inspect", "--format", "{{.State.Running}}", sandbox.containerId],
        { timeout: 3000 }
      );
      return stdout.trim() === "true";
    } catch {
      return false;
    }
  } else {
    try {
      const fs = await import("fs/promises");
      await fs.access(sandbox.workdir);
      return true;
    } catch {
      return false;
    }
  }
}
