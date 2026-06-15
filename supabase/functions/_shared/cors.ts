export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': [
    'authorization',
    'x-client-info',
    'apikey',
    'content-type',
    'x-supabase-client-platform',
    'x-supabase-client-platform-version',
    'x-supabase-client-runtime',
    'x-supabase-client-runtime-version',
  ].join(', '),
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function handleCors(req: Request) {
  if (req.method !== 'OPTIONS') return null

  return new Response(null, { status: 204, headers: corsHeaders })
}
