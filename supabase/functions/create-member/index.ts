import { createClient } from 'npm:@supabase/supabase-js@2.105.0'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Admin client with SERVICE_ROLE to bypass RLS and create users
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
      throw new Error('Forbidden: only owner/admin can create members')
    }

    const body = await req.json()
    const { email, full_name, role, phone, password } = body

    if (!email || !full_name || !role || !password) {
      throw new Error('email, full_name, role and password are required')
    }
    if (typeof password !== 'string' || password.length < 8) {
      throw new Error('password must be at least 8 characters')
    }

    // Create the account directly with the assigned password.
    // email_confirm: true lets the member log in immediately — no invite email.
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role, phone: phone ?? null },
    })

    if (createError) throw createError

    // The on_auth_user_created trigger auto-creates the profile (id, full_name,
    // email, role). Upsert to persist phone and guard against trigger races.
    await supabaseAdmin.from('profiles').upsert(
      {
        id: created.user.id,
        email,
        full_name,
        role,
        phone: phone ?? null,
      },
      { onConflict: 'id' },
    )

    return new Response(
      JSON.stringify({ success: true, userId: created.user.id }),
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
