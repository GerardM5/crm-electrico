import { z } from 'zod'
import { contactRefinement, optionalEmail, optionalPhone, positiveNumber } from './common'

export const leadSchema = z
  .object({
    company_name: z.string().optional(),
    contact_name: z.string().min(1, 'Este campo es obligatorio'),
    email: optionalEmail,
    phone: optionalPhone,
    source: z.string().min(1, 'Este campo es obligatorio'),
    status: z.enum(['new', 'contacted', 'qualified', 'lost', 'converted']).default('new'),
    city: z.string().optional(),
    notes: z.string().optional(),
    estimated_monthly_bill: positiveNumber.optional(),
    assigned_to: z.string().optional(),
  })
  .refine((data) => Boolean(data.email || data.phone), contactRefinement)

export type LeadFormValues = z.infer<typeof leadSchema>
