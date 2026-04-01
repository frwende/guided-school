import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  // Validate Supabase anon key
  const auth = req.headers.get('Authorization') || '';
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY') || '';
  if (!CLAUDE_API_KEY) {
    return new Response(JSON.stringify({ error: 'CLAUDE_API_KEY not configured' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const { model, system, messages, max_tokens } = await req.json();

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
    },
    body: JSON.stringify({ model, system, messages, max_tokens }),
  });

  const data = await claudeRes.json();
  return new Response(JSON.stringify(data), {
    status: claudeRes.status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
