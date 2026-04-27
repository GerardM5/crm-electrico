import { toast } from 'sonner'

export function useToastError() {
  return (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'
    toast.error(message)
  }
}
