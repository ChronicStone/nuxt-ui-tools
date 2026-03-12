import type { AnyTableInstance } from '../types/api'

export interface TableDebugSnapshot {
  state: AnyTableInstance['state']
  meta: AnyTableInstance['meta']
}

export function createTableDebugSnapshot(table: AnyTableInstance): TableDebugSnapshot {
  return {
    state: table.state,
    meta: table.meta,
  }
}
