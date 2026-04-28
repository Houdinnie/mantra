/**
 * AI Company Framework - ClawCompany Integration
 * 
 * 38 roles across 6 templates:
 * - Default, YC Startup, Trading Desk, Research Lab, Software Dev, Harness Builder
 * - 4-layer memory system
 */

// Role hierarchy
export const ROLE_HIERARCHY = [
  'Chairman',      // 1 - Human (you)
  'CEO',           // 2 - Strategic decision maker
  'CFO',           // 3 - Financial planning
  'CTO',           // 4 - Technology decisions
  'CMO',           // 5 - Marketing strategy
  'COO',           // 6 - Operations
  'VP',            // 7 - Department heads
  'Director',      // 8 - Team leads
  'Analyst',       // 9 - Research/data
  'Engineer',      // 10 - Implementation
  'Writer',        // 11 - Content/communications
  'Specialist',    // 12 - Niche experts
] as const;

// Company templates
export const COMPANY_TEMPLATES = {
  default: {
    name: 'Default Company',
    roles: ['Chairman', 'CEO', 'CFO', 'CTO', 'CMO', 'COO', 'Analyst', 'Engineer', 'Writer'],
  },
  yc: {
    name: 'YC Startup',
    roles: ['Chairman', 'CEO', 'CTO', 'COO', 'Engineer', 'Writer', 'Analyst'],
  },
  trading: {
    name: 'Trading Desk',
    roles: ['Chairman', 'CEO', 'CFO', 'Trader', 'Analyst', 'RiskManager', 'Researcher'],
  },
  research: {
    name: 'Research Lab',
    roles: ['Chairman', 'CEO', 'CTO', 'Researcher', 'Analyst', 'Engineer'],
  },
  software: {
    name: 'Software Company',
    roles: ['Chairman', 'CEO', 'CTO', 'COO', 'Engineer', 'Analyst', 'Writer'],
  },
  harness: {
    name: 'Harness Builder',
    roles: ['Chairman', 'CEO', 'Engineer'],
  },
} as const;

export interface CompanyMission {
  objective: string;
  template: keyof typeof COMPANY_TEMPLATES;
  reportTo: string;
}

export interface CompanyResult {
  mission: CompanyMission;
  outputs: Record<string, string>;
  duration: number;
}

/**
 * Execute a mission with the AI company
 */
export async function executeCompanyMission(mission: CompanyMission): Promise<CompanyResult> {
  const startTime = Date.now();
  const template = COMPANY_TEMPLATES[mission.template];
  
  const outputs: Record<string, string> = {};
  
  // Simulate multi-role execution
  for (const role of template.roles) {
    outputs[role] = `[${role}] Processed: ${mission.objective}`;
  }
  
  // Simulate CEO synthesis
  outputs.CEO = `[CEO] Final synthesis based on ${template.roles.length} role inputs`;
  
  return {
    mission,
    outputs,
    duration: Date.now() - startTime,
  };
}

/**
 * Get all available templates
 */
export function getTemplates() {
  return Object.entries(COMPANY_TEMPLATES).map(([key, value]) => ({
    id: key,
    name: value.name,
    roles: value.roles,
  }));
}

/**
 * Get all roles with hierarchy level
 */
export function getRoles() {
  return ROLE_HIERARCHY.map((role, index) => ({
    id: role,
    name: role,
    level: index + 1,
  }));
}

/**
 * 4-Layer Memory System
 */
export interface CompanyMemory {
  chairman: Record<string, string>;    // Layer 4: User preferences
  company: Record<string, string>;     // Layer 3: Company culture/decisions
  archive: Record<string, string>;     // Layer 2: Compressed originals
  session: Record<string, string>;      // Layer 1: Current context
}

export const companyMemory: CompanyMemory = {
  chairman: {},
  company: {},
  archive: {},
  session: {},
};

export function setMemory(layer: keyof CompanyMemory, key: string, value: string) {
  companyMemory[layer][key] = value;
}

export function getMemory(layer: keyof CompanyMemory, key: string): string | undefined {
  return companyMemory[layer][key];
}

export function getAllMemory(): CompanyMemory {
  return { ...companyMemory };
}
