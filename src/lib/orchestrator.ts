/**
 * Jostavan AI - Advanced Multi-Agent Orchestrator
 * 
 * A sophisticated pipeline that routes tasks to specialized AI models:
 * 
 * 1. Blueprinter (Gemini 1.5 Pro) - PRD, Architecture, System Design
 * 2. Data Layer (Claude 3.5 Sonnet) - SQL, Schemas, Relations
 * 3. UI Designer (Claude 3.5 Sonnet) - React, Tailwind, Animations
 * 4. Security (GPT-4o) - Auth, JWT, Encryption, RLS
 * 5. Live Intel (Perplexity) - Real-time research, versions
 * 6. Fast Chat (Gemini 1.5 Flash) - Quick Q&A, explanations
 * 7. Final Check (OpenAI o1) - Logic audit, bug fixes, refactoring
 */

import {
  AgentManifest,
  AgentType,
  AgentPhase,
  DataLayerSchema,
  SecurityAudit,
  LiveIntelReport,
  FinalCheckResult,
  FileOperation,
  OrchestratorContext,
} from '@/types';
import { AGENT_CONFIGS } from '@/constants/config';

// ============================================
// AGENT SYSTEM PROMPTS
// ============================================

const SYSTEM_PROMPTS = {
  blueprinter: `You are The Blueprinter, a senior systems architect with a 2M token context window.
Your task is to analyze requirements and create comprehensive project blueprints.

CAPABILITIES:
- Remember entire project history and all files simultaneously
- Create detailed Product Requirement Documents (PRDs)
- Design system architecture and data flow diagrams
- Identify file structure and dependencies
- Plan feature implementation in logical phases

OUTPUT FORMAT (JSON):
{
  "task": "Brief description",
  "projectType": "webapp|api|fullstack|component|utility",
  "files": [{ "path": "src/...", "operation": "create|update" }],
  "dependencies": ["package-name"],
  "devDependencies": ["dev-package"],
  "architecture": {
    "patterns": ["Pattern names"],
    "dataFlow": "Description of data flow",
    "stateManagement": "Chosen approach"
  },
  "notes": ["Important considerations"],
  "securityConsiderations": ["Security notes"]
}`,

  dataLayer: `You are The Data Architect, specialized in database design using Claude 3.5 Sonnet's superior understanding of data structures.

CAPABILITIES:
- Design normalized SQL schemas
- Define table relationships and foreign keys
- Create efficient indexes for common queries
- Implement Row Level Security (RLS) policies
- Map data structures to modern application needs

OUTPUT FORMAT (JSON):
{
  "tables": [{
    "name": "table_name",
    "columns": [{ "name": "col", "type": "TEXT|INTEGER|UUID|etc", "constraints": ["PRIMARY KEY", "NOT NULL"] }],
    "relations": [{ "table": "other_table", "type": "one-to-many" }]
  }],
  "indexes": ["CREATE INDEX idx_name ON table(column)"],
  "rlsPolicies": ["CREATE POLICY policy_name ON table..."]
}`,

  uiDesigner: `You are The UI Craftsman, leveraging Claude 3.5 Sonnet's superior "design taste" for frontend development.

CAPABILITIES:
- Create beautiful React/Next.js components
- Write clean, semantic Tailwind CSS
- Implement smooth animations and transitions
- Follow accessibility best practices
- Build responsive layouts that work everywhere

PRINCIPLES:
- Component-first architecture
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui for base components
- Framer Motion for animations
- Mobile-first responsive design`,

  security: `You are The Guardian, using GPT-4o's disciplined approach to security.

CAPABILITIES:
- Implement robust authentication flows
- Design JWT token strategies
- Configure encryption at rest and in transit
- Create Row Level Security (RLS) policies
- Prevent common vulnerabilities (XSS, CSRF, SQL Injection)

PRINCIPLES:
- Never take creative shortcuts with security
- Follow established security protocols strictly
- Defense in depth approach
- Principle of least privilege
- Zero trust architecture

OUTPUT FORMAT (JSON):
{
  "authMethod": "JWT|Session|OAuth",
  "encryption": ["bcrypt for passwords", "AES-256 for data"],
  "vulnerabilities": [{ "severity": "low|medium|high|critical", "description": "...", "fix": "..." }],
  "recommendations": ["Security improvements"],
  "passed": true|false
}`,

  liveIntel: `You are The Scout, powered by Perplexity's live internet access.

CAPABILITIES:
- Access real-time 2026 internet
- Check latest library versions on npm/PyPI
- Scan for security advisories
- Find current API documentation
- Identify deprecated libraries

OUTPUT FORMAT (JSON):
{
  "libraryVersions": [{ "name": "lib", "currentVersion": "1.0.0", "latestVersion": "2.0.0", "updateRequired": true }],
  "deprecations": ["Library X is deprecated, use Y instead"],
  "securityAdvisories": ["CVE-2026-XXXX affects package Z"],
  "recommendations": ["Updates and changes needed"]
}`,

  fastChat: `You are The Assistant, using Gemini 1.5 Flash for instant responses.

CAPABILITIES:
- Answer quick questions
- Explain code snippets
- Provide token counts
- Give general guidance
- Clarify requirements

PRINCIPLES:
- Be concise and direct
- Respond in under 2 seconds
- Focus on what's asked
- No unnecessary elaboration`,

  finalCheck: `You are The Auditor, the senior lead using OpenAI o1's chain-of-thought reasoning.

CAPABILITIES:
- Perform deep logic audits
- Identify subtle bugs through mental execution
- Refactor code autonomously
- Ensure code quality before delivery
- Simulate runtime to catch edge cases

PROCESS:
1. Read each file and mentally execute the code
2. Identify logical errors and edge cases
3. Fix bugs and improve code quality
4. Document all changes with explanations
5. Approve only when code is production-ready

OUTPUT FORMAT (JSON):
{
  "logicAudit": {
    "passed": true|false,
    "issues": [{ "file": "...", "line": 42, "issue": "...", "fix": "..." }]
  },
  "bugFixes": [{ "file": "...", "original": "...", "fixed": "...", "explanation": "..." }],
  "refactoringSuggestions": [{ "file": "...", "suggestion": "...", "priority": "high" }],
  "overallScore": 95,
  "approved": true
}`,
};

// ============================================
// MOCK RESPONSE GENERATORS
// ============================================

function generateBlueprintResponse(prompt: string): AgentManifest {
  const lowerPrompt = prompt.toLowerCase();
  const files: FileOperation[] = [];
  const dependencies: string[] = ['react', 'react-dom', 'tailwindcss'];
  const devDependencies: string[] = ['typescript', '@types/react'];
  
  // Analyze prompt for project type and files needed
  let projectType: AgentManifest['projectType'] = 'component';
  
  if (lowerPrompt.includes('fullstack') || lowerPrompt.includes('full stack') || 
      (lowerPrompt.includes('frontend') && lowerPrompt.includes('backend'))) {
    projectType = 'fullstack';
  } else if (lowerPrompt.includes('api') || lowerPrompt.includes('backend')) {
    projectType = 'api';
  } else if (lowerPrompt.includes('app') || lowerPrompt.includes('dashboard') || 
             lowerPrompt.includes('website')) {
    projectType = 'webapp';
  }
  
  // Auth-related files
  if (lowerPrompt.includes('auth') || lowerPrompt.includes('login') || 
      lowerPrompt.includes('signup') || lowerPrompt.includes('user')) {
    files.push(
      { path: 'src/components/auth/LoginForm.tsx', operation: 'create' },
      { path: 'src/components/auth/SignupForm.tsx', operation: 'create' },
      { path: 'src/components/auth/AuthProvider.tsx', operation: 'create' },
      { path: 'src/lib/auth.ts', operation: 'create' },
      { path: 'src/hooks/useAuth.ts', operation: 'create' }
    );
    dependencies.push('@supabase/supabase-js', 'bcryptjs', 'jsonwebtoken');
    devDependencies.push('@types/bcryptjs', '@types/jsonwebtoken');
  }
  
  // Dashboard files
  if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('admin')) {
    files.push(
      { path: 'src/pages/Dashboard.tsx', operation: 'create' },
      { path: 'src/components/dashboard/StatsCard.tsx', operation: 'create' },
      { path: 'src/components/dashboard/ActivityFeed.tsx', operation: 'create' },
      { path: 'src/components/dashboard/Charts.tsx', operation: 'create' }
    );
    dependencies.push('recharts');
  }
  
  // API files
  if (lowerPrompt.includes('api') || projectType === 'api' || projectType === 'fullstack') {
    files.push(
      { path: 'src/lib/api.ts', operation: 'create' },
      { path: 'src/types/api.ts', operation: 'create' },
      { path: 'supabase/functions/api/index.ts', operation: 'create' }
    );
  }
  
  // E-commerce files
  if (lowerPrompt.includes('ecommerce') || lowerPrompt.includes('shop') || 
      lowerPrompt.includes('cart') || lowerPrompt.includes('product')) {
    files.push(
      { path: 'src/components/products/ProductCard.tsx', operation: 'create' },
      { path: 'src/components/products/ProductGrid.tsx', operation: 'create' },
      { path: 'src/components/cart/CartDrawer.tsx', operation: 'create' },
      { path: 'src/components/cart/CartItem.tsx', operation: 'create' },
      { path: 'src/hooks/useCart.ts', operation: 'create' }
    );
    dependencies.push('zustand');
  }
  
  // Default file if nothing detected
  if (files.length === 0) {
    files.push(
      { path: 'src/components/Feature.tsx', operation: 'create' },
      { path: 'src/hooks/useFeature.ts', operation: 'create' }
    );
  }
  
  return {
    task: prompt.slice(0, 100),
    projectType,
    files,
    dependencies,
    devDependencies,
    architecture: {
      patterns: ['Component-driven', 'Hooks for state', 'Services for logic'],
      dataFlow: 'Unidirectional: User Action → Hook → Service → API → State Update → Re-render',
      stateManagement: files.length > 3 ? 'Zustand for global state' : 'React useState/useReducer',
    },
    notes: [
      'Following React 18+ best practices',
      'TypeScript strict mode enabled',
      'Tailwind CSS for styling with shadcn/ui components',
    ],
    securityConsiderations: [
      'Input validation on all forms',
      'XSS prevention via React\'s automatic escaping',
      'CSRF tokens for state-changing operations',
    ],
  };
}

function generateDataLayerSchema(manifest: AgentManifest): DataLayerSchema {
  const tables: DataLayerSchema['tables'] = [];
  const indexes: string[] = [];
  const rlsPolicies: string[] = [];
  
  // Check for auth-related files
  const hasAuth = manifest.files.some(f => 
    f.path.includes('auth') || f.path.includes('user')
  );
  
  if (hasAuth) {
    tables.push({
      name: 'users',
      columns: [
        { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT uuid_generate_v4()'] },
        { name: 'email', type: 'VARCHAR(255)', constraints: ['UNIQUE', 'NOT NULL'] },
        { name: 'password_hash', type: 'VARCHAR(255)', constraints: ['NOT NULL'] },
        { name: 'name', type: 'VARCHAR(255)' },
        { name: 'avatar_url', type: 'TEXT' },
        { name: 'created_at', type: 'TIMESTAMPTZ', constraints: ['DEFAULT NOW()'] },
        { name: 'updated_at', type: 'TIMESTAMPTZ', constraints: ['DEFAULT NOW()'] },
      ],
      relations: [],
    });
    indexes.push('CREATE INDEX idx_users_email ON users(email);');
    rlsPolicies.push(
      'ALTER TABLE users ENABLE ROW LEVEL SECURITY;',
      'CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);',
      'CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);'
    );
    
    tables.push({
      name: 'sessions',
      columns: [
        { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY'] },
        { name: 'user_id', type: 'UUID', constraints: ['REFERENCES users(id) ON DELETE CASCADE'] },
        { name: 'token', type: 'VARCHAR(255)', constraints: ['UNIQUE', 'NOT NULL'] },
        { name: 'expires_at', type: 'TIMESTAMPTZ', constraints: ['NOT NULL'] },
        { name: 'created_at', type: 'TIMESTAMPTZ', constraints: ['DEFAULT NOW()'] },
      ],
      relations: [{ table: 'users', type: 'many-to-many' }],
    });
  }
  
  // Check for e-commerce files
  const hasEcommerce = manifest.files.some(f => 
    f.path.includes('product') || f.path.includes('cart')
  );
  
  if (hasEcommerce) {
    tables.push({
      name: 'products',
      columns: [
        { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT uuid_generate_v4()'] },
        { name: 'name', type: 'VARCHAR(255)', constraints: ['NOT NULL'] },
        { name: 'description', type: 'TEXT' },
        { name: 'price', type: 'DECIMAL(10,2)', constraints: ['NOT NULL'] },
        { name: 'image_url', type: 'TEXT' },
        { name: 'category', type: 'VARCHAR(100)' },
        { name: 'stock', type: 'INTEGER', constraints: ['DEFAULT 0'] },
        { name: 'created_at', type: 'TIMESTAMPTZ', constraints: ['DEFAULT NOW()'] },
      ],
    });
    indexes.push('CREATE INDEX idx_products_category ON products(category);');
    
    tables.push({
      name: 'orders',
      columns: [
        { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY'] },
        { name: 'user_id', type: 'UUID', constraints: ['REFERENCES users(id)'] },
        { name: 'total', type: 'DECIMAL(10,2)', constraints: ['NOT NULL'] },
        { name: 'status', type: 'VARCHAR(50)', constraints: ['DEFAULT \'pending\''] },
        { name: 'created_at', type: 'TIMESTAMPTZ', constraints: ['DEFAULT NOW()'] },
      ],
      relations: [{ table: 'users', type: 'many-to-many' }],
    });
    
    tables.push({
      name: 'order_items',
      columns: [
        { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY'] },
        { name: 'order_id', type: 'UUID', constraints: ['REFERENCES orders(id) ON DELETE CASCADE'] },
        { name: 'product_id', type: 'UUID', constraints: ['REFERENCES products(id)'] },
        { name: 'quantity', type: 'INTEGER', constraints: ['NOT NULL'] },
        { name: 'price', type: 'DECIMAL(10,2)', constraints: ['NOT NULL'] },
      ],
      relations: [
        { table: 'orders', type: 'many-to-many' },
        { table: 'products', type: 'many-to-many' },
      ],
    });
  }
  
  return { tables, indexes, rlsPolicies };
}

function generateSecurityAudit(manifest: AgentManifest): SecurityAudit {
  const vulnerabilities: SecurityAudit['vulnerabilities'] = [];
  const recommendations: string[] = [];
  
  const hasAuth = manifest.files.some(f => f.path.includes('auth'));
  
  if (hasAuth) {
    recommendations.push(
      'Use bcrypt with cost factor ≥ 12 for password hashing',
      'Implement rate limiting on login endpoints (max 5 attempts per 15 min)',
      'Use HttpOnly, Secure, SameSite=Strict cookies for session tokens',
      'Implement CSRF protection for all state-changing operations'
    );
  }
  
  // Check for potential vulnerabilities based on project type
  if (manifest.projectType === 'webapp' || manifest.projectType === 'fullstack') {
    vulnerabilities.push({
      severity: 'medium',
      description: 'Ensure all user inputs are validated and sanitized',
      fix: 'Use Zod schemas for input validation on both client and server',
    });
  }
  
  if (manifest.dependencies?.includes('@supabase/supabase-js')) {
    recommendations.push(
      'Enable Row Level Security (RLS) on all tables',
      'Never expose service_role key on the client',
      'Use anon key only for client-side operations'
    );
  }
  
  return {
    authMethod: hasAuth ? 'JWT with refresh tokens' : 'N/A',
    encryption: ['bcrypt (passwords)', 'TLS 1.3 (transit)', 'AES-256-GCM (sensitive data)'],
    vulnerabilities,
    recommendations,
    passed: vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
  };
}

function generateLiveIntelReport(manifest: AgentManifest): LiveIntelReport {
  const libraryVersions: LiveIntelReport['libraryVersions'] = [];
  
  // Simulate version checking
  manifest.dependencies?.forEach(dep => {
    const versions: Record<string, { current: string; latest: string }> = {
      'react': { current: '18.2.0', latest: '19.0.0' },
      'react-dom': { current: '18.2.0', latest: '19.0.0' },
      '@supabase/supabase-js': { current: '2.38.0', latest: '2.45.0' },
      'tailwindcss': { current: '3.4.0', latest: '3.4.11' },
      'zustand': { current: '4.4.0', latest: '4.5.2' },
      'recharts': { current: '2.8.0', latest: '2.12.0' },
    };
    
    const v = versions[dep];
    if (v) {
      libraryVersions.push({
        name: dep,
        currentVersion: v.current,
        latestVersion: v.latest,
        updateRequired: v.current !== v.latest,
      });
    }
  });
  
  return {
    libraryVersions,
    deprecations: [
      'react-scripts is deprecated, use Vite instead ✓ (already using Vite)',
    ],
    securityAdvisories: [
      'No critical vulnerabilities found in specified dependencies',
    ],
    recommendations: [
      'Consider upgrading to React 19 for improved performance',
      'Update Supabase client to latest for new features',
    ],
  };
}

function generateFinalCheckResult(files: FileOperation[]): FinalCheckResult {
  const issues: FinalCheckResult['logicAudit']['issues'] = [];
  const bugFixes: FinalCheckResult['bugFixes'] = [];
  const refactoringSuggestions: FinalCheckResult['refactoringSuggestions'] = [];
  
  files.forEach(file => {
    if (file.content) {
      // Check for common issues
      if (file.content.includes('any')) {
        issues.push({
          file: file.path,
          issue: 'Usage of \'any\' type reduces type safety',
          fix: 'Replace with specific types or \'unknown\'',
        });
      }
      
      if (file.content.includes('console.log')) {
        refactoringSuggestions.push({
          file: file.path,
          suggestion: 'Remove console.log statements before production',
          priority: 'low',
        });
      }
      
      if (!file.content.includes('try') && file.content.includes('await')) {
        issues.push({
          file: file.path,
          issue: 'Async operations without error handling',
          fix: 'Wrap async operations in try-catch or use error boundaries',
        });
      }
    }
  });
  
  const hasIssues = issues.length > 0;
  const overallScore = Math.max(70, 100 - (issues.length * 5) - (refactoringSuggestions.length * 2));
  
  return {
    logicAudit: { passed: !hasIssues, issues },
    bugFixes,
    refactoringSuggestions,
    overallScore,
    approved: overallScore >= 80,
  };
}

// ============================================
// CODE GENERATION TEMPLATES
// ============================================

export const CODE_TEMPLATES = {
  loginForm: `import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  onSuccess?: () => void;
  onSignupClick?: () => void;
}

export function LoginForm({ onSuccess, onSignupClick }: LoginFormProps) {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
          
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSignupClick}
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}`,

  authService: `/**
 * Authentication Service
 * Handles all auth operations with Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: { message: error.message, code: error.code } };
  }

  if (data.user) {
    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name,
        avatar: data.user.user_metadata?.avatar_url,
      },
      error: null,
    };
  }

  return { user: null, error: { message: 'Unknown error occurred' } };
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string, name?: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    return { user: null, error: { message: error.message, code: error.code } };
  }

  if (data.user) {
    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name,
      },
      error: null,
    };
  }

  return { user: null, error: null };
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error: error ? { message: error.message } : null };
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name,
        avatar: session.user.user_metadata?.avatar_url,
      });
    } else {
      callback(null);
    }
  });
}`,

  useAuth: `import { useState, useEffect, useCallback } from 'react';
import { AuthUser, signIn, signUp, signOut, getSession, onAuthStateChange } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check initial session
    getSession().then((session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name,
          avatar: session.user.user_metadata?.avatar_url,
        });
      }
      setIsLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = onAuthStateChange(setUser);
    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    const result = await signIn(email, password);
    
    if (result.error) {
      setError(result.error.message);
      setIsLoading(false);
      return false;
    }
    
    setUser(result.user);
    setIsLoading(false);
    return true;
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    setError(null);
    
    const result = await signUp(email, password, name);
    
    if (result.error) {
      setError(result.error.message);
      setIsLoading(false);
      return false;
    }
    
    setIsLoading(false);
    return true;
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await signOut();
    setUser(null);
    setIsLoading(false);
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
}`,

  dashboard: `import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
}

function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
  const isPositive = change >= 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={cn(
          'flex items-center text-xs mt-1',
          isPositive ? 'text-green-500' : 'text-red-500'
        )}>
          {isPositive ? (
            <ArrowUpRight className="size-3 mr-1" />
          ) : (
            <ArrowDownRight className="size-3 mr-1" />
          )}
          {Math.abs(change)}% from last month
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  
  const stats = [
    { title: 'Total Revenue', value: '$45,231.89', change: 20.1, icon: DollarSign },
    { title: 'Subscriptions', value: '+2,350', change: 180.1, icon: Users },
    { title: 'Sales', value: '+12,234', change: 19, icon: Activity },
    { title: 'Active Now', value: '+573', change: -2.1, icon: TrendingUp },
  ];
  
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'User'}</h1>
        <p className="text-muted-foreground">Here's what's happening with your business today.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your team's latest actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                    <Users className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New user registered</p>
                    <p className="text-xs text-muted-foreground">{i} hour{i > 1 ? 's' : ''} ago</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to do</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start">
              <Users className="mr-2 size-4" /> Invite team member
            </Button>
            <Button variant="outline" className="justify-start">
              <Activity className="mr-2 size-4" /> View analytics
            </Button>
            <Button variant="outline" className="justify-start">
              <DollarSign className="mr-2 size-4" /> Manage billing
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}`,

  genericComponent: (name: string) => `import { cn } from '@/lib/utils';

interface ${name}Props {
  className?: string;
  children?: React.ReactNode;
}

export function ${name}({ className, children }: ${name}Props) {
  return (
    <div className={cn('p-4 rounded-lg border', className)}>
      {children || <p className="text-muted-foreground">Add content here</p>}
    </div>
  );
}`,
};

// ============================================
// MAIN ORCHESTRATOR CLASS
// ============================================

export class MasterOrchestrator {
  private context: OrchestratorContext;
  private onUpdate: (phase: AgentPhase, message: string, agent?: AgentType) => void;
  private onFileUpdate: (file: FileOperation) => void;
  
  constructor(
    sessionId: string,
    prompt: string,
    onUpdate: (phase: AgentPhase, message: string, agent?: AgentType) => void,
    onFileUpdate: (file: FileOperation) => void
  ) {
    this.context = {
      sessionId,
      prompt,
      projectType: 'component',
      currentPhase: 'idle',
      agentOutputs: {} as Record<AgentType, unknown>,
      files: [],
      errors: [],
    };
    this.onUpdate = onUpdate;
    this.onFileUpdate = onFileUpdate;
  }
  
  /**
   * Run the complete pipeline
   */
  async run(): Promise<{
    manifest: AgentManifest;
    dataSchema: DataLayerSchema;
    securityAudit: SecurityAudit;
    liveIntel: LiveIntelReport;
    finalCheck: FinalCheckResult;
    files: FileOperation[];
  }> {
    // Phase 1: Blueprinting
    this.context.currentPhase = 'blueprinting';
    this.onUpdate('blueprinting', 'Analyzing requirements and creating project blueprint...', 'blueprinter');
    const manifest = await this.runBlueprintPhase();
    this.context.agentOutputs.blueprinter = manifest;
    this.context.projectType = manifest.projectType;
    
    // Phase 2: Data Layer
    this.context.currentPhase = 'dataLayer';
    this.onUpdate('dataLayer', 'Designing database schemas and relationships...', 'dataLayer');
    const dataSchema = await this.runDataLayerPhase(manifest);
    this.context.agentOutputs.dataLayer = dataSchema;
    
    // Phase 3: UI/UX Design
    this.context.currentPhase = 'uiDesign';
    this.onUpdate('uiDesign', 'Crafting React components with Tailwind CSS...', 'uiDesigner');
    const files = await this.runUIDesignPhase(manifest);
    this.context.files = files;
    
    // Phase 4: Security
    this.context.currentPhase = 'security';
    this.onUpdate('security', 'Implementing security measures and auditing...', 'security');
    const securityAudit = await this.runSecurityPhase(manifest);
    this.context.agentOutputs.security = securityAudit;
    
    // Phase 5: Live Intel
    this.context.currentPhase = 'liveIntel';
    this.onUpdate('liveIntel', 'Checking latest library versions and advisories...', 'liveIntel');
    const liveIntel = await this.runLiveIntelPhase(manifest);
    this.context.agentOutputs.liveIntel = liveIntel;
    
    // Phase 6: Final Check
    this.context.currentPhase = 'finalCheck';
    this.onUpdate('finalCheck', 'Running final audit and fixing bugs...', 'finalCheck');
    const finalCheck = await this.runFinalCheckPhase(files);
    this.context.agentOutputs.finalCheck = finalCheck;
    
    // Complete
    this.context.currentPhase = 'complete';
    this.onUpdate('complete', 'All phases completed successfully!', 'orchestrator');
    
    return { manifest, dataSchema, securityAudit, liveIntel, finalCheck, files };
  }
  
  private async runBlueprintPhase(): Promise<AgentManifest> {
    await this.simulateDelay(800);
    return generateBlueprintResponse(this.context.prompt);
  }
  
  private async runDataLayerPhase(manifest: AgentManifest): Promise<DataLayerSchema> {
    await this.simulateDelay(1000);
    return generateDataLayerSchema(manifest);
  }
  
  private async runUIDesignPhase(manifest: AgentManifest): Promise<FileOperation[]> {
    const files: FileOperation[] = [];
    
    for (const file of manifest.files) {
      await this.simulateDelay(500);
      
      let content = '';
      
      if (file.path.includes('LoginForm')) {
        content = CODE_TEMPLATES.loginForm;
      } else if (file.path.includes('auth.ts')) {
        content = CODE_TEMPLATES.authService;
      } else if (file.path.includes('useAuth')) {
        content = CODE_TEMPLATES.useAuth;
      } else if (file.path.includes('Dashboard')) {
        content = CODE_TEMPLATES.dashboard;
      } else {
        const componentName = file.path.split('/').pop()?.replace('.tsx', '') || 'Component';
        content = CODE_TEMPLATES.genericComponent(componentName);
      }
      
      const generatedFile: FileOperation = {
        ...file,
        content,
        language: this.getLanguageFromPath(file.path),
      };
      
      files.push(generatedFile);
      this.onFileUpdate(generatedFile);
    }
    
    return files;
  }
  
  private async runSecurityPhase(manifest: AgentManifest): Promise<SecurityAudit> {
    await this.simulateDelay(800);
    return generateSecurityAudit(manifest);
  }
  
  private async runLiveIntelPhase(manifest: AgentManifest): Promise<LiveIntelReport> {
    await this.simulateDelay(600);
    return generateLiveIntelReport(manifest);
  }
  
  private async runFinalCheckPhase(files: FileOperation[]): Promise<FinalCheckResult> {
    await this.simulateDelay(1200);
    return generateFinalCheckResult(files);
  }
  
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      json: 'json',
      css: 'css',
      html: 'html',
      sql: 'sql',
    };
    return langMap[ext || ''] || 'plaintext';
  }
}

// ============================================
// FAST CHAT HANDLER
// ============================================

export async function handleFastChat(message: string): Promise<string> {
  // Simulate fast response
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('token') || lowerMessage.includes('count')) {
    const wordCount = message.split(/\s+/).length;
    const estimatedTokens = Math.ceil(wordCount * 1.3);
    return `Estimated tokens: ~${estimatedTokens}. Token count varies by model - GPT models use ~1.3 tokens per word, while Claude uses ~1.2.`;
  }
  
  if (lowerMessage.includes('help')) {
    return `I can help you with:
• Building web apps (describe what you want)
• Explaining code snippets
• Answering React/TypeScript questions
• Counting tokens in your prompts

Just describe what you want to build!`;
  }
  
  return `I understand you're asking about "${message.slice(0, 50)}...". Would you like me to build something specific? Just describe the feature or component you need!`;
}

// Export convenience function
export async function processAgenticTask(
  prompt: string,
  sessionId: string,
  onUpdate: (phase: AgentPhase, message: string, agent?: AgentType) => void,
  onFileUpdate: (file: FileOperation) => void
) {
  const orchestrator = new MasterOrchestrator(sessionId, prompt, onUpdate, onFileUpdate);
  return orchestrator.run();
}
