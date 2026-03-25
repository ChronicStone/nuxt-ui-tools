import { resolveSpreadsheetColumns } from '../utils/builders'
import type {
  BuildSpreadsheetSchema,
  SpreadsheetContextDataFromItems,
  SpreadsheetContextItem,
  SpreadsheetPipelineDefinition,
  SpreadsheetResolvedColumns,
  SpreadsheetRowData,
} from '../types'
import type { SpreadsheetColumnsDefinition } from '../types'

export function defineSpreadsheetSchema<
  const TContextItems extends readonly SpreadsheetContextItem<string, unknown>[] = readonly [],
  const TColumns extends SpreadsheetColumnsDefinition<SpreadsheetContextDataFromItems<TContextItems>> = SpreadsheetColumnsDefinition<
    SpreadsheetContextDataFromItems<TContextItems>
  >,
  const TReferences extends readonly unknown[] = readonly [],
  const TPipeline extends SpreadsheetPipelineDefinition<
    SpreadsheetContextDataFromItems<TContextItems>,
    SpreadsheetRowData<SpreadsheetResolvedColumns<TColumns>, TReferences>
  > | undefined = SpreadsheetPipelineDefinition<
    SpreadsheetContextDataFromItems<TContextItems>,
    SpreadsheetRowData<SpreadsheetResolvedColumns<TColumns>, TReferences>
  > | undefined,
  const TExtra extends { importKey: string } = { importKey: string },
>(
  schema: BuildSpreadsheetSchema<TContextItems, TColumns, TReferences, TPipeline, TExtra>,
) {
  if (!schema.columns) return { ...schema }

  return {
    ...schema,
    columns: resolveSpreadsheetColumns(schema.columns),
  }
}

export * from './normalize'
