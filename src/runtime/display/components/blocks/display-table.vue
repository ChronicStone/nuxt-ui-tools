<script setup lang="ts">
import { computed } from 'vue'

import { isNumber } from '../../../shared/utils/predicate'
import { useDisplayAppUi } from '../../composables/use-display-config'
import { useDisplayReveal } from '../../composables/use-display-reveal'
import { vRevealTruncated } from '../../directives/reveal-truncated'
import type { DisplayTableColumn, DisplayTableProps, DisplayTableSlot } from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty } from '../../utils/content'
import { DISPLAY_SURFACE_CLASSES } from '../../utils/tone'
import DisplayEmptyLine from '../parts/display-empty-line.vue'
import DisplayMore from '../parts/display-more.vue'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  columns,
  rows,
  footer = undefined,
  caption = undefined,
  note = undefined,
  maxHeight = undefined,
  surface = 'bordered',
  max = undefined,
  step = undefined,
  empty = undefined,
  loading = false,
  ui = undefined,
} = defineProps<DisplayTableProps>()

const ALIGN_CLASSES = { center: 'text-center', end: 'text-end', start: 'text-start' } as const

const appUi = useDisplayAppUi('table')
const reveal = useDisplayReveal({ items: () => rows, max: () => max, step: () => step })
const scrollerStyle = computed(() =>
  maxHeight === undefined
    ? undefined
    : { maxHeight: isNumber(maxHeight) ? `${maxHeight}px` : maxHeight },
)
const classes = computed(() =>
  resolveDisplayClasses<DisplayTableSlot>(
    {
      cell: 'px-3 py-2 align-middle text-default',
      empty: '',
      foot: '',
      footCell:
        'sticky bottom-0 border-t border-default bg-elevated px-3 py-2 font-bold text-highlighted',
      head: '',
      headCell:
        'sticky top-0 z-[1] border-b border-default bg-elevated px-3 py-2 text-[11px] font-bold tracking-[0.07em] whitespace-nowrap text-muted uppercase',
      meta: 'mt-1.5 flex justify-between gap-3 text-xs text-dimmed',
      more: 'mt-1 self-center',
      root: 'flex min-w-0 flex-col',
      row: 'border-t border-muted first:border-t-0',
      scroller: `min-w-0 overflow-auto ${DISPLAY_SURFACE_CLASSES[surface]}`,
      table: 'w-full border-collapse text-sm',
    },
    appUi.value,
    ui,
  ),
)

function alignClass(column: DisplayTableColumn) {
  return [
    ALIGN_CLASSES[column.align ?? (column.numeric ? 'end' : 'start')],
    column.numeric ? 'tabular-nums' : '',
    column.mono ? 'font-mono text-[13px]' : '',
  ]
}
</script>

<template>
  <DisplaySkeleton v-if="loading" layout="rows" :count="Math.min(Math.max(rows.length, 3), 6)" />
  <DisplayEmptyLine v-else-if="!rows.length" :content="empty" :class="classes.empty" />
  <div v-else :class="classes.root" data-display="table">
    <div :class="classes.scroller" :style="scrollerStyle">
      <table :class="classes.table">
        <thead :class="classes.head">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              v-reveal-truncated
              :class="[classes.headCell, ...alignClass(column)]"
              :style="column.width ? { width: column.width } : undefined"
            >
              <DisplayRender :content="column.label" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in reveal.visible.value" :key="index" :class="classes.row">
            <td
              v-for="column in columns"
              :key="column.key"
              v-reveal-truncated
              :class="[classes.cell, ...alignClass(column)]"
            >
              <DisplayRender :content="row[column.key]" />
            </td>
          </tr>
        </tbody>
        <tfoot v-if="footer" :class="classes.foot">
          <tr>
            <td
              v-for="column in columns"
              :key="column.key"
              :class="[classes.footCell, ...alignClass(column)]"
            >
              <DisplayRender :content="footer[column.key]" />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
    <DisplayMore
      v-if="reveal.hidden.value"
      :count="reveal.next.value"
      :class="classes.more"
      @reveal="reveal.reveal"
    />
    <div
      v-if="!isDisplayContentEmpty(caption) || !isDisplayContentEmpty(note)"
      v-reveal-truncated
      :class="classes.meta"
    >
      <span><DisplayRender :content="caption" /></span>
      <span><DisplayRender :content="note" /></span>
    </div>
  </div>
</template>
