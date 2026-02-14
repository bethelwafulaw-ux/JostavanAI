import { ModelConfig, AgentConfig } from '@/types';

export const APP_NAME = 'Jostavan AI';
export const APP_TAGLINE = 'Agentic Developer Platform';

export const MODEL_CONFIGS: ModelConfig[] = [
  {
    id: 'fast',
    name: 'Flash',
    description: 'Fastest responses for quick iterations',
    provider: 'Google',
    model: 'gemini-1.5-flash',
    speed: '~1s',
    quality: 'Good',
  },
  {
    id: 'balanced',
    name: 'Sonnet',
    description: 'Best balance of speed and quality',
    provider: 'Anthropic',
    model: 'claude-3.5-sonnet',
    speed: '~3s',
    quality: 'Excellent',
  },
  {
    id: 'reasoning',
    name: 'Pro',
    description: 'Maximum reasoning for complex tasks',
    provider: 'Google',
    model: 'gemini-1.5-pro',
    speed: '~8s',
    quality: 'Superior',
  },
];

// Advanced Multi-Agent Configuration
// Each agent is specialized for a specific phase of development
export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  orchestrator: {
    id: 'orchestrator',
    name: 'Master Orchestrator',
    role: 'Pipeline Controller',
    description: 'Coordinates all agents and manages the development pipeline',
    icon: 'Brain',
    color: 'gradient',
    model: 'gemini-1.5-pro',
    provider: 'Google',
    strengths: ['Task decomposition', 'Agent coordination', 'Context management'],
    phase: 0,
  },
  blueprinter: {
    id: 'blueprinter',
    name: 'The Blueprinter',
    role: 'Design Validation',
    description: 'Validates design specs from Auditor - approves or requests more detail',
    icon: 'Layers',
    color: 'cyan',
    model: 'gemini-1.5-pro',
    provider: 'Google',
    strengths: ['Design validation', 'Quality gate', 'Architecture review'],
    phase: 2, // Now validates AFTER Auditor design analysis
  },
  dataLayer: {
    id: 'dataLayer',
    name: 'The Data Architect',
    role: 'Database & Schema',
    description: 'Designs SQL schemas, normalizes data, and defines relationships',
    icon: 'Database',
    color: 'purple',
    model: 'claude-3.5-sonnet',
    provider: 'Anthropic',
    strengths: ['Data modeling', 'SQL optimization', 'Relationship mapping'],
    phase: 2,
  },
  uiDesigner: {
    id: 'uiDesigner',
    name: 'The UI Craftsman',
    role: 'Frontend & Design',
    description: 'Creates React/Next.js components with Tailwind CSS and animations',
    icon: 'Palette',
    color: 'pink',
    model: 'claude-3.5-sonnet',
    provider: 'Anthropic',
    strengths: ['Design taste', 'Clean code', 'Modern patterns'],
    phase: 3,
  },
  security: {
    id: 'security',
    name: 'The Guardian',
    role: 'Security & Auth',
    description: 'Implements authentication, JWT, encryption, and RLS policies',
    icon: 'Shield',
    color: 'amber',
    model: 'gpt-4o',
    provider: 'OpenAI',
    strengths: ['Security protocols', 'Best practices', 'Vulnerability prevention'],
    phase: 4,
  },
  liveIntel: {
    id: 'liveIntel',
    name: 'The Scout',
    role: 'Live Research',
    description: 'Accesses live internet for current docs, versions, and advisories',
    icon: 'Globe',
    color: 'green',
    model: 'perplexity-sonar',
    provider: 'Perplexity',
    strengths: ['Real-time data', 'Latest versions', 'Security advisories'],
    phase: 5,
  },
  fastChat: {
    id: 'fastChat',
    name: 'The Assistant',
    role: 'Quick Q&A',
    description: 'Handles sidebar questions, explanations, and token counting',
    icon: 'Zap',
    color: 'blue',
    model: 'gemini-1.5-flash',
    provider: 'Google',
    strengths: ['Low latency', 'Cost effective', 'Quick responses'],
    phase: 6,
  },
  finalCheck: {
    id: 'finalCheck',
    name: 'The Auditor',
    role: 'Design Analysis & Code Review',
    description: 'First analyzes requests for design specs, then runs 8-pass autonomous code review',
    icon: 'CheckCircle2',
    color: 'emerald',
    model: 'o1',
    provider: 'OpenAI',
    strengths: ['Design analysis', 'Multi-pass audit', '8x autonomous review', 'Self-fixing'],
    phase: 1, // Now runs FIRST for design analysis
  },
};

// Agent execution order for full pipeline (v3.0 CURSOR-STYLE WORKFLOW)
// 1. Auditor first (design analysis + AST indexing)
// 2. Blueprinter (validation gate)
// 3. Data Architect + UI Craftsman (PARALLEL execution)
// 4. Guardian (security scan)
// 5. Auditor again (8-pass review with auto-fix)
// 6. Scout (version check)
export const AGENT_PIPELINE_ORDER: (keyof typeof AGENT_CONFIGS)[] = [
  'finalCheck',    // Phase 1: Design Analysis + AST Index
  'blueprinter',   // Phase 2: Validation Gate
  'dataLayer',     // Phase 3a: Schema Generation (parallel)
  'uiDesigner',    // Phase 3b: UI Implementation (parallel)
  'security',      // Phase 4: Security Scan
  'finalCheck',    // Phase 5: 8-Pass Autonomous Audit
  'liveIntel',     // Phase 6: Version Check
];

// Phase descriptions for UI (v3.0 CURSOR-STYLE)
export const PHASE_DESCRIPTIONS: Record<string, string> = {
  idle: 'Waiting for input...',
  designAnalysis: 'Auditor: AST indexing + design analysis...',
  blueprinting: 'Blueprinter: Validating design specs...',
  dataLayer: 'Parallel: Data Architect + UI Craftsman...',
  uiDesign: 'Parallel: Building components...',
  security: 'Guardian: Security scan...',
  liveIntel: 'Scout: Checking versions...',
  fastChat: 'Processing quick response...',
  finalCheck: 'Auditor: 8-pass autonomous review...',
  errorResolution: 'Auto-fixing issues...',
  complete: 'All tasks completed!',
};

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/api-keys', label: 'API Keys', icon: 'Key' },
  { path: '/vibecoder', label: 'VibeCoder', icon: 'Terminal' },
  { path: '/docs', label: 'Documentation', icon: 'BookOpen' },
  { path: '/usage', label: 'Usage', icon: 'BarChart3' },
];

export const API_KEY_PREFIX = 'sk-jostavan-';

export const STORAGE_KEYS = {
  API_KEYS: 'jostavan_api_keys',
  USER: 'jostavan_user',
  CHAT_SESSIONS: 'jostavan_chat_sessions',
  USAGE_RECORDS: 'jostavan_usage_records',
};
