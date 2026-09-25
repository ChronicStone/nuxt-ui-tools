import type { HTMLAttributes, StyleValue } from 'vue'

import type { DataListColumnMeta } from '../../utils/columns/types'

/** One position in the rendered column window: a column, a spacer for virtualized columns, or the filler. */
export type TableColumnSlot =
  | { kind: 'column'; columnId: string; key: string }
  | { kind: 'spacer'; colSpan: number; key: string }
  | { kind: 'fill'; key: string }

/** Cell classes, styles and renderer of one column, computed once per layout change for every row. */
export function columnCellLayout(params: {
  meta?: DataListColumnMeta
  pinned: false | 'start' | 'end'
  lastStart: boolean
  firstEnd: boolean
  offset: StyleValue
  tdClass: HTMLAttributes['class']
}) {
  const { meta } = params
  return {
    class: [
      params.pinned === 'start' ? 'nut-dl-pin nut-dl-pin--start z-[2]' : '',
      params.pinned === 'end' ? 'nut-dl-pin nut-dl-pin--end z-[2]' : '',
      params.lastStart ? 'nut-dl-pin--last-start' : '',
      params.firstEnd ? 'nut-dl-pin--first-end' : '',
      meta?.align === 'right' ? 'text-right' : meta?.align === 'center' ? 'text-center' : '',
      meta?.internal ? `nut-dl-td--${meta.internal}` : '',
      meta?.ellipsis ? 'nut-dl-td--ellipsis' : '',
      params.tdClass,
    ],
    innerClass:
      meta?.align === 'right' ? 'justify-end' : meta?.align === 'center' ? 'justify-center' : '',
    render: meta?.render,
    style: [params.offset, meta?.lines ? { '--nut-dl-lines': meta.lines } : undefined],
  }
}

/** The column window with each column's cell layout attached, shared by every rendered row. */
export function tableRowCells(params: {
  slots: TableColumnSlot[]
  layouts: Map<string, ReturnType<typeof columnCellLayout>>
}) {
  return params.slots.map((slot) =>
    slot.kind === 'column' ? { ...slot, layout: params.layouts.get(slot.columnId) } : slot,
  )
}
