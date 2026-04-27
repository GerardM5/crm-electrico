import { z } from 'zod'

export const energyProfileSchema = z.object({
  customer_id: z.string().min(1),
  cups: z.string().min(20, 'CUPS demasiado corto').max(22, 'CUPS demasiado largo').optional().or(z.literal('')),
  tariff_type: z.string().min(1, 'Este campo es obligatorio'),
  contracted_power_kw: z.coerce.number().positive('Debe ser mayor que 0'),
  monthly_consumption_kwh: z.coerce.number().positive('Debe ser mayor que 0'),
  monthly_cost_eur: z.coerce.number().positive('Debe ser mayor que 0'),
  annual_consumption_kwh: z.coerce.number().min(0).optional(),
  has_solar: z.coerce.boolean().default(false),
  roof_area_m2: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})

export type EnergyProfileFormValues = z.infer<typeof energyProfileSchema>
