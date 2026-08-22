import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { City } from '@/types/api'

import { CityImage } from './CityImage'
import { costLabel } from './costIndex'

export function CityCard({
  city,
  onAdd,
  onPlan,
}: {
  city: City
  onAdd?: (city: City) => void
  onPlan?: (city: City) => void
}) {
  const cost = costLabel(city.cost_index)

  return (
    <Card interactive className="overflow-hidden">
      <Link to={`/cities/${city.id}`} className="flex flex-1 flex-col">
        <CityImage
          name={city.name}
          url={city.image_url}
          width={600}
          className="h-36 w-full"
        />

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight">{city.name}</h3>
            <p className="mt-0.5 text-sm text-muted">
              {city.country.name}
              {city.region && ` · ${city.region}`}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-hairline pt-3">
            <span className={`text-xs font-medium ${cost.tone}`}>{cost.label}</span>
            <span className="text-xs text-muted">Popularity {city.popularity}</span>
          </div>
        </div>
      </Link>

      {(onAdd || onPlan) && (
        <div className="flex gap-2 border-t border-hairline p-3">
          {onAdd && (
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => onAdd(city)}>
              Add destination
            </Button>
          )}
          {onPlan && (
            <Button size="sm" className="flex-1" onClick={() => onPlan(city)}>
              Plan trip
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
