<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { twMerge } from 'tailwind-merge'
import { computed } from 'vue'

import { useDisplayAppUi } from '../../composables/use-display-config'
import { vRevealTruncated } from '../../directives/reveal-truncated'
import type {
  DisplayFact,
  DisplayFactsLayout,
  DisplayFactsProps,
  DisplayFactsSlot,
} from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty } from '../../utils/content'
import {
  DISPLAY_SURFACE_CLASSES,
  DISPLAY_SURFACE_PADDING,
  displayToneClass,
} from '../../utils/tone'
import DisplayActions from '../parts/display-actions.vue'
import DisplayEmptyLine from '../parts/display-empty-line.vue'
import DisplayFactValue from '../parts/display-fact-value.vue'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  layout = 'ledger',
  surface = undefined,
  items = undefined,
  groups = undefined,
  columns = undefined,
  labelWidth = '8rem',
  empty = undefined,
  actions = undefined,
  loading = false,
  ui = undefined,
} = defineProps<DisplayFactsProps>()

const CAPTION = 'text-[11px] font-bold tracking-[0.07em] text-muted uppercase'
const LABEL_CLASSES = {
  columns: 'flex min-w-0 items-center gap-1.5 text-muted',
  grid: `flex min-w-0 items-center gap-1.5 ${CAPTION}`,
  inline: 'inline-flex items-center gap-1.5 text-muted',
  ledger: 'flex min-w-0 items-center gap-1.5 text-muted',
  tiles: `flex min-w-0 items-center gap-1.5 ${CAPTION}`,
} as const satisfies Record<DisplayFactsLayout, string>
const VALUE_CLASSES = {
  columns:
    'flex min-w-0 flex-wrap items-center gap-1.5 font-medium text-default [overflow-wrap:anywhere]',
  grid: 'flex min-h-5 min-w-0 flex-wrap items-center gap-1.5 font-semibold text-highlighted [overflow-wrap:anywhere]',
  inline: 'inline-flex items-center gap-1 font-bold text-highlighted tabular-nums',
  ledger:
    'ms-auto flex min-w-0 flex-wrap items-center justify-end gap-1.5 text-end font-semibold text-highlighted tabular-nums [overflow-wrap:anywhere]',
  tiles:
    'flex min-w-0 flex-wrap items-center gap-1.5 text-lg font-extrabold text-highlighted tabular-nums',
} as const satisfies Record<DisplayFactsLayout, string>
const ITEM_CLASSES = {
  columns: 'contents',
  grid: 'flex min-w-0 flex-col gap-1',
  inline: 'inline-flex min-w-0 items-baseline gap-1.5',
  ledger:
    'flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-muted py-2.5 first:border-t-0',
  tiles: 'flex min-w-0 flex-col gap-1 rounded-[var(--nut-display-radius)] bg-elevated px-3 py-2.5',
} as const satisfies Record<DisplayFactsLayout, string>
const GROUP_CLASSES = {
  columns: 'grid min-w-0 gap-x-4 gap-y-2.5 text-sm',
  grid: 'grid min-w-0 gap-x-5 gap-y-4 text-sm',
  inline: 'flex min-w-0 flex-wrap gap-x-4.5 gap-y-1.5 text-sm',
  ledger: '',
  tiles: 'grid min-w-0 gap-2 text-sm',
} as const satisfies Record<DisplayFactsLayout, string>

const appUi = useDisplayAppUi('facts')
const resolvedSurface = computed(() => surface ?? (layout === 'ledger' ? 'bordered' : 'plain'))
const resolvedGroups = computed(() => groups ?? [{ items: items ?? [] }])
const count = computed(() =>
  resolvedGroups.value.reduce((total, group) => total + group.items.length, 0),
)
const boxed = computed(() => resolvedSurface.value !== 'plain')
const groupStyle = computed(() => {
  if (layout === 'columns') return { gridTemplateColumns: `${labelWidth} minmax(0, 1fr)` }
  if (layout !== 'grid' && layout !== 'tiles') return undefined
  return {
    gridTemplateColumns: columns
      ? `repeat(${columns}, minmax(0, 1fr))`
      : `repeat(auto-fill, minmax(${layout === 'grid' ? '9rem' : '8rem'}, 1fr))`,
  }
})
const classes = computed(() =>
  resolveDisplayClasses<DisplayFactsSlot>(
    {
      actions: 'mt-2.5 flex flex-wrap gap-2',
      empty: '',
      group: GROUP_CLASSES[layout],
      groupAside: 'text-xs font-medium text-toned normal-case tracking-normal',
      groupHeader:
        layout === 'ledger'
          ? `flex items-baseline justify-between gap-3 border-t border-default py-1.5 first:border-t-0 ${boxed.value ? 'bg-elevated' : ''} ${CAPTION}`
          : `mb-2 flex items-baseline justify-between gap-3 ${CAPTION}`,
      groupTitle: '',
      hint: layout === 'ledger' ? 'text-xs text-dimmed' : 'text-xs text-muted',
      item: ITEM_CLASSES[layout],
      label: LABEL_CLASSES[layout],
      root:
        layout === 'ledger'
          ? `flex min-w-0 flex-col overflow-hidden text-sm ${DISPLAY_SURFACE_CLASSES[resolvedSurface.value]} ${boxed.value ? '[&>*]:px-4' : ''}`
          : `flex min-w-0 flex-col gap-4 ${DISPLAY_SURFACE_CLASSES[resolvedSurface.value]} ${DISPLAY_SURFACE_PADDING[resolvedSurface.value]}`,
      value: VALUE_CLASSES[layout],
    },
    appUi.value,
    ui,
  ),
)

function valueClass(fact: DisplayFact) {
  return twMerge(
    classes.value.value,
    fact.tone ? `${displayToneClass(fact.tone)} text-[var(--nut-tone-ink)]` : '',
    fact.emphasis ? 'text-lg font-extrabold' : '',
    fact.mono ? 'font-mono text-[13px] font-medium' : '',
  )
}
</script>

<template>
  <DisplaySkeleton
    v-if="loading"
    :layout="layout === 'ledger' ? 'rows' : layout === 'tiles' ? 'tiles' : 'lines'"
    :count="Math.min(Math.max(count, 2), 5)"
  />
  <DisplayEmptyLine v-else-if="!count" :content="empty" :class="classes.empty" />
  <div
    v-else-if="layout === 'ledger'"
    :class="classes.root"
    data-display="facts"
    data-layout="ledger"
  >
    <template v-for="(group, groupIndex) in resolvedGroups" :key="groupIndex">
      <div v-if="!isDisplayContentEmpty(group.title)" :class="classes.groupHeader">
        <span v-reveal-truncated :class="classes.groupTitle"
          ><DisplayRender :content="group.title"
        /></span>
        <span
          v-if="!isDisplayContentEmpty(group.aside)"
          v-reveal-truncated
          :class="classes.groupAside"
        >
          <DisplayRender :content="group.aside" />
        </span>
      </div>
      <div v-for="(fact, index) in group.items" :key="index" :class="classes.item">
        <div class="flex min-w-0 flex-col gap-px">
          <span v-reveal-truncated :class="classes.label">
            <UIcon v-if="fact.icon" :name="fact.icon" class="size-3.5 shrink-0" />
            <DisplayRender :content="fact.label" />
          </span>
          <span v-if="!isDisplayContentEmpty(fact.hint)" v-reveal-truncated :class="classes.hint">
            <DisplayRender :content="fact.hint" />
          </span>
        </div>
        <div v-reveal-truncated :class="valueClass(fact)" data-display-value>
          <DisplayFactValue :fact="fact" />
        </div>
      </div>
    </template>
  </div>
  <div v-else :class="classes.root" data-display="facts" :data-layout="layout">
    <div v-for="(group, groupIndex) in resolvedGroups" :key="groupIndex">
      <div v-if="!isDisplayContentEmpty(group.title)" :class="classes.groupHeader">
        <span v-reveal-truncated :class="classes.groupTitle"
          ><DisplayRender :content="group.title"
        /></span>
        <span
          v-if="!isDisplayContentEmpty(group.aside)"
          v-reveal-truncated
          :class="classes.groupAside"
        >
          <DisplayRender :content="group.aside" />
        </span>
      </div>
      <dl :class="['m-0', classes.group]" :style="groupStyle">
        <div v-for="(fact, index) in group.items" :key="index" :class="classes.item">
          <dt v-reveal-truncated :class="classes.label">
            <UIcon v-if="fact.icon" :name="fact.icon" class="size-3.5 shrink-0" />
            <DisplayRender :content="fact.label" />
          </dt>
          <dd v-reveal-truncated :class="['m-0', valueClass(fact)]" data-display-value>
            <DisplayFactValue :fact="fact" />
          </dd>
          <dd
            v-if="layout !== 'inline' && !isDisplayContentEmpty(fact.hint)"
            :class="['m-0', classes.hint, layout === 'columns' ? 'col-start-2 -mt-2' : '']"
          >
            <DisplayRender :content="fact.hint" />
          </dd>
        </div>
      </dl>
    </div>
  </div>
  <DisplayActions
    v-if="!loading && actions?.length"
    :actions="actions"
    :class="classes.actions"
    data-display-actions
  />
</template>
