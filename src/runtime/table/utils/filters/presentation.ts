import { getResponsiveValue } from '../../../shared'
import { isString } from '../../../shared/utils/predicate'
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

function isFilterDisplayLocation<TValue>(
  value: TValue,
): value is TValue & TableFilterDisplayLocation {
  return isString(value) && FILTER_DISPLAY_LOCATIONS.some((location) => location === value)
}
