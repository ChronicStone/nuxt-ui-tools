import { createSpreadsheetDynamicBuilder, resolveSpreadsheetColumns } from '../utils/builders'
import type {
  NormalizeSpreadsheetSchema,
  SpreadsheetColumnsDefinition,
  SpreadsheetContextItem,
  SpreadsheetDynamicBuilder,
} from '../types'

export function resolveSpreadsheetPipeline<TPipeline>(pipeline: TPipeline): TPipeline
export function resolveSpreadsheetPipeline(pipeline: undefined): undefined
export function resolveSpreadsheetPipeline<TPipeline>(pipeline: TPipeline | undefined) {
  return pipeline
}

export function resolveSpreadsheetDynamicColumns<
  TContext,
  TResult extends readonly unknown[],
>(columns: {
  dynamic: (params: {
    dynamic: SpreadsheetDynamicBuilder
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
      dynamic: SpreadsheetDynamicBuilder
      context: TContext
    }) => readonly unknown[]) | undefined
  } | undefined,
  context: TContext,
) {
  if (!columns?.dynamic) return []

  return columns.dynamic({
    context,
    dynamic: createSpreadsheetDynamicBuilder(),
  })
}

export function normalizeSpreadsheetSchema<
  TSchema extends {
    importKey: string
    context?: readonly SpreadsheetContextItem<string, unknown>[]
    columns?: SpreadsheetColumnsDefinition<any>
    references?: readonly unknown[]
    pipeline?: unknown
  },
>(schema: TSchema) {
  const resolvedColumns = resolveSpreadsheetColumns(schema.columns)
  const dynamicColumns = resolvedColumns?.dynamic ?? (() => [])

  return {
    ...schema,
    context: schema.context ?? [],
    columns: {
      static: resolvedColumns?.static ?? [],
      dynamic: dynamicColumns,
    },
    references: schema.references ?? [],
    pipeline: resolveSpreadsheetPipeline(schema.pipeline),
  }
}

export type {
  NormalizeSpreadsheetSchema,
}
