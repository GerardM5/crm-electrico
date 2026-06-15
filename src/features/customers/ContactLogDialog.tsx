import { type FormEvent, type ReactNode, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, Textarea } from '../../components/ui/input'
import { useCustomerActions } from '../../hooks/use-customer-actions'

function formatDateTimeLocal(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function ContactLogDialog({
  customerId,
  customerName,
  trigger,
}: {
  customerId: string
  customerName: string
  trigger: ReactNode
}) {
  const { logContact, isPending } = useCustomerActions()
  const [open, setOpen] = useState(false)
  const [contactedAt, setContactedAt] = useState(() => formatDateTimeLocal(new Date()))
  const [notes, setNotes] = useState('')

  function reset() {
    setContactedAt(formatDateTimeLocal(new Date()))
    setNotes('')
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    logContact({ customerId, contactedAt, notes })
    setOpen(false)
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
      title={`Registrar llamada con ${customerName}`}
      description="Guarda fecha, hora y notas de la llamada en la actividad del cliente."
      trigger={trigger}
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <Field label="Fecha y hora">
          <Input type="datetime-local" value={contactedAt} onChange={(event) => setContactedAt(event.target.value)} required />
        </Field>
        <Field label="Notas de la llamada">
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Resumen de la conversación, siguiente paso, objeciones, etc."
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando…' : 'Guardar actividad'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
