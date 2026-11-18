import { isArray, isBoolean, isNumber, isObject, isString } from '../../shared/utils/predicate'
import { TABLE_FILTER_NONE_VALUE } from '../constants/query-state'
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
  definitions: TableUiFilterDefinition<TRow, TContext, TKey>[]
  filters: TableFilterState<TKey>
  staticFilters?: TableStaticFilterNode<TRow, TContext, TKey>[]
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
        key: rule.key,
        operator,
        type: 'condition',
        value: rule.value,
      })
      continue
    }

    const noneNode = resolveNoneRule({ context: params.context, definition, operator, rule })
    if (noneNode) {
      children.push(noneNode)
      continue
    }

    const resolvedNode: TableResolvedFilterNode<string> | null = definition.resolve?.({
      context: params.context,
      definition,
      rule: {
        ...rule,
        operator,
      },
    }) ?? {
      key: rule.key,
      operator,
      type: 'condition',
      value: rule.value,
    }

    if (resolvedNode) {
      children.push(resolvedNode)
    }
  }

  return {
    children,
    combinator: 'and',
    type: 'group',
  }
}

/**
 * `source.none`: the `~none` value becomes an `isEmpty` condition OR-ed with the picked values
 * (`isNot`: AND-ed with `isNotEmpty`). A custom `resolve` only ever sees the real values.
 */
function resolveNoneRule<
  TRow extends GenericObject,
  TContext extends GenericObject,
  TKey extends string,
>(params: {
  definition: TableUiFilterDefinition<TRow, TContext, TKey>
  rule: TableFilterState<TKey>['ui'][number]
  operator: NonNullable<TableFilterState<TKey>['ui'][number]['operator']>
  context?: TContext
}): TableResolvedFilterNode<string> | null {
  const none = params.definition.kind === 'option' ? params.definition.source?.none : undefined
  const values = isArray(params.rule.value) ? params.rule.value : [params.rule.value]
  if (!none || !values.some((value) => value === TABLE_FILTER_NONE_VALUE)) {
    return null
  }

  const exclude = params.operator === 'isNot'
  const emptyNode: TableResolvedFilterNode<string> = {
    key: none.key ?? params.definition.key,
    operator: exclude ? 'isNotEmpty' : 'isEmpty',
    type: 'condition',
    value: null,
  }
  const picked = values.filter(
    (value): value is string | number | boolean =>
      (isString(value) || isNumber(value) || isBoolean(value)) && value !== TABLE_FILTER_NONE_VALUE,
  )
  if (!picked.length) {
    return emptyNode
  }

  const rule = { ...params.rule, operator: params.operator, value: picked }
  const valueNode = params.definition.resolve?.({
    context: params.context,
    definition: params.definition,
    rule,
  }) ?? { key: rule.key, operator: rule.operator, type: 'condition' as const, value: picked }

  return valueNode
    ? { children: [valueNode, emptyNode], combinator: exclude ? 'and' : 'or', type: 'group' }
    : emptyNode
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
    key: filter.key,
    operator: filter.operator,
    type: 'condition',
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

/**
 * Drops the rules of filters marked `behavior.applyTo: 'query'`, which feed the source query but
 * never narrow client rows.
 */
export function withoutQueryFilterRules(options: {
  definitions: TableUiFilterDefinition[]
  filters: TableFilterState
}): TableFilterState {
  const queryKeys = new Set(
    options.definitions
      .filter((definition) => definition.behavior?.applyTo === 'query')
      .map((definition) => definition.key),
  )

  return queryKeys.size === 0
    ? options.filters
    : { ...options.filters, ui: options.filters.ui.filter((rule) => !queryKeys.has(rule.key)) }
}
