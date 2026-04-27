import { z } from 'zod'
import { contactRefinement, optionalEmail, optionalPhone } from './common'

export const customerSchema = z
  .object({
    name: z.string().min(1, 'Este campo es obligatorio'),
    type: z.enum(['residential', 'business', 'community', 'industrial']),
    legal_name: z.string().optional(),
    tax_id: z.string().optional(),
    contact_name: z.string().optional(),
    email: optionalEmail,
    phone: optionalPhone,
    address: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    postal_code: z.string().regex(/^\d{5}$/, 'El codigo postal debe tener 5 digitos').optional().or(z.literal('')),
    notes: z.string().optional(),
  })
  .refine((data) => Boolean(data.email || data.phone), contactRefinement)

export type CustomerFormValues = z.infer<typeof customerSchema>
