import { Button } from '../ui/button'

export function FormActions({ submitLabel = 'Guardar' }: { submitLabel?: string }) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
      <Button type="submit">{submitLabel}</Button>
    </div>
  )
}
