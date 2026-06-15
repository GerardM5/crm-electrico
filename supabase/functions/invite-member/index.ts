import { createClient } from 'npm:@supabase/supabase-js@2.105.0'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Admin client with SERVICE_ROLE to bypass RLS and send invites
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    // Verify the caller is authenticated and is owner/admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || !['owner', 'admin'].includes(callerProfile.role)) {
      throw new Error('Forbidden: only owner/admin can invite members')
    }

    const body = await req.json()
    const { email, full_name, role, phone } = body

    if (!email || !full_name || !role) {
      throw new Error('email, full_name and role are required')
    }

    // Invite user — Supabase sends a magic link that routes through set-password
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { full_name, role, phone: phone ?? null },
        redirectTo: `${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/set-password`,
      },
    )

    if (inviteError) throw inviteError

    // The on_auth_user_created trigger auto-creates the profile row.
    // In case the trigger ran before metadata was set, upsert to be safe.
    await supabaseAdmin.from('profiles').upsert(
      {
        id: inviteData.user.id,
        email,
        full_name,
        role,
        phone: phone ?? null,
      },
      { onConflict: 'id' },
    )

    return new Response(
      JSON.stringify({ success: true, userId: inviteData.user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    const status = message.startsWith('Unauthorized') || message.startsWith('Forbidden') ? 403 : 400
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status },
    )
  }
})
