/**
 * renewal-notify — runs daily via Supabase cron (pg_cron).
 *
 * SQL to schedule (run once in SQL editor):
 * SELECT cron.schedule('renewal-notify', '0 8 * * *',
 *   $$SELECT net.http_post(
 *     url := current_setting('app.supabase_url') || '/functions/v1/renewal-notify',
 *     headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
 *     body := '{}'::jsonb
 *   )$$
 * );
 */

import { createClient } from 'npm:@supabase/supabase-js@2.105.0'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const today = new Date()
  const alertWindowDays = 60 // notify 60 days before renewal

  const alertDate = new Date(today)
  alertDate.setDate(alertDate.getDate() + alertWindowDays)

  // Find customers whose renewal_date is within the next 60 days
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, email, renewal_date, renewal_alert_months, assigned_to, profiles!customers_assigned_to_fkey(email, full_name)')
    .is('deleted_at', null)
    .eq('status', 'active')
    .gte('renewal_date', today.toISOString().split('T')[0])
    .lte('renewal_date', alertDate.toISOString().split('T')[0])

  if (error) {
    console.error('renewal-notify query error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  const results: string[] = []

  for (const customer of customers ?? []) {
    const assignee = Array.isArray(customer.profiles)
      ? customer.profiles[0]
      : customer.profiles

    if (!assignee?.email) continue

    const renewalDate = customer.renewal_date
    const daysLeft = Math.ceil(
      (new Date(renewalDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    )

    // Log the activity
    await supabase.from('activity_logs').insert({
      entity_type: 'customer',
      entity_id: customer.id,
      action: 'renewal_alert_sent',
      metadata: { days_left: daysLeft, renewal_date: renewalDate, assignee_email: assignee.email },
    })

    // In production: send email via Resend/SendGrid here
    // For now, just log it
    results.push(`${customer.name} — ${daysLeft} days (→ ${assignee.email})`)
    console.log(`renewal-notify: ${customer.name} renews ${renewalDate} in ${daysLeft} days — notified ${assignee.email}`)
  }

  // Update customers whose renewal_date has passed to 'renewal_due'
  await supabase
    .from('customers')
    .update({ status: 'renewal_due' } as never)
    .is('deleted_at', null)
    .eq('status', 'active')
    .lt('renewal_date', today.toISOString().split('T')[0])

  return new Response(
    JSON.stringify({ processed: results.length, customers: results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
  )
})
