import { Card } from '@/components/ui/Card'

/**
 * A headline number. Text wears text tokens — the value never takes a brand
 * colour, so the row reads as data rather than as decoration.
 */
export function StatTile({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="font-display text-2xl font-bold leading-none text-ink">{value}</dd>
      {detail && <p className="text-xs text-muted">{detail}</p>}
    </Card>
  )
}
