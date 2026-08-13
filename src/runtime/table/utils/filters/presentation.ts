import { getResponsiveValue } from '../../../shared'
import type {
  TableFilterDisplayLocation,
  TableFilterDisplayLocationValue,
  TableUiFilterDefinition,
} from '../../types'

const FILTER_DISPLAY_LOCATIONS = [
  'tag',
  'panel',
  'tag-dynamic',
] as const satisfies TableFilterDisplayLocation[]

export function resolveFilterDisplayLocation(
  value: TableFilterDisplayLocationValue | undefined,
): TableFilterDisplayLocation {
  if (!value) return 'tag'
  if (isFilterDisplayLocation(value)) return value

  const resolved = getResponsiveValue(value)
  return isFilterDisplayLocation(resolved) ? resolved : 'tag'
}

export function resolveFilterDisplayOrder(definition: TableUiFilterDefinition) {
  return definition.display?.order ?? Number.MAX_SAFE_INTEGER
}

function isFilterDisplayLocation(value: unknown): value is TableFilterDisplayLocation {
  return (
    typeof value === 'string' &&
    FILTER_DISPLAY_LOCATIONS.includes(value as TableFilterDisplayLocation)
  )
}
