<script setup lang="ts" generic="TData">
import UButton from '@nuxt/ui/components/Button.vue'
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import { useResponsiveValue } from '#ui-tools/shared/composables/use-responsive-value'
import { isNumber } from '#ui-tools/shared/utils/predicate'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBlockBaseProps,
  DashboardBlockUi,
  DashboardDataTable,
  DashboardDetailsItem,
  DashboardDetailsUi,
  DashboardSourceLike,
} from '../types'
import { toDashboardCell } from '../utils/export'
import { resolveDashboardClasses } from '../utils/ui'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardCard from './dashboard-card.vue'

/**
 * The fields of one record as a description list: a label over each value, in a responsive grid.
 * Empty values read as a muted dash, identifiers can be monospace and copied, values can link, and
 * `#item-<key>` renders a field's value yourself (a status, a list of links).
 *
 * @example
 * ```vue
 * <UiDashboardDetails
 *   :source="account"
 *   title="Identity"
 *   columns="1 md:2"
 *   :items="[
 *     { key: 'name', label: 'Name', value: (a) => a.name },
 *     { key: 'vat', label: 'VAT number', value: (a) => a.vatNumber, mono: true, copy: true },
 *     { key: 'address', label: 'Address', value: (a) => a.address, span: 'full' },
 *   ]"
 * />
 * ```
 */
const {
  source,
  card = true,
  menu = undefined,
  freshness = undefined,
  items,
  columns = '1 sm:2',
  layout = 'stacked',
  ui,
  ...block
} = defineProps<
  Omit<DashboardBlockBaseProps, 'ui'> & {
    source: DashboardSourceLike<TData>
    /** Fields read from the source data, in display order. */
    items: readonly DashboardDetailsItem<TData & ({} | null)>[]
    /** Column count, responsive: `"1 md:2 xl:3"`. Defaults to `"1 sm:2"`. */
    columns?: string
    /** `stacked`: each label over its value. `inline`: the label beside its value, on one row. */
    layout?: 'stacked' | 'inline'
    ui?: DashboardBlockUi & DashboardDetailsUi
  }
>()

defineSlots<
  {
    [TKey in `item-${string}`]?: (props: {
      data: TData & ({} | null)
      item: DashboardDetailsItem<TData & ({} | null)>
      value: string | undefined
    }) => unknown
  } & {
    'header-right'?: () => unknown
    toolbar?: () => unknown
    footer?: () => unknown
  }
>()

const { t } = useUiToolsLocale()
const formats = useDashboardFormat()
const appUi = useDashboardUi()
const clipboard = useClipboard({ copiedDuring: 1600, legacy: true })

const layouts = {
  inline: {
    item: 'grid grid-cols-[minmax(7rem,38%)_minmax(0,1fr)] items-baseline gap-x-4',
    label: 'text-[12.5px]',
  },
  stacked: { item: 'flex flex-col gap-1', label: 'text-xs' },
} as const

const classes = computed(() =>
  resolveDashboardClasses(
    {
      copy: 'ms-0.5 -my-1 opacity-0 transition-opacity group-hover/detail:opacity-100 focus-visible:opacity-100 data-[copied]:opacity-100',
      grid: layout === 'inline' ? 'grid gap-x-8 gap-y-2.5' : 'grid gap-x-8 gap-y-4',
      hint: 'mt-0.5 text-[11.5px] text-muted',
      item: `group/detail min-w-0 ${layouts[layout].item}`,
      label: `min-w-0 truncate text-muted ${layouts[layout].label}`,
      link: 'h-auto min-w-0 p-0 text-[length:inherit] font-normal underline decoration-primary/35 underline-offset-[3px] transition-colors hover:decoration-primary',
      placeholder: 'text-dimmed',
      value:
        'flex min-w-0 items-center gap-1 text-[13.5px] leading-snug break-words text-highlighted',
    },
    appUi.value.details,
    ui,
  ),
)

const gridColumns = useResponsiveValue(() => columns, 'grid-cols')

const entries = computed(() => {
  const data = source.data
  if (data === undefined || data === null) return []
  return items
    .filter((item) => !item.hidden?.(data))
    .map((item) => {
      const raw = item.value(data)
      const text =
        raw === null || raw === undefined
          ? undefined
          : isNumber(raw)
            ? formats.resolve(item.format)(raw)
            : resolveTextValue(raw)
      const value = text === '' ? undefined : text
      const hint = item.hint?.(data)
      return {
        data,
        hint: hint === null || hint === undefined ? undefined : resolveTextValue(hint),
        item,
        key: item.key,
        label: resolveTextValue(item.label),
        placeholder: item.placeholder === undefined ? '—' : resolveTextValue(item.placeholder),
        span: item.span === 'full' ? '1 / -1' : item.span ? `span ${item.span}` : undefined,
        target: value === undefined ? undefined : (item.to?.(data) ?? undefined),
        value,
      }
    })
})

function copy(value: string) {
  void clipboard.copy(value)
}

function tabulate(): DashboardDataTable {
  return {
    columns: [
      { key: 'label', label: t('dashboard.table.label'), numeric: false },
      { key: 'value', label: t('dashboard.table.value'), numeric: false },
    ],
    rows: entries.value.map((entry) => [
      toDashboardCell(entry.label),
      toDashboardCell(entry.value ?? ''),
    ]),
  }
}
</script>

<template>
  <DashboardCard
    v-bind="block"
    :card
    :menu
    :freshness
    :ui
    :source
    :is-empty="entries.length === 0"
    :tabulate
  >
    <template #skeleton>
      <DashboardSkeleton
        kind="details"
        :count="items.length"
        :columns="layout === 'inline' ? 1 : 2"
      />
    </template>
    <template v-if="$slots['header-right']" #header-right>
      <slot name="header-right" />
    </template>
    <template v-if="$slots.toolbar" #toolbar>
      <slot name="toolbar" />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>

    <dl :class="classes.grid" :style="gridColumns ?? undefined" :data-layout="layout">
      <div
        v-for="entry in entries"
        :key="entry.key"
        :class="classes.item"
        :style="entry.span ? { gridColumn: entry.span } : undefined"
        :data-empty="entry.value === undefined ? '' : undefined"
        data-details-item
      >
        <dt :class="classes.label">{{ entry.label }}</dt>
        <dd class="m-0 min-w-0">
          <div
            :class="[classes.value, entry.item.mono && 'font-mono text-[12.5px] tracking-tight']"
          >
            <slot
              :name="`item-${entry.key}`"
              :data="entry.data"
              :item="entry.item"
              :value="entry.value"
            >
              <span v-if="entry.value === undefined" :class="classes.placeholder">
                {{ entry.placeholder }}
              </span>
              <UButton
                v-else-if="entry.target !== undefined"
                :to="entry.target"
                :label="entry.value"
                color="primary"
                variant="link"
                :class="classes.link"
                data-details-link
              />
              <span v-else class="min-w-0">{{ entry.value }}</span>
            </slot>
            <UButton
              v-if="entry.item.copy && entry.value !== undefined"
              :icon="
                clipboard.copied.value && clipboard.text.value === entry.value
                  ? 'i-lucide-check'
                  : 'i-lucide-copy'
              "
              :aria-label="
                clipboard.copied.value && clipboard.text.value === entry.value
                  ? t('dashboard.details.copied')
                  : t('dashboard.details.copy')
              "
              :data-copied="
                (clipboard.copied.value && clipboard.text.value === entry.value) || undefined
              "
              color="neutral"
              variant="ghost"
              size="xs"
              :class="classes.copy"
              @click="copy(entry.value)"
            />
          </div>
          <p v-if="entry.hint" :class="classes.hint">{{ entry.hint }}</p>
        </dd>
      </div>
    </dl>
  </DashboardCard>
</template>
