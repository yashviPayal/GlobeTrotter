/**
 * cost_index is a multiplier against a baseline of 1.0, so a bare number means
 * little on its own. These bands turn it into something a traveller can act on
 * while still showing the underlying figure.
 */
export function costLabel(costIndex: number): { label: string; tone: string } {
  if (costIndex >= 1.35) {
    return { label: `Expensive · ${costIndex.toFixed(2)}×`, tone: 'text-danger' }
  }

  if (costIndex >= 1.1) {
    return { label: `Moderate · ${costIndex.toFixed(2)}×`, tone: 'text-accent' }
  }

  return { label: `Affordable · ${costIndex.toFixed(2)}×`, tone: 'text-success' }
}
