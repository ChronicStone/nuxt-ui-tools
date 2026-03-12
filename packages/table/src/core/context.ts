import type {
  TableContextItem,
  TablePageContextItem,
} from '../types'

export interface TableContextStorePlaceholder {
  context: readonly TableContextItem[]
  pageContext: readonly TablePageContextItem[]
}

export function createTableContextStore(
  value: Partial<TableContextStorePlaceholder> = {},
): TableContextStorePlaceholder {
  return {
    context: value.context ?? [],
    pageContext: value.pageContext ?? [],
  }
}
