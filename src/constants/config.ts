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
    role: 'PRD & Architecture',
    description: 'Creates detailed product specs, logic flows, and system architecture',
    icon: 'Layers',
    color: 'cyan',
    model: 'gemini-1.5-pro',
    provider: 'Google',
    strengths: ['2M token context', 'Complex reasoning', 'Full project memory'],
    phase: 1,
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
    role: 'Final QA & Fixes',
    description: 'Logic audit, bug fixes, and autonomous refactoring before delivery',
    icon: 'CheckCircle2',
    color: 'emerald',
    model: 'o1',
    provider: 'OpenAI',
    strengths: ['Chain of thought', 'Deep reasoning', 'Autonomous fixes'],
    phase: 7,
  },
};

// Agent execution order for full pipeline
export const AGENT_PIPELINE_ORDER: (keyof typeof AGENT_CONFIGS)[] = [
  'blueprinter',
  'dataLayer',
  'uiDesigner',
  'security',
  'liveIntel',
  'finalCheck',
];

// Phase descriptions for UI
export const PHASE_DESCRIPTIONS = {
  idle: 'Waiting for input...',
  blueprinting: 'Creating project blueprint and architecture...',
  dataLayer: 'Designing database schemas and relationships...',
  uiDesign: 'Crafting UI components and styling...',
  security: 'Implementing security measures...',
  liveIntel: 'Gathering latest library versions and advisories...',
  fastChat: 'Processing quick response...',
  finalCheck: 'Running final audit and fixing bugs...',
  complete: 'All tasks completed successfully!',
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
