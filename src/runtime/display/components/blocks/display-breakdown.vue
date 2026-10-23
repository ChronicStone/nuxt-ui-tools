<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { twMerge } from 'tailwind-merge'
import { computed, ref } from 'vue'

import { useDisplayAppUi } from '../../composables/use-display-config'
import { useDisplayIcons } from '../../composables/use-display-icons'
import { useDisplayLocale } from '../../composables/use-display-locale'
import { vRevealTruncated } from '../../directives/reveal-truncated'
import type { DisplayBreakdownLine, DisplayBreakdownProps, DisplayBreakdownSlot } from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty } from '../../utils/content'
import { DISPLAY_SURFACE_CLASSES, displayToneClass } from '../../utils/tone'
import DisplayChip from '../parts/display-chip.vue'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  mode = 'open',
  title = undefined,
  lines,
  total = undefined,
  columns = undefined,
  footnote = undefined,
  defaultOpen = false,
  surface = 'bordered',
  loading = false,
  ui = undefined,
} = defineProps<DisplayBreakdownProps>()

const { t } = useDisplayLocale()
const icons = useDisplayIcons()
const appUi = useDisplayAppUi('breakdown')
const open = ref<boolean>(defaultOpen)
const boxed = computed(() => surface !== 'plain')
const classes = computed(() =>
  resolveDisplayClasses<DisplayBreakdownSlot>(
    {
      body: 'mx-2 mb-2 rounded-[calc(var(--nut-display-radius)*0.75)] bg-elevated px-3 py-1',
      detail: 'ms-1.5 text-xs text-dimmed tabular-nums',
      footnote: 'mt-1.5 text-xs text-dimmed',
      header: 'bg-elevated',
      headerCell:
        'px-4 py-2 text-end text-[11px] font-bold tracking-[0.07em] text-muted uppercase first:text-start',
      label: 'min-w-0 text-toned',
      line: 'flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-1.5',
      root: `min-w-0 text-sm ${DISPLAY_SURFACE_CLASSES[surface]} ${boxed.value && mode === 'open' ? 'px-4 pt-1' : ''}`,
      title: 'pt-2 pb-1 text-[11px] font-bold tracking-[0.07em] text-muted uppercase',
      toggle: 'inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary',
      total:
        mode === 'collapsible'
          ? 'flex items-center gap-3 px-4 py-2.5'
          : 'mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-dashed border-accented py-2.5',
      totalLabel: 'flex items-center gap-2 font-bold text-highlighted',
      totalValue: 'text-lg font-extrabold whitespace-nowrap text-highlighted tabular-nums',
      value: 'ms-auto shrink-0 whitespace-nowrap text-default tabular-nums',
    },
    appUi.value,
    ui,
  ),
)

function lineClass(line: DisplayBreakdownLine) {
  return [
    classes.value.line,
    line.subtotal ? 'mt-1 border-t border-muted pt-2 font-semibold' : '',
    line.muted ? 'opacity-55' : '',
  ]
}

function valueClass(line: DisplayBreakdownLine) {
  return twMerge(
    classes.value.value,
    line.subtotal ? 'text-highlighted' : '',
    line.tone ? `${displayToneClass(line.tone)} text-[var(--nut-tone-ink)]` : '',
  )
}
</script>

<template>
  <DisplaySkeleton
    v-if="loading"
    layout="rows"
    :count="Math.min(Math.max(lines.length + 1, 3), 6)"
  />
  <div v-else data-display="breakdown" :data-mode="mode">
    <div v-if="mode === 'compare'" :class="[classes.root, 'overflow-hidden']">
      <table class="w-full border-collapse">
        <thead :class="classes.header">
          <tr>
            <th :class="classes.headerCell"><DisplayRender :content="title" /></th>
            <th v-for="(column, index) in columns ?? []" :key="index" :class="classes.headerCell">
              <DisplayRender :content="column" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(line, index) in lines" :key="index" class="border-t border-muted">
            <td :class="['px-4 py-2', classes.label]"><DisplayRender :content="line.label" /></td>
            <td
              v-for="(cell, cellIndex) in line.values ?? []"
              :key="cellIndex"
              v-reveal-truncated
              :class="['px-4 py-2 text-end', valueClass(line)]"
            >
              <DisplayRender :content="cell" />
            </td>
          </tr>
          <tr v-if="total" class="border-t border-dashed border-accented">
            <td :class="['px-4 py-2.5', classes.totalLabel]">
              <DisplayRender :content="total.label" />
            </td>
            <td
              v-for="(cell, cellIndex) in total.values ?? []"
              :key="cellIndex"
              :class="['px-4 py-2.5 text-end', classes.totalValue, 'text-base']"
            >
              <DisplayRender :content="cell" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="mode === 'collapsible'" :class="classes.root">
      <div :class="classes.total">
        <span v-reveal-truncated :class="classes.totalLabel">
          <DisplayRender :content="total?.label ?? title" />
          <DisplayChip v-if="total?.chip" :chip="total.chip" />
        </span>
        <button type="button" :class="classes.toggle" :aria-expanded="open" @click="open = !open">
          {{ t('display.details') }}
          <UIcon
            :name="icons.chevronDown"
            class="size-3.5 transition-transform"
            :class="open ? 'rotate-180' : ''"
          />
        </button>
        <span :class="['ms-auto', classes.totalValue]"
          ><DisplayRender :content="total?.value"
        /></span>
      </div>
      <div v-if="open" :class="classes.body">
        <div v-for="(line, index) in lines" :key="index" :class="lineClass(line)">
          <span v-reveal-truncated :class="classes.label">
            <DisplayRender :content="line.label" />
            <span v-if="!isDisplayContentEmpty(line.detail)" :class="classes.detail"
              ><DisplayRender :content="line.detail"
            /></span>
          </span>
          <span v-reveal-truncated :class="valueClass(line)"
            ><DisplayRender :content="line.value"
          /></span>
        </div>
      </div>
    </div>
    <div v-else :class="classes.root">
      <div v-if="!isDisplayContentEmpty(title)" v-reveal-truncated :class="classes.title">
        <DisplayRender :content="title" />
      </div>
      <div v-for="(line, index) in lines" :key="index" :class="lineClass(line)">
        <span v-reveal-truncated :class="classes.label">
          <DisplayRender :content="line.label" />
          <span v-if="!isDisplayContentEmpty(line.detail)" :class="classes.detail"
            ><DisplayRender :content="line.detail"
          /></span>
        </span>
        <span v-reveal-truncated :class="valueClass(line)"
          ><DisplayRender :content="line.value"
        /></span>
      </div>
      <div v-if="total" :class="classes.total">
        <span v-reveal-truncated :class="classes.totalLabel">
          <DisplayRender :content="total.label" />
          <DisplayChip v-if="total.chip" :chip="total.chip" />
        </span>
        <span :class="classes.totalValue"><DisplayRender :content="total.value" /></span>
      </div>
    </div>
    <p v-if="!isDisplayContentEmpty(footnote)" :class="classes.footnote">
      <DisplayRender :content="footnote" />
    </p>
  </div>
</template>
