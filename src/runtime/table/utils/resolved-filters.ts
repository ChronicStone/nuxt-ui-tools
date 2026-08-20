import { isArray, isObject } from '../../shared/utils/predicate'
import type {
  GenericObject,
  TableFilterState,
  TableResolvedFilterGroup,
  TableResolvedFilterNode,
  TableStaticFilterNode,
  TableUiFilterDefinition,
} from '../types'
import { normalizeFilterDefinition, resolveFilterDefaultOperator } from './query-state'

export function createResolvedFilterState<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = string,
>(params: {
  definitions: Array<TableUiFilterDefinition<TRow, TContext, TKey>>
  filters: TableFilterState<TKey>
  staticFilters?: Array<TableStaticFilterNode<TRow, TContext, TKey>>
  context?: TContext
}): TableResolvedFilterGroup<string> {
  const children: TableResolvedFilterNode<string>[] = []

  for (const filter of params.staticFilters ?? []) {
    children.push(normalizeStaticFilterNode(filter))
  }

  for (const rule of params.filters.ui) {
    const definition = params.definitions.find((filter) => filter.key === rule.key)
    const normalizedDefinition = definition ? normalizeFilterDefinition(definition) : null
    const operator =
      rule.operator ??
      (normalizedDefinition ? resolveFilterDefaultOperator(normalizedDefinition) : 'is')

    if (!definition) {
      children.push({
        type: 'condition',
        key: rule.key,
        operator,
        value: rule.value,
      })
      continue
    }

    const resolvedNode: TableResolvedFilterNode<string> | null = definition.resolve?.({
      rule: {
        ...rule,
        operator,
      },
      definition,
      context: params.context,
    }) ?? {
      type: 'condition',
      key: rule.key,
      operator,
      value: rule.value,
    }

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

function normalizeStaticFilterNode<
  TRow extends GenericObject,
  TContext extends GenericObject,
  TKey extends string,
>(filter: TableStaticFilterNode<TRow, TContext, TKey>): TableResolvedFilterNode<string> {
  if (isResolvedFilterGroup(filter)) {
    return {
      ...filter,
      children: filter.children.map((child) => normalizeResolvedFilterNode(child)),
    }
  }

  return {
    type: 'condition',
    key: filter.key,
    operator: filter.operator,
    value: filter.value,
  }
}

function normalizeResolvedFilterNode(
  node: TableResolvedFilterNode<string>,
): TableResolvedFilterNode<string> {
  if (node.type === 'group') {
    return {
      ...node,
      children: node.children.map((child) => normalizeResolvedFilterNode(child)),
    }
  }

  return node
}

function isResolvedFilterGroup<
  TRow extends GenericObject,
  TContext extends GenericObject,
  TKey extends string,
>(value: TableStaticFilterNode<TRow, TContext, TKey>): value is TableResolvedFilterGroup<TKey> {
  return (
    !!value &&
    isObject(value) &&
    'type' in value &&
    value.type === 'group' &&
    'children' in value &&
    isArray(value.children)
  )
}
