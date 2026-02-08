import { User, APIKey, UsageRecord, DailyUsage, ChatSession, AgentPhase } from '@/types';

export const mockUser: User = {
  id: 'usr_1',
  email: 'developer@example.com',
  name: 'Alex Chen',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  createdAt: '2024-01-15T10:00:00Z',
};

export const mockAPIKeys: APIKey[] = [
  {
    id: 'key_1',
    name: 'Production Key',
    keyPrefix: 'sk-jostavan-prod-',
    keyHash: '8a7b6c5d4e3f2a1b9c8d7e6f5a4b3c2d',
    createdAt: '2024-01-20T14:30:00Z',
    lastUsed: '2024-02-15T09:45:00Z',
    usageCount: 1247,
    status: 'active',
  },
  {
    id: 'key_2',
    name: 'Development Key',
    keyPrefix: 'sk-jostavan-dev-',
    keyHash: '1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
    createdAt: '2024-02-01T09:00:00Z',
    lastUsed: '2024-02-14T16:20:00Z',
    usageCount: 456,
    status: 'active',
  },
  {
    id: 'key_3',
    name: 'Testing Key (Revoked)',
    keyPrefix: 'sk-jostavan-test-',
    keyHash: '2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f',
    createdAt: '2024-01-25T11:15:00Z',
    lastUsed: '2024-02-05T08:30:00Z',
    usageCount: 89,
    status: 'revoked',
  },
];

export const mockUsageRecords: UsageRecord[] = Array.from({ length: 50 }, (_, i) => ({
  id: `usage_${i + 1}`,
  keyId: ['key_1', 'key_2'][Math.floor(Math.random() * 2)],
  timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  tokens: Math.floor(Math.random() * 5000) + 500,
  model: ['gemini-1.5-flash', 'claude-3.5-sonnet', 'gemini-1.5-pro'][Math.floor(Math.random() * 3)],
  endpoint: '/v1/chat/completions',
  cost: Math.random() * 0.5 + 0.01,
}));

export const mockDailyUsage: DailyUsage[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split('T')[0],
    requests: Math.floor(Math.random() * 500) + 50,
    tokens: Math.floor(Math.random() * 100000) + 10000,
    cost: Math.random() * 20 + 2,
  };
});

export const mockChatSessions: ChatSession[] = [
  {
    id: 'session_1',
    title: 'Build Authentication System',
    messages: [
      {
        id: 'msg_1',
        role: 'user',
        content: 'Create a complete authentication system with login, signup, and password reset functionality.',
        timestamp: '2024-02-15T10:00:00Z',
      },
      {
        id: 'msg_2',
        role: 'assistant',
        content: 'I\'ll orchestrate the agents to build your authentication system. Let me break this down...',
        timestamp: '2024-02-15T10:00:05Z',
        agent: 'orchestrator',
      },
    ],
    files: [
      {
        path: 'src/components/auth/LoginForm.tsx',
        content: '// Login form component...',
        language: 'typescript',
        status: 'complete',
      },
    ],
    model: 'balanced',
    currentPhase: 'complete' as AgentPhase,
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2024-02-15T10:15:00Z',
  },
];

export const sampleCodeSnippets = {
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
};

export const documentationSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      { id: 'quickstart', title: 'Quickstart Guide' },
      { id: 'authentication', title: 'Authentication' },
      { id: 'api-keys', title: 'Managing API Keys' },
    ],
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    items: [
      { id: 'chat-completions', title: 'Chat Completions' },
      { id: 'orchestrator', title: 'Master Orchestrator' },
      { id: 'agents', title: 'Multi-Agent System' },
    ],
  },
  {
    id: 'agents',
    title: 'Agent Specialists',
    items: [
      { id: 'blueprinter', title: 'Blueprinter (Gemini 1.5 Pro)' },
      { id: 'data-architect', title: 'Data Architect (Claude 3.5)' },
      { id: 'ui-craftsman', title: 'UI Craftsman (Claude 3.5)' },
      { id: 'guardian', title: 'Guardian (GPT-4o)' },
      { id: 'scout', title: 'Scout (Perplexity)' },
      { id: 'assistant', title: 'Assistant (Gemini Flash)' },
      { id: 'auditor', title: 'Auditor (OpenAI o1)' },
    ],
  },
  {
    id: 'guides',
    title: 'Guides',
    items: [
      { id: 'best-practices', title: 'Best Practices' },
      { id: 'error-handling', title: 'Error Handling' },
      { id: 'rate-limits', title: 'Rate Limits' },
      { id: 'custom-agents', title: 'Custom Agent Pipelines' },
    ],
  },
];
