export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface APIKey {
  id: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
  status: 'active' | 'revoked';
}

export interface UsageRecord {
  id: string;
  keyId: string;
  timestamp: string;
  tokens: number;
  model: string;
  endpoint: string;
  cost: number;
}

export interface DailyUsage {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
}

export type ModelType = 'fast' | 'balanced' | 'reasoning';

export interface ModelConfig {
  id: ModelType;
  name: string;
  description: string;
  provider: string;
  model: string;
  speed: string;
  quality: string;
}

// Multi-Agent System Types
export type AgentType = 
  | 'orchestrator'
  | 'blueprinter'
  | 'dataLayer'
  | 'uiDesigner'
  | 'security'
  | 'liveIntel'
  | 'fastChat'
  | 'finalCheck';

export type AgentPhase = 
  | 'idle'
  | 'blueprinting'
  | 'dataLayer'
  | 'uiDesign'
  | 'security'
  | 'liveIntel'
  | 'fastChat'
  | 'finalCheck'
  | 'complete';

export interface AgentConfig {
  id: AgentType;
  name: string;
  role: string;
  description: string;
  icon: string;
  color: string;
  model: string;
  provider: string;
  strengths: string[];
  phase: number;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agent?: AgentType;
  model?: string;
  tokens?: number;
  phase?: AgentPhase;
  metadata?: {
    duration?: number;
    confidence?: number;
    filesAffected?: string[];
  };
}

export interface FileOperation {
  path: string;
  operation: 'create' | 'update' | 'delete';
  content?: string;
  language?: string;
}

export interface AgentManifest {
  task: string;
  projectType: 'webapp' | 'api' | 'fullstack' | 'component' | 'utility';
  files: FileOperation[];
  dependencies?: string[];
  devDependencies?: string[];
  architecture?: {
    patterns: string[];
    dataFlow: string;
    stateManagement: string;
  };
  notes?: string[];
  securityConsiderations?: string[];
}

export interface DataLayerSchema {
  tables: {
    name: string;
    columns: { name: string; type: string; constraints?: string[] }[];
    relations?: { table: string; type: 'one-to-one' | 'one-to-many' | 'many-to-many' }[];
  }[];
  indexes?: string[];
  rlsPolicies?: string[];
}

export interface SecurityAudit {
  authMethod: string;
  encryption: string[];
  vulnerabilities: { severity: 'low' | 'medium' | 'high' | 'critical'; description: string; fix: string }[];
  recommendations: string[];
  passed: boolean;
}

export interface LiveIntelReport {
  libraryVersions: { name: string; currentVersion: string; latestVersion: string; updateRequired: boolean }[];
  deprecations: string[];
  securityAdvisories: string[];
  recommendations: string[];
}

export interface FinalCheckResult {
  logicAudit: { passed: boolean; issues: { file: string; line?: number; issue: string; fix: string }[] };
  bugFixes: { file: string; original: string; fixed: string; explanation: string }[];
  refactoringSuggestions: { file: string; suggestion: string; priority: 'low' | 'medium' | 'high' }[];
  overallScore: number;
  approved: boolean;
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
  status: 'pending' | 'generating' | 'complete' | 'error' | 'reviewing' | 'approved';
  generatedBy?: AgentType;
  reviewedBy?: AgentType[];
  lastModified?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: AgentMessage[];
  files: CodeFile[];
  model: ModelType;
  currentPhase: AgentPhase;
  manifest?: AgentManifest;
  dataSchema?: DataLayerSchema;
  securityAudit?: SecurityAudit;
  liveIntel?: LiveIntelReport;
  finalCheck?: FinalCheckResult;
  createdAt: string;
  updatedAt: string;
}

export interface OrchestratorContext {
  sessionId: string;
  prompt: string;
  projectType: AgentManifest['projectType'];
  currentPhase: AgentPhase;
  agentOutputs: Record<AgentType, unknown>;
  files: CodeFile[];
  errors: string[];
}
