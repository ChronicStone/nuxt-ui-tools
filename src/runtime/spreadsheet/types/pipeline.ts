import type { MaybePromise } from '../../shared/types/utils'

export interface SpreadsheetPipelineDefinition<
  TContext = unknown,
  TRow = unknown,
> {
  submit?: (params: {
    context: TContext
    row: TRow
  }) => MaybePromise<unknown>
}
