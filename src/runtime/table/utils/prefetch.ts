import type { InfiniteData } from '@tanstack/vue-query'

import type { QueryPrefetchRuntimeRoute } from '#ui-tools/query-prefetch/types/page'
import type { QueryPrefetchOption, QueryPrefetchQueries } from '#ui-tools/query-prefetch/types/plan'
import { defineQueryPrefetchPlan } from '#ui-tools/query-prefetch/utils/plan'

import {
  isArray,
  isBoolean,
  isFunction,
  isNumber,
  isObject,
  isNullish,
  isString,
} from '../../shared/utils/predicate'
import { QUERY_DEFAULTS } from '../constants/query-state'
import type {
  GenericObject,
  TableFilterFacetConfig,
  TableFilterState,
  TableLayout,
  TablePaginationState,
  TableCursorPageResult,
  TableOffsetPageResult,
  TableSchemaView,
  TableSourceExecutionResult,
  TableSourceRequestContext,
  TableSortingRule,
  TableUiFilterDefinition,
} from '../types'
import { createTableCursorQueryKey } from './cursor-query'
import { toTableRemoteSourceRequest } from './source-request'
import {
  hasPerFilterFacetQuery,
  resolveTableFacetMode,
  resolveTableGlobalFacetDescriptors,
} from './facets'
import {
  createTableFilterValueCodec,
  getDefaultPageSize,
  getDefaultSort,
  getPaginationMode,
  normalizeFilterDefinition,
  parseTableFilterQueryState,
  resolveFilterDefaultOperator,
  resolveFilterSupportedOperators,
} from './query-state'
import { createResolvedFilterState } from './resolved-filters'

type TablePrefetchContext = import('../../shared/types/utils').GenericObject
type TablePrefetchSourceResult =
  | GenericObject[]
  | TableSourceExecutionResult
  | TableOffsetPageResult
  | TableCursorPageResult
interface QueryWithDefaults {
  staleTime?: number
  refetchOnWindowFocus?: boolean
}
type RemoteFacetResolver = Exclude<
  NonNullable<Extract<TableSchemaView['source'], { mode: 'remote' }>['facets']>,
  true
>
type OptionQueryResolver = NonNullable<
  NonNullable<Extract<TableUiFilterDefinition, { kind: 'option' }>['source']>['query']
>

/**
 * Builds the staged TanStack Query plan required to render a table route.
 *
 * Context queries run first. The source, global facets, and remote filter-option
 * queries then receive that context and the destination route's table state.
 * Page-context queries run last with the prefetched source rows.
 *
 * @example
 * ```ts
 * defineQueryPrefetch('users', ({ route }) =>
 *   prefetchTable({ route, schema: usersTableSchema() }),
 * )
 * ```
 */
export function prefetchTable<const TSchema extends { source: object }>(params: {
  route: Pick<QueryPrefetchRuntimeRoute, 'query'>
  schema: TSchema
}) {
  if (!isTableSchemaView(params.schema)) {
    throw new Error('Invalid table schema: expected a source query definition')
  }

  const { schema } = params
  const contextQueries = resolveContextQueries(schema)

  return defineQueryPrefetchPlan()
    .stage(contextQueries)
    .stage((stageContext) => {
      const context = resolveContextData(schema, stageContext)
      const request = resolvePrefetchRequest({
        context,
        route: params.route,
        schema,
      })

      return resolveTableQueries({ request, schema })
    })
    .stage((stageContext) => {
      const rows = resolvePrefetchedRows(stageContext.source)
      const context = resolveContextData(schema, stageContext)

      return Object.fromEntries(
        (schema.pageContext ?? [])
          .filter((item) => item.condition?.() ?? true)
          .map((item) => [
            item.key,
            withQueryDefaults(item.query({ context, rows }), QUERY_DEFAULTS.staleTime.context),
          ]),
      )
    })
}

function isTableSchemaView<TValue>(value: TValue): value is TValue & TableSchemaView {
  if (!isObject(value) || !('source' in value)) {
    return false
  }

  return isObject(value.source) && isFunction(value.source.query)
}

function resolveContextQueries(schema: TableSchemaView): QueryPrefetchQueries {
  // SAFETY: every entry key comes from the schema's declared context items and values are query results.
  return Object.fromEntries(
    (schema.context ?? [])
      .filter((item) => item.condition?.() ?? true)
      .map((item) => [item.key, withQueryDefaults(item.query(), QUERY_DEFAULTS.staleTime.context)]),
  )
}

function resolveContextData(
  schema: TableSchemaView,
  stageContext: Readonly<TablePrefetchContext>,
): TablePrefetchContext {
  // SAFETY: each key is declared by schema.context and values come from the staged query context.
  return Object.fromEntries(
    (schema.context ?? []).map((item) => [item.key, stageContext[item.key]]),
  ) as TablePrefetchContext
}

function resolveTableQueries(options: {
  schema: TableSchemaView
  request: TableSourceRequestContext<GenericObject, TablePrefetchContext, string>
}): QueryPrefetchQueries {
  const entries: (readonly [string, QueryPrefetchOption])[] = [
    [
      'source',
      withQueryDefaults(resolveSourcePrefetchQuery(options), QUERY_DEFAULTS.staleTime.data),
    ],
  ]
  const definitions = options.schema.filters?.ui ?? []
  const globalFacets = resolveTableGlobalFacetDescriptors(definitions)
  const remoteFacets = options.schema.source.mode === 'remote' ? options.schema.source.facets : null

  if (isRemoteFacetResolver(remoteFacets) && globalFacets.length) {
    entries.push([
      'facets',
      withQueryDefaults(
        remoteFacets({
          context: options.request.context,
          facets: globalFacets,
          filters: options.request.filters,
          search: options.request.search,
        }),
        QUERY_DEFAULTS.staleTime.filterOptions,
      ),
    ])
  }

  for (const definition of definitions) {
    if (definition.kind === 'option' && isOptionQueryResolver(definition.source?.query)) {
      entries.push([
        `filter-options:${definition.key}`,
        withQueryDefaults(
          definition.source.query({ cursor: undefined, limit: undefined, search: undefined }),
          QUERY_DEFAULTS.staleTime.filterOptions,
        ),
      ])
    }

    const facet =
      definition.kind === 'option' || definition.kind === 'boolean'
        ? definition.source?.facet
        : undefined
    if (!hasPerFilterFacetQuery(facet)) {
      continue
    }

    entries.push([
      `filter-facets:${definition.key}`,
      withQueryDefaults(
        facet.query({
          facets: [
            {
              cursor: undefined,
              key: definition.key,
              limit: resolveFacetLimit(facet),
              mode: resolveTableFacetMode(facet),
            },
          ],
          table: {
            context: options.request.context,
            filters: options.request.filters,
            search: options.request.search,
          },
        }),
        QUERY_DEFAULTS.staleTime.filterOptions,
      ),
    ])
  }

  return Object.fromEntries(entries)
}

function resolveSourcePrefetchQuery(options: {
  schema: TableSchemaView
  request: TableSourceRequestContext<GenericObject, TablePrefetchContext, string>
}) {
  const definition =
    options.schema.source.mode === 'remote'
      ? options.schema.source.query(toTableRemoteSourceRequest(options.request), options.request.context)
      : options.schema.source.query(options.request)
  if (options.request.pagination.mode !== 'cursor' || !definition.queryFn) return definition

  const queryFn = definition.queryFn
  return {
    ...definition,
    queryFn: async (queryContext) => ({
      pageParams: [null],
      pages: [
        await queryFn({
          ...queryContext,
          direction: 'forward',
          pageParam: null,
        }),
      ],
    }),
    queryKey: createTableCursorQueryKey(definition.queryKey, 0),
  } satisfies import('../types').TableQueryDefinition<
    InfiniteData<TablePrefetchSourceResult, string | null>
  >
}

function resolvePrefetchRequest(options: {
  route: Pick<QueryPrefetchRuntimeRoute, 'query'>
  schema: TableSchemaView
  context: TablePrefetchContext
}): TableSourceRequestContext<GenericObject, TablePrefetchContext, string> {
  const layout = resolveLayout(options.route, options.schema)
  const filters = resolveFilterState(options.route, options.schema)
  const globalFacets = resolveTableGlobalFacetDescriptors(options.schema.filters?.ui ?? [])

  return {
    context: options.context,
    facets:
      options.schema.source.mode === 'remote' &&
      options.schema.source.facets === true &&
      globalFacets.length
        ? globalFacets
        : undefined,
    filters: createResolvedFilterState({
      context: options.context,
      definitions: options.schema.filters?.ui ?? [],
      filters,
      staticFilters: options.schema.filters?.static,
    }),
    pagination: resolvePagination(options.route, options.schema, layout),
    search: {
      fields: options.schema.filters?.search?.fields ?? [],
      value: filters.search,
    },
    sorting: resolveSorting(options.route, options.schema, layout),
  }
}

function resolveLayout(
  route: Pick<QueryPrefetchRuntimeRoute, 'query'>,
  schema: TableSchemaView,
): TableLayout {
  const value = queryValue(route, 'l')
  return value === 'grid' || value === 'table' ? value : (schema.defaultLayout ?? 'table')
}

function resolvePagination(
  route: Pick<QueryPrefetchRuntimeRoute, 'query'>,
  schema: TableSchemaView,
  layout: TableLayout,
): TablePaginationState {
  const mode = getPaginationMode(schema)
  if (mode === 'none') {
    return { mode: 'none' }
  }

  const defaultPageSize = getDefaultPageSize({ layout, schema })
  const pageSize = positiveInteger(queryValue(route, 'p.size')) ?? defaultPageSize
  if (mode === 'cursor') {
    return {
      count:
        schema.pagination && isObject(schema.pagination) && schema.pagination.mode === 'cursor'
          ? (schema.pagination.count ?? 'none')
          : 'none',
      cursor: null,
      mode: 'cursor',
      pageSize,
    }
  }

  return {
    count: 'exact',
    mode: 'offset',
    pageIndex: positiveInteger(queryValue(route, 'p.page')) ?? 1,
    pageSize,
  }
}

function resolveSorting(
  route: Pick<QueryPrefetchRuntimeRoute, 'query'>,
  schema: TableSchemaView,
  layout: TableLayout,
): TableSortingRule<string>[] {
  const defaultSort = getDefaultSort({ layout, schema })
  const key = queryValue(route, 's.key') ?? defaultSort?.key
  if (!key) {
    return []
  }

  const direction = queryValue(route, 's.dir')
  return [{ dir: direction === 'desc' ? 'desc' : (defaultSort?.dir ?? 'asc'), key }]
}

function resolveFilterState(
  route: Pick<QueryPrefetchRuntimeRoute, 'query'>,
  schema: TableSchemaView,
): TableFilterState<string> {
  const definitions = schema.filters?.ui ?? []
  const entries = new Map<string, unknown>()

  for (const filter of definitions) {
    const definition = normalizeFilterDefinition(filter)
    const defaultOperator = resolveFilterDefaultOperator(definition)
    for (const operator of resolveFilterSupportedOperators(definition)) {
      const urlKey = operator === defaultOperator ? definition.key : `${definition.key}~${operator}`
      const raw = queryValue(route, `f.ui.${urlKey}`)
      if (isNullish(raw) || raw === '') {
        continue
      }
      entries.set(urlKey, createTableFilterValueCodec(definition).parse(raw))
    }
  }

  return {
    search: queryValue(route, 'f.search') ?? '',
    ui: parseTableFilterQueryState({ definitions, entries }),
  }
}

function queryValue(route: Pick<QueryPrefetchRuntimeRoute, 'query'>, key: string) {
  const value = route.query[key]
  const resolved = isArray(value) ? value[0] : value
  return isString(resolved) ? resolved : undefined
}

function positiveInteger(value: string | undefined) {
  if (!value) {
    return
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function withQueryDefaults<TQuery extends QueryPrefetchOption>(
  query: TQuery,
  staleTime: number,
): TQuery & Required<QueryWithDefaults> {
  return {
    ...query,
    refetchOnWindowFocus:
      isQueryWithDefaults(query) && isBoolean(query.refetchOnWindowFocus)
        ? query.refetchOnWindowFocus
        : QUERY_DEFAULTS.refetchOnWindowFocus,
    staleTime:
      isQueryWithDefaults(query) && isNumber(query.staleTime) ? query.staleTime : staleTime,
  }
}

function isQueryWithDefaults(
  value: QueryPrefetchOption,
): value is QueryPrefetchOption & QueryWithDefaults {
  return isObject(value)
}

function isRemoteFacetResolver(
  value: RemoteFacetResolver | true | null | undefined,
): value is RemoteFacetResolver {
  return isFunction(value)
}

function isOptionQueryResolver(
  value: OptionQueryResolver | undefined,
): value is OptionQueryResolver {
  return isFunction(value)
}

function resolveFacetLimit(facet: TableFilterFacetConfig) {
  return facet.limit
}

function resolvePrefetchedRows<TValue>(value: TValue): GenericObject[] {
  if (isArray(value)) {
    return value.filter(isGenericObject)
  }
  if (!isObject(value)) {
    return []
  }

  const pages = 'pages' in value ? value.pages : undefined
  if (isArray(pages)) return pages.flatMap((page) => resolvePrefetchedRows(page))

  const rows = 'rows' in value ? value.rows : undefined
  return isArray(rows) ? rows.filter(isGenericObject) : []
}

function isGenericObject<TValue>(value: TValue): value is TValue & GenericObject {
  return isObject(value)
}
