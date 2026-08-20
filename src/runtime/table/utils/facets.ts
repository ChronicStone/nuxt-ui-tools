import { isFunction, isNumber, isObject } from '../../shared/utils/predicate'
import type {
  TableFilterFacetConfig,
  TableFilterFacetSpec,
  TableGlobalFacetDescriptor,
  TableUiFilterDefinition,
} from '../types'

export function hasPerFilterFacetQuery(
  facet: TableFilterFacetSpec | undefined,
): facet is TableFilterFacetConfig & Required<Pick<TableFilterFacetConfig, 'query'>> {
  return isObject(facet) && isFunction(facet.query)
}

export function resolveTableFacetMode(
  facet: TableFilterFacetSpec | undefined,
): 'exclude-self' | 'include-self' {
  if (facet === 'include-self') return 'include-self'
  if (isObject(facet) && facet.mode === 'include-self') return 'include-self'
  return 'exclude-self'
}

export function resolveTableGlobalFacetDescriptors(
  definitions: TableUiFilterDefinition[],
): TableGlobalFacetDescriptor<string>[] {
  return definitions.flatMap((definition) => {
    if (definition.kind !== 'option' && definition.kind !== 'boolean') return []

    const facet = definition.source?.facet
    if (!facet || hasPerFilterFacetQuery(facet)) return []

    return [
      {
        key: definition.key,
        mode: resolveTableFacetMode(facet),
        limit: isFacetLimit(facet) ? facet.limit : undefined,
      },
    ]
  })
}

function isFacetLimit(value: TableFilterFacetSpec | undefined): value is TableFilterFacetConfig {
  return isObject(value) && (value.limit === undefined || isNumber(value.limit))
}
