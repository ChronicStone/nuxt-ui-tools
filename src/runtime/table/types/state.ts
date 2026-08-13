import type { GenericObject } from './utils'

export interface TableExternalState<TRow = GenericObject> {
  rows: TRow[]
  rowCount: number | null
}
