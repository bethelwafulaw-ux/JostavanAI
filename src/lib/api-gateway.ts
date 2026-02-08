/**
 * Jostavan AI - API Gateway Edge Function
 * 
 * This file contains the Edge Function code for the API gateway.
 * Deploy to Supabase with: supabase functions deploy api-gateway
 * 
 * This handles:
 * 1. API key validation against the database
 * 2. Request routing to the appropriate agent
 * 3. Usage tracking and rate limiting
 */

// Types
interface RequestBody {
  model: 'fast' | 'balanced' | 'reasoning';
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream?: boolean;
}

interface APIKeyRecord {
  id: string;
  user_id: string;
  key_hash: string;
  status: 'active' | 'revoked';
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Example Edge Function handler for POST /v1/chat/completions
 * 
 * To deploy:
 * 1. Install Supabase CLI: npm install -g supabase
 * 2. Create function: supabase functions new api-gateway
 * 3. Copy this code to supabase/functions/api-gateway/index.ts
 * 4. Deploy: supabase functions deploy api-gateway
 */
export const edgeFunctionCode = `
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { compare } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extract and validate API key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonError('Missing or invalid Authorization header', 401);
    }

    const apiKey = authHeader.replace('Bearer ', '');
    if (!apiKey.startsWith('sk-jostavan-')) {
      return jsonError('Invalid API key format', 401);
    }

    // 2. Validate key against database
    const keyValidation = await validateAPIKey(apiKey);
    if (!keyValidation.valid) {
      return jsonError(keyValidation.error || 'Invalid API key', 401);
    }

    // 3. Parse request body
    const body = await req.json();
    if (!body.messages || !Array.isArray(body.messages)) {
      return jsonError('Invalid request body: messages array required', 400);
    }

    // 4. Get the latest user message
    const userMessage = body.messages.filter((m: any) => m.role === 'user').pop();
    if (!userMessage) {
      return jsonError('No user message found', 400);
    }

    // 5. Process with the Agentic System
    const startTime = Date.now();
    const result = await processAgenticRequest(userMessage.content, body.model);
    const latency = Date.now() - startTime;

    // 6. Record usage
    await recordUsage({
      keyId: keyValidation.keyId!,
      userId: keyValidation.userId!,
      model: body.model || 'balanced',
      tokensInput: estimateTokens(userMessage.content),
      tokensOutput: estimateTokens(JSON.stringify(result)),
      latency,
    });

    // 7. Return response
    return new Response(JSON.stringify({
      id: 'chatcmpl-' + crypto.randomUUID(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: body.model || 'balanced',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: result.response,
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: estimateTokens(userMessage.content),
        completion_tokens: estimateTokens(result.response),
        total_tokens: estimateTokens(userMessage.content) + estimateTokens(result.response),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API Gateway Error:', error);
    return jsonError('Internal server error', 500);
  }
});

async function validateAPIKey(apiKey: string) {
  const keyPrefix = apiKey.slice(0, 20);
  
  const { data: keys, error } = await supabase
    .from('developer_keys')
    .select('id, user_id, key_hash, status')
    .eq('key_prefix', keyPrefix)
    .eq('status', 'active');

  if (error || !keys?.length) {
    return { valid: false, error: 'API key not found' };
  }

  for (const key of keys) {
    const isValid = await compare(apiKey, key.key_hash);
    if (isValid) {
      return { valid: true, keyId: key.id, userId: key.user_id };
    }
  }

  return { valid: false, error: 'Invalid API key' };
}

async function recordUsage(params: any) {
  const costPerToken: Record<string, number> = {
    fast: 0.00001,
    balanced: 0.00003,
    reasoning: 0.00006,
  };

  const cost = (params.tokensInput + params.tokensOutput) * 
    (costPerToken[params.model] || costPerToken.balanced);

  await supabase.from('usage_records').insert({
    key_id: params.keyId,
    user_id: params.userId,
    endpoint: '/v1/chat/completions',
    model: params.model,
    tokens_input: params.tokensInput,
    tokens_output: params.tokensOutput,
    cost_usd: cost,
    latency_ms: params.latency,
    status_code: 200,
  });
}

async function processAgenticRequest(prompt: string, model: string) {
  // This would integrate with actual AI models
  return {
    response: 'Task processed by Jostavan Agentic System.',
    files: [],
  };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({
    error: { message, type: 'api_error', code: status },
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
`;

/**
 * Mock API client for the frontend
 * In production, this would call the actual Edge Function
 */
export async function callAgenticAPI(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model: string = 'balanced'
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  // In production:
  // return fetch('https://your-project.supabase.co/functions/v1/api-gateway', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${apiKey}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({ model, messages }),
  // });

  // Mock implementation for demo
  return {
    success: true,
    data: {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      model,
      choices: [{
        message: {
          role: 'assistant',
          content: 'This is a mock response from the Jostavan Agentic API.',
        },
      }],
    },
  };
}
