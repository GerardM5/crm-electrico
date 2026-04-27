import { z } from 'zod'

export const simulationSchema = z.object({
  customer_id: z.string().min(1, 'Este campo es obligatorio'),
  energy_profile_id: z.string().optional(),
  invoice_id: z.string().optional(),
  current_monthly_cost_eur: z.coerce.number().positive('Debe ser mayor que 0'),
  contracted_power_kw: z.coerce.number().min(0).optional(),
  monthly_consumption_kwh: z.coerce.number().min(0).optional(),
  tariff_type: z.string().optional(),
  estimated_saving_percent: z.coerce.number().min(0, 'Minimo 0%').max(80, 'Maximo 80%'),
  solar_investment_eur: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})

export type SimulationFormValues = z.infer<typeof simulationSchema>
