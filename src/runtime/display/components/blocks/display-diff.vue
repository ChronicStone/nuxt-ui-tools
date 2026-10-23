<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useDisplayAppUi } from '../../composables/use-display-config'
import { useDisplayIcons } from '../../composables/use-display-icons'
import { useDisplayLocale } from '../../composables/use-display-locale'
import { vRevealTruncated } from '../../directives/reveal-truncated'
import type { DisplayDiffProps, DisplayDiffSlot } from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty } from '../../utils/content'
import DisplayChip from '../parts/display-chip.vue'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  variant = 'inline',
  title = undefined,
  columns = undefined,
  items,
  showUnchanged = false,
  loading = false,
  ui = undefined,
} = defineProps<DisplayDiffProps>()

const { t } = useDisplayLocale()
const icons = useDisplayIcons()
const appUi = useDisplayAppUi('diff')
const inlineItems = computed(() =>
  showUnchanged ? items : items.filter((item) => item.changed !== false),
)
const headings = computed(
  () => columns ?? [t('display.field'), t('display.before'), t('display.after')],
)
const classes = computed(() =>
  resolveDisplayClasses<DisplayDiffSlot>(
    {
      after:
        'rounded-[4px] bg-[var(--nut-display-success-soft)] px-1.5 py-px font-semibold text-[var(--nut-display-success-ink)]',
      arrow: 'size-3.5 shrink-0 text-dimmed',
      before:
        'rounded-[4px] bg-[var(--nut-display-error-soft)] px-1.5 py-px text-[var(--nut-display-error-ink)] line-through decoration-[color-mix(in_oklab,currentColor_45%,transparent)]',
      cell: 'border-t border-muted px-3 py-2 align-middle',
      frame: 'overflow-hidden rounded-[var(--nut-display-radius)] border border-default',
      headCell:
        'bg-elevated px-3 py-2 text-start text-[11px] font-bold tracking-[0.07em] text-muted uppercase',
      item: '',
      label: 'mb-1 flex items-center gap-2 text-xs text-muted',
      note: '',
      root: 'flex min-w-0 flex-col gap-2.5',
      table: 'w-full border-collapse text-sm',
      title: 'text-sm font-semibold text-toned',
      unchanged: 'text-muted',
      values: 'flex flex-wrap items-center gap-1.5 text-sm',
    },
    appUi.value,
    ui,
  ),
)
</script>

<template>
  <DisplaySkeleton
    v-if="loading"
    :layout="variant === 'columns' ? 'rows' : 'lines'"
    :count="Math.max(items.length, 2)"
  />
  <div v-else :class="classes.root" data-display="diff" :data-variant="variant">
    <div v-if="!isDisplayContentEmpty(title)" v-reveal-truncated :class="classes.title">
      <DisplayRender :content="title" />
    </div>
    <template v-if="variant === 'inline'">
      <div v-for="(item, index) in inlineItems" :key="index" :class="classes.item">
        <div v-reveal-truncated :class="classes.label">
          <DisplayRender :content="item.label" />
          <DisplayChip v-if="item.note" :chip="item.note" :class="classes.note" />
        </div>
        <div
          v-if="item.changed === false"
          :class="[classes.values, classes.unchanged]"
          data-unchanged
        >
          <DisplayRender :content="isDisplayContentEmpty(item.after) ? item.before : item.after" />
        </div>
        <div v-else :class="classes.values">
          <span
            v-if="!isDisplayContentEmpty(item.before)"
            v-reveal-truncated
            :class="classes.before"
            ><DisplayRender :content="item.before"
          /></span>
          <UIcon
            v-if="!isDisplayContentEmpty(item.before) && !isDisplayContentEmpty(item.after)"
            :name="icons.arrowRight"
            :class="classes.arrow"
          />
          <span v-if="!isDisplayContentEmpty(item.after)" v-reveal-truncated :class="classes.after"
            ><DisplayRender :content="item.after"
          /></span>
        </div>
      </div>
    </template>
    <div v-else :class="classes.frame">
      <table :class="classes.table">
        <thead>
          <tr>
            <th
              v-for="(heading, index) in headings"
              :key="index"
              scope="col"
              v-reveal-truncated
              :class="classes.headCell"
            >
              <DisplayRender :content="heading" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in items"
            :key="index"
            :class="item.changed === false ? 'text-dimmed' : ''"
            :data-changed="item.changed !== false"
          >
            <td
              v-reveal-truncated
              :class="[classes.cell, item.changed === false ? '' : 'text-toned']"
            >
              <span class="inline-flex flex-wrap items-center gap-1.5">
                <DisplayRender :content="item.label" />
                <DisplayChip v-if="item.note" :chip="item.note" :class="classes.note" />
              </span>
            </td>
            <td
              v-reveal-truncated
              :class="[classes.cell, item.changed === false ? '' : 'text-muted']"
            >
              <DisplayRender :content="item.before" />
            </td>
            <td
              :class="[
                classes.cell,
                item.changed === false ? '' : 'font-semibold text-highlighted',
              ]"
            >
              <DisplayRender :content="item.after" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
