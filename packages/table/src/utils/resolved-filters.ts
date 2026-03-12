import { isObject } from '@nuxt-ui-tools/shared'

import type {
  GenericObject,
  TableFilterState,
  TableResolvedFilterCondition,
  TableResolvedFilterGroup,
  TableResolvedFilterNode,
  TableStaticFilterNode,
  TableUiFilterDefinition,
} from '../types'
import { resolveFilterDefaultOperator } from './query-state'

export function createResolvedFilterState<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = string,
>(params: {
  definitions: Array<TableUiFilterDefinition<TRow, TContext, TKey>>
  filters: TableFilterState<TKey>
  staticFilters?: Array<TableStaticFilterNode<TRow, TContext, TKey>>
  context?: TContext
}): TableResolvedFilterGroup<TKey> {
  const children: TableResolvedFilterNode<TKey>[] = []

  for (const filter of params.staticFilters ?? []) {
    children.push(normalizeStaticFilterNode(filter))
  }

  for (const rule of params.filters.ui) {
    const definition = params.definitions.find((filter) => filter.key === rule.key)
    const operator = rule.operator ?? (definition ? resolveFilterDefaultOperator(definition as never) : 'is')

    if (!definition) {
      children.push({
        type: 'condition',
        key: rule.key,
        operator,
        value: rule.value,
      })
      continue
    }

    const resolvedNode =
      definition.resolve?.({
        rule: {
          ...rule,
          operator,
        },
        definition,
        context: params.context,
      }) ??
      ({
        type: 'condition',
        key: rule.key,
        operator,
        value: rule.value,
      } satisfies TableResolvedFilterCondition<TKey>)

    if (resolvedNode) {
      children.push(resolvedNode)
    }
  }

  return {
    type: 'group',
    combinator: 'and',
    children,
  }
}

function normalizeStaticFilterNode<TKey extends string = string>(
  filter: TableStaticFilterNode<GenericObject, GenericObject, TKey>,
): TableResolvedFilterNode<TKey> {
  if (isResolvedFilterGroup(filter)) {
    return {
      ...filter,
      children: filter.children.map((child) => normalizeStaticFilterNode(child as TableStaticFilterNode<GenericObject, GenericObject, TKey>)),
    }
  }

  return {
    type: 'condition',
    key: filter.key,
    operator: filter.operator,
    value: filter.value,
  }
}

function isResolvedFilterGroup<TKey extends string = string>(
  value: TableStaticFilterNode<GenericObject, GenericObject, TKey>,
): value is TableResolvedFilterGroup<TKey> {
  return isObject(value) && value.type === 'group' && Array.isArray(value.children)
}
