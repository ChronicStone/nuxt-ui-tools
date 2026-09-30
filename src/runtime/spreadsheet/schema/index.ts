import type {
  SpreadsheetLookupResult,
  SpreadsheetPrettify,
  SpreadsheetRowKey,
  SpreadsheetSchema,
  SpreadsheetSchemaDefinition,
} from '../types'

export { createSpreadsheetColumnsBuilder } from './builder'

type SpreadsheetSchemaFactory<TContext> = <
  TRow,
  const TKeyValue extends SpreadsheetRowKey = never,
  TLookup extends SpreadsheetLookupResult = never,
  TOutput = SpreadsheetPrettify<TRow>,
>(
  definition: SpreadsheetSchemaDefinition<TContext, TRow, TKeyValue, TLookup, TOutput>,
) => SpreadsheetSchema<TContext, TRow, TKeyValue, TLookup, TOutput>

/**
 * Declares an import: its columns, how their values match, the rules, row identity, and output.
 * Pass the context type first when the columns depend on data the page provides; every callback
 * then receives it as `ctx`. Columns are chained, and each column's callbacks read the columns
 * declared above it as `row`.
 *
 * @example
 * ```ts
 * const assessmentsImport = defineSpreadsheetSchema<{ center: TestCenter; products: Product[] }>()({
 *   key: 'assessments',
 *   columns: (c) =>
 *     c
 *       .text('secureCode', { label: 'Secure code', required: true })
 *       .select('productId', { options: ({ ctx }) => ctx.products.map(toOption), required: true })
 *       .select('level', { options: ({ row, ctx }) => scaleOf(ctx, row.productId) }),
 *   rows: { key: (row) => row.secureCode, existing: { lookup: ({ keys }) => assessmentsQuery(keys) } },
 * })
 * ```
 */
export function defineSpreadsheetSchema<TContext>(): SpreadsheetSchemaFactory<TContext>
export function defineSpreadsheetSchema<
  TRow,
  const TKeyValue extends SpreadsheetRowKey = never,
  TLookup extends SpreadsheetLookupResult = never,
  TOutput = SpreadsheetPrettify<TRow>,
>(
  definition: SpreadsheetSchemaDefinition<NonNullable<unknown>, TRow, TKeyValue, TLookup, TOutput>,
): SpreadsheetSchema<NonNullable<unknown>, TRow, TKeyValue, TLookup, TOutput>
// The overloads carry the types; the implementation only returns the definition it receives.
export function defineSpreadsheetSchema(definition?: unknown): unknown {
  if (definition) return definition
  return (next: unknown) => next
}
