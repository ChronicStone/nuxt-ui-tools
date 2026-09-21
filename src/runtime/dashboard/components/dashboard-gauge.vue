<script setup lang="ts" generic="TData">
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { isNumber, isString } from '#ui-tools/shared/utils/predicate'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBlockBaseProps,
  DashboardBlockUi,
  DashboardDataTable,
  DashboardGaugeUi,
  DashboardSeriesColor,
  DashboardSourceLike,
  DashboardValueFormat,
} from '../types'
import { resolveDashboardColor } from '../utils/charts'
import { toDashboardCell } from '../utils/export'
import { resolveDashboardClasses } from '../utils/ui'
import DashboardRing from './block/dashboard-ring.vue'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardCard from './dashboard-card.vue'

type Ready = TData & ({} | null)

const {
  source,
  card = true,
  menu = undefined,
  freshness = undefined,
  value,
  min = 0,
  max = 100,
  target,
  format,
  caption,
  color = 'series-1',
  variant = 'arc',
  diameter = 168,
  thickness = 12,
  ui,
  ...block
} = defineProps<
  Omit<DashboardBlockBaseProps, 'ui'> & {
    source: DashboardSourceLike<TData>
    /** Current value, placed between `min` and `max`. */
    value: (data: Ready) => number | null | undefined
    /** Start of the scale. Defaults to `0`. */
    min?: number | ((data: Ready) => number)
    /** End of the scale (a goal, a capacity). Defaults to `100`. */
    max?: number | ((data: Ready) => number)
    /** Target on the scale, drawn as a tick across the ring. `null` hides it. */
    target?: (data: Ready) => number | null | undefined
    /** Center value format. Defaults to the locale number format. */
    format?: DashboardValueFormat
    /** Text under the value, inside the ring. */
    caption?: LazyTextValue | ((data: Ready) => LazyTextValue | undefined)
    /**
     * Filled stroke color: a palette slot, a Nuxt UI color, any CSS color, or a function of the
     * value and its share of the scale (`0`–`1`), e.g. to turn red past a threshold.
     */
    color?: DashboardSeriesColor | ((value: number, share: number) => DashboardSeriesColor)
    /** `arc`: a 240° gauge open at the bottom, with the scale bounds under it. `ring`: a full ring. */
    variant?: 'arc' | 'ring'
    /** Ring size in pixels. */
    diameter?: number
    thickness?: number
    ui?: DashboardBlockUi & DashboardGaugeUi
  }
>()

defineSlots<{
  /** Content in the middle of the ring, instead of the value and caption. */
  center?: (props: { data: Ready; value: string; share: number }) => unknown
  'header-right'?: () => unknown
  toolbar?: () => unknown
  footer?: () => unknown
}>()

const { t } = useUiToolsLocale()
const formats = useDashboardFormat()
const appUi = useDashboardUi()
const classes = computed(() =>
  resolveDashboardClasses(
    {
      caption: 'mt-1 block text-[11.5px] text-muted',
      ring: 'mx-auto',
      scale: 'mx-auto -mt-3 flex justify-between px-1 text-[11px] text-dimmed tabular-nums',
      value:
        'block text-[28px] leading-none font-semibold tracking-tight text-highlighted tabular-nums',
    },
    appUi.value.gauge,
    ui,
  ),
)

const gauge = computed(() => {
  const data = source.data
  if (data === undefined) return null
  const amount = value(data)
  if (!isNumber(amount) || !Number.isFinite(amount)) return null
  const low = isNumber(min) ? min : min(data)
  const high = isNumber(max) ? max : max(data)
  const span = high - low
  const share = span > 0 ? (amount - low) / span : 0
  const goal = target?.(data)
  const formatValue = format ?? formats.number.value
  const text =
    caption === undefined || isString(caption) || isNumber(caption) ? caption : caption(data)
  return {
    caption: resolveTextValue(text),
    color: resolveDashboardColor(isString(color) ? color : color(amount, share), 0),
    data,
    high: formatValue(high),
    highRaw: high,
    low: formatValue(low),
    lowRaw: low,
    raw: amount,
    share,
    target: isNumber(goal) && span > 0 ? (goal - low) / span : null,
    targetText: isNumber(goal) ? t('dashboard.stat.goal', { value: formatValue(goal) }) : '',
    targetValue: isNumber(goal) ? goal : null,
    value: formatValue(amount),
  }
})

function tabulate(): DashboardDataTable {
  const current = gauge.value
  return {
    columns: [
      { key: 'label', label: t('dashboard.table.label'), numeric: false },
      { key: 'value', label: t('dashboard.table.value'), numeric: true },
    ],
    rows: current
      ? [
          [
            toDashboardCell(t('dashboard.table.value')),
            toDashboardCell(current.raw, current.value),
          ],
          ...(current.targetValue === null
            ? []
            : [[toDashboardCell(current.targetText), toDashboardCell(current.targetValue)]]),
        ]
      : [],
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
    :is-empty="gauge === null"
    :tabulate
    :view-as-table="false"
    :expandable="false"
  >
    <template #skeleton>
      <DashboardSkeleton kind="gauge" :diameter />
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

    <!-- Centered in whatever height the grid row gives the card. -->
    <div v-if="gauge" class="flex h-full flex-col items-center justify-center">
      <DashboardRing
        :ratio="gauge.share"
        :size="diameter"
        :thickness
        :color="gauge.color"
        :arc="variant === 'arc'"
        :target="gauge.target"
        :class="classes.ring"
        role="meter"
        :aria-valuemin="gauge.lowRaw"
        :aria-valuemax="gauge.highRaw"
        :aria-valuenow="gauge.raw"
        :aria-valuetext="gauge.value"
        :aria-label="gauge.caption || undefined"
      >
        <slot name="center" :data="gauge.data" :value="gauge.value" :share="gauge.share">
          <b :class="classes.value">{{ gauge.value }}</b>
          <small v-if="gauge.caption" :class="classes.caption">{{ gauge.caption }}</small>
        </slot>
      </DashboardRing>
      <div
        v-if="variant === 'arc'"
        :class="classes.scale"
        :style="{ width: `${diameter}px` }"
        aria-hidden="true"
      >
        <span>{{ gauge.low }}</span>
        <span v-if="gauge.targetText" class="text-muted">{{ gauge.targetText }}</span>
        <span>{{ gauge.high }}</span>
      </div>
    </div>
  </DashboardCard>
</template>
