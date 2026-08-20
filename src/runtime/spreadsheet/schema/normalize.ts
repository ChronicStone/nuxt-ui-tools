import type {
  SpreadsheetColumnDefinition,
  SpreadsheetColumnResolveDefinition,
  SpreadsheetColumnGroupDefinition,
  NormalizeSpreadsheetSchema,
  SpreadsheetResolutionDefinition,
  SpreadsheetColumnsDefinition,
  SpreadsheetContextItem,
  SpreadsheetDynamicBuilder,
  SpreadsheetReferenceDefinition,
  SpreadsheetRecord,
  SpreadsheetValue,
} from '../types'
import { isSpreadsheetRecord } from '../utils/object'
import {
  resolveSpreadsheetColumns,
  resolveSpreadsheetReferences,
  createSpreadsheetDynamicBuilder,
} from '../utils/builders'

function isSpreadsheetColumnGroupDefinition(
  value: SpreadsheetValue,
): value is SpreadsheetColumnGroupDefinition<string, readonly unknown[]> {
  return (
    isSpreadsheetRecord(value) &&
    'kind' in value &&
    value.kind === 'group' &&
    'columns' in value
  )
}

function isSpreadsheetResolvableColumnDefinition(
  value: SpreadsheetValue,
): value is SpreadsheetColumnDefinition<
  string,
  unknown,
  boolean,
  SpreadsheetRecord,
  undefined,
  unknown,
  SpreadsheetColumnResolveDefinition<SpreadsheetRecord, unknown>
> {
  return (
    isSpreadsheetRecord(value) &&
    'kind' in value &&
    value.kind !== 'group' &&
    'key' in value &&
    'resolve' in value &&
    Boolean(value.resolve)
  )
}

function isSpreadsheetReferenceDefinition(value: SpreadsheetValue): value is SpreadsheetReferenceDefinition {
  return (
    isSpreadsheetRecord(value) &&
    'kind' in value &&
    value.kind === 'select' &&
    'field' in value &&
    'source' in value
  )
}

function collectSpreadsheetResolutionColumns(
  entries: readonly unknown[],
): SpreadsheetColumnDefinition<
  string,
  unknown,
  boolean,
  SpreadsheetRecord,
  undefined,
  unknown,
  SpreadsheetColumnResolveDefinition<SpreadsheetRecord, unknown>
>[] {
  const resolvedColumns: SpreadsheetColumnDefinition<
    string,
    unknown,
    boolean,
    SpreadsheetRecord,
    undefined,
    unknown,
    SpreadsheetColumnResolveDefinition<SpreadsheetRecord, unknown>
  >[] = []

  for (const entry of entries) {
    if (isSpreadsheetColumnGroupDefinition(entry)) {
      resolvedColumns.push(...collectSpreadsheetResolutionColumns(entry.columns))
      continue
    }

    if (isSpreadsheetResolvableColumnDefinition(entry)) resolvedColumns.push(entry)
  }

  return resolvedColumns
}

function normalizeSpreadsheetResolutionDefinitions(params: {
  columns: readonly unknown[]
  references: readonly unknown[]
}): readonly SpreadsheetResolutionDefinition[] {
  const columnResolutions = collectSpreadsheetResolutionColumns(
    params.columns,
  ).flatMap<SpreadsheetResolutionDefinition>((column) => {
    if (!column.resolve) return []

    return [
      {
        kind: 'select',
        scope: 'column',
        targetField: column.key,
        sourceField: column.key,
        options: column.resolve.options,
        getOptions: column.resolve.getOptions,
        rules: column.rules,
      },
    ]
  })

  const referenceResolutions: SpreadsheetResolutionDefinition[] = []

  for (const entry of params.references) {
    if (!isSpreadsheetReferenceDefinition(entry)) continue

    referenceResolutions.push({
      kind: 'select',
      scope: 'reference',
      targetField: entry.field,
      sourceField: entry.source,
      options: entry.options,
      getOptions: entry.getOptions,
      rules: entry.rules,
    })
  }

  return [...columnResolutions, ...referenceResolutions]
}

export function resolveSpreadsheetDynamicColumns<TContext, TResult extends readonly unknown[]>(
  columns: {
    dynamic: (params: {
      dynamic: SpreadsheetDynamicBuilder<TContext>
      context: TContext
    }) => TResult
  },
  context: TContext,
): TResult
export function resolveSpreadsheetDynamicColumns<TContext>(
  columns: {
    dynamic?:
      | ((params: { dynamic: SpreadsheetDynamicBuilder; context: TContext }) => readonly unknown[])
      | undefined
  },
  context: TContext,
): readonly []
export function resolveSpreadsheetDynamicColumns<TContext>(
  columns: {
    dynamic?:
      | ((params: {
          dynamic: SpreadsheetDynamicBuilder<TContext>
          context: TContext
        }) => readonly unknown[])
      | undefined
  },
  context: TContext,
) {
  if (!columns?.dynamic) return []

  return columns.dynamic({
    context,
    dynamic: createSpreadsheetDynamicBuilder(context),
  })
}

export function resolveSpreadsheetBuildRow<TBuildRow>(buildRow: TBuildRow): TBuildRow
export function resolveSpreadsheetBuildRow(buildRow: undefined): undefined
export function resolveSpreadsheetBuildRow<TBuildRow>(buildRow: TBuildRow | undefined) {
  return buildRow
}

export function normalizeSpreadsheetSchema<
  TSchema extends {
    importKey: string
    file?: unknown
    sheet?: unknown
    header?: unknown
    matching?: unknown
    review?: unknown
    steps?: unknown
    context?: readonly SpreadsheetContextItem<string, unknown>[]
    columns?: SpreadsheetColumnsDefinition<any>
    references?: unknown
    relations?: readonly unknown[]
    buildRow?: unknown
  },
>(schema: TSchema) {
  const resolvedColumns = resolveSpreadsheetColumns(schema.columns)
  const resolvedReferences = resolveSpreadsheetReferences(schema.references)
  const staticColumns = resolvedColumns?.static ?? []
  const references = Array.isArray(resolvedReferences) ? resolvedReferences : []
  const steps = normalizeSpreadsheetSteps(schema)

  return {
    ...schema,
    sheet: steps.structure?.sheet,
    header: steps.structure?.header,
    matching: steps.matching,
    review: steps.review,
    steps,
    context: schema.context ?? [],
    columns: {
      static: staticColumns,
      dynamic: resolvedColumns?.dynamic ?? (() => []),
    },
    references,
    resolutions: normalizeSpreadsheetResolutionDefinitions({
      columns: staticColumns,
      references,
    }),
    relations: schema.relations ?? [],
    buildRow: resolveSpreadsheetBuildRow(schema.buildRow),
  }
}
export type { NormalizeSpreadsheetSchema }

function normalizeSpreadsheetSteps(schema: {
  sheet?: unknown
  header?: unknown
  matching?: unknown
  review?: unknown
  steps?: unknown
}) {
  const steps = toRecord(schema.steps)
  const structure = toRecord(steps.structure)

  return {
    upload: toRecord(steps.upload),
    structure: {
      ...structure,
      sheet: {
        ...toRecord(schema.sheet),
        ...toRecord(structure.sheet),
      },
      header: {
        ...toRecord(schema.header),
        ...toRecord(structure.header),
      },
    },
    matching: {
      ...toRecord(schema.matching),
      ...toRecord(steps.matching),
    },
    references: toRecord(steps.references),
    review: {
      ...toRecord(schema.review),
      ...toRecord(steps.review),
    },
  }
}

function toRecord(value: SpreadsheetValue): SpreadsheetRecord {
  return isRecord(value) ? value : {}
}

function isRecord<T>(value: T): value is T & SpreadsheetRecord {
  return isSpreadsheetRecord(value)
}
