import { Badge } from '../ui/badge'

export function StatusBadge({ value }: { value: string }) {
  const variant =
    value.includes('Ganado') ||
      value.includes('Acept') ||
      value.includes('Firm') ||
      value.includes('Complet') ||
      value.includes('Convert')
      ? 'emerald'
      : value.includes('Perd') || value.includes('Rechaz') || value.includes('Cancel')
        ? 'destructive'
        : value.includes('Urgente') || value.includes('Alta') || value.includes('Envi') || value.includes('Renovacion')
          ? 'amber'
          : value.includes('curso') || value.includes('Program')
            ? 'sky'
            : 'outline'

  return <Badge variant={variant}>{value}</Badge>
}
