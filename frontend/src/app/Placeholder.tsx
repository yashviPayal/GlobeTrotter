import { Card } from '@/components/ui/Card'

/**
 * Temporary stand-in so every route in the plan resolves from day one.
 * Each of these is replaced by its real feature screen as it is built.
 */
export function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>

      <Card className="px-6 py-12 text-center text-sm text-muted">
        This screen is next up in the delivery plan.
      </Card>
    </section>
  )
}
