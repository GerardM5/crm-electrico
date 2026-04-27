import { z } from 'zod'

export const optionalEmail = z.union([z.email('Introduce un email valido'), z.literal(''), z.undefined()]).optional()
export const optionalPhone = z.string().min(9, 'El telefono debe tener al menos 9 caracteres').optional().or(z.literal(''))
export const positiveNumber = z.coerce.number('Debe ser un numero').min(0, 'Debe ser mayor o igual que 0')

export const contactRefinement = {
  message: 'Introduce al menos telefono o email',
  path: ['phone'],
}
