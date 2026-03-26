import {
  createSpreadsheetDynamicBuilder,
  resolveSpreadsheetColumns,
  resolveSpreadsheetReferences,
} from '../utils/builders'
import type {
  NormalizeSpreadsheetSchema,
  SpreadsheetColumnsDefinition,
  SpreadsheetContextItem,
  SpreadsheetDynamicBuilder,
} from '../types'

export function resolveSpreadsheetDynamicColumns<
  TContext,
  TResult extends readonly unknown[],
>(columns: {
  dynamic: (params: {
    dynamic: SpreadsheetDynamicBuilder<TContext>
    context: TContext
  }) => TResult
}, context: TContext): TResult
export function resolveSpreadsheetDynamicColumns<TContext>(
  columns: {
    dynamic?: ((params: {
      dynamic: SpreadsheetDynamicBuilder
      context: TContext
    }) => readonly unknown[]) | undefined
  },
  context: TContext,
): readonly []
export function resolveSpreadsheetDynamicColumns<TContext>(
  columns: {
    dynamic?: ((params: {
      dynamic: SpreadsheetDynamicBuilder<TContext>
      context: TContext
    }) => readonly unknown[]) | undefined
  },
  context: TContext,
) {
  if (!columns?.dynamic) return []

  return columns.dynamic({
    context,
    dynamic: createSpreadsheetDynamicBuilder(context),
  })
}

export function resolveSpreadsheetBuildRow<TBuildRow>(
  buildRow: TBuildRow,
): TBuildRow
export function resolveSpreadsheetBuildRow(buildRow: undefined): undefined
export function resolveSpreadsheetBuildRow<TBuildRow>(buildRow: TBuildRow | undefined) {
  return buildRow
}

export function normalizeSpreadsheetSchema<
  TSchema extends {
    importKey: string
    file?: unknown
    context?: readonly SpreadsheetContextItem<string, unknown>[]
    columns?: SpreadsheetColumnsDefinition<any>
    references?: unknown
    buildRow?: unknown
  },
>(schema: TSchema) {
  const resolvedColumns = resolveSpreadsheetColumns(schema.columns)
  const resolvedReferences = resolveSpreadsheetReferences(schema.references)

  return {
    ...schema,
    context: schema.context ?? [],
    columns: {
      static: resolvedColumns?.static ?? [],
      dynamic: resolvedColumns?.dynamic ?? (() => []),
    },
    references: Array.isArray(resolvedReferences) ? resolvedReferences : [],
    buildRow: resolveSpreadsheetBuildRow(schema.buildRow),
  }
}

export type {
  NormalizeSpreadsheetSchema,
}
