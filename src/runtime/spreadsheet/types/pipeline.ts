import type { MaybePromise } from '../../shared/types/utils'

export interface SpreadsheetPipelineDefinition<
  TContext = unknown,
  TRow = unknown,
> {
  buildRow?: (params: {
    context: TContext
    row: TRow
  }) => MaybePromise<unknown>
}
