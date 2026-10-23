<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { twMerge } from 'tailwind-merge'
import { computed } from 'vue'

import { useDisplayAppUi } from '../../composables/use-display-config'
import { vRevealTruncated } from '../../directives/reveal-truncated'
import type { DisplayStatProps, DisplayStatSlot, DisplayTone } from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty, resolveDisplayText } from '../../utils/content'
import {
  DISPLAY_SURFACE_CLASSES,
  DISPLAY_SURFACE_PADDING,
  displayToneClass,
} from '../../utils/tone'
import DisplayChip from '../parts/display-chip.vue'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  variant = 'hero',
  label = undefined,
  value = undefined,
  unit = undefined,
  caption = undefined,
  chip = undefined,
  status = undefined,
  delta = undefined,
  trend = undefined,
  items = undefined,
  tone = 'primary',
  size = 'md',
  surface = undefined,
  loading = false,
  ui = undefined,
} = defineProps<DisplayStatProps>()

const VALUE_SIZES = {
  hero: { lg: 'text-4xl', md: 'text-3xl', sm: 'text-xl' },
  price: { lg: 'text-3xl', md: 'text-2xl', sm: 'text-lg' },
  row: { lg: 'text-2xl', md: 'text-xl', sm: 'text-base' },
  trend: { lg: 'text-3xl', md: 'text-2xl', sm: 'text-lg' },
} as const

const appUi = useDisplayAppUi('stat')
const resolvedSurface = computed(
  () => surface ?? (variant === 'hero' ? 'muted' : variant === 'row' ? 'bordered' : 'plain'),
)
const deltaTone = computed<DisplayTone>(() => {
  if (!delta) return 'neutral'
  if (delta.tone) return delta.tone
  if (delta.direction === 'down') return 'error'
  return delta.direction === 'flat' ? 'neutral' : 'success'
})
const deltaIcon = computed(() => {
  if (delta?.direction === 'down') return 'i-lucide-trending-down'
  return delta?.direction === 'flat' ? 'i-lucide-minus' : 'i-lucide-trending-up'
})
const sparkline = computed(() => {
  if (!trend || trend.length < 2) return undefined
  const min = Math.min(...trend)
  const span = Math.max(...trend) - min || 1
  const points = trend.map((point, index) => {
    const x = (index / (trend.length - 1)) * 100
    const y = 30 - ((point - min) / span) * 26
    return `${x.toFixed(2)} ${y.toFixed(2)}`
  })
  const line = `M${points.join(' L')}`
  return { area: `${line} L100 32 L0 32 Z`, line }
})
const classes = computed(() =>
  resolveDisplayClasses<DisplayStatSlot>(
    {
      caption:
        variant === 'hero'
          ? 'mt-1 flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted'
          : 'mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted',
      delta:
        'inline-flex items-center gap-1 rounded-full bg-[var(--nut-tone-soft)] px-2 py-0.5 text-xs font-bold text-[var(--nut-tone-ink)]',
      item: 'min-w-0 border-s border-default px-3.5 py-3 first:border-s-0',
      itemCaption: 'mt-0.5 text-xs text-muted',
      itemLabel: 'text-xs text-dimmed',
      itemValue: `mt-0.5 font-extrabold text-highlighted tabular-nums ${VALUE_SIZES.row[size]}`,
      items: 'grid',
      label: 'text-xs font-semibold text-muted',
      root:
        variant === 'row'
          ? DISPLAY_SURFACE_CLASSES[resolvedSurface.value]
          : `flex min-w-0 ${variant === 'hero' ? 'flex-col items-center text-center' : variant === 'trend' ? 'items-end gap-4' : 'flex-col'} ${DISPLAY_SURFACE_CLASSES[resolvedSurface.value]} ${DISPLAY_SURFACE_PADDING[resolvedSurface.value]}`,
      sparkline: 'h-11 min-w-0 flex-1 text-[var(--nut-tone)]',
      status: 'mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--nut-tone-ink)]',
      unit: 'ms-1 text-sm font-semibold tracking-normal text-muted',
      value: `my-0.5 leading-tight font-extrabold tracking-tight text-highlighted tabular-nums ${VALUE_SIZES[variant][size]}`,
    },
    appUi.value,
    ui,
  ),
)
</script>

<template>
  <DisplaySkeleton
    v-if="loading"
    :layout="variant === 'row' ? 'tiles' : 'lines'"
    :count="variant === 'row' ? 3 : 2"
  />
  <div v-else-if="variant === 'row'" :class="classes.root" data-display="stat" data-variant="row">
    <div
      :class="classes.items"
      :style="{ gridTemplateColumns: `repeat(${items?.length || 1}, minmax(0, 1fr))` }"
    >
      <div
        v-for="(item, index) in items"
        :key="index"
        :class="[classes.item, item.tone ? displayToneClass(item.tone) : '']"
      >
        <div v-reveal-truncated :class="classes.itemLabel">
          <DisplayRender :content="item.label" />
        </div>
        <div :class="twMerge(classes.itemValue, item.tone ? 'text-[var(--nut-tone-ink)]' : '')">
          <DisplayRender :content="item.value" />
        </div>
        <div
          v-if="!isDisplayContentEmpty(item.caption)"
          v-reveal-truncated
          :class="classes.itemCaption"
        >
          <DisplayRender :content="item.caption" />
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    :class="[classes.root, displayToneClass(tone)]"
    data-display="stat"
    :data-variant="variant"
  >
    <div :class="variant === 'trend' ? 'min-w-0' : 'contents'">
      <div v-if="!isDisplayContentEmpty(label)" v-reveal-truncated :class="classes.label">
        <DisplayRender :content="label" />
      </div>
      <div :class="variant === 'trend' ? 'flex items-center gap-2' : 'contents'">
        <div v-reveal-truncated :class="classes.value">
          <DisplayRender :content="value" />
          <span v-if="!isDisplayContentEmpty(unit)" :class="classes.unit"
            ><DisplayRender :content="unit"
          /></span>
        </div>
        <span v-if="delta" :class="[classes.delta, displayToneClass(deltaTone)]" data-display-delta>
          <UIcon :name="deltaIcon" class="size-3.5" />{{ resolveDisplayText(delta.value) }}
        </span>
      </div>
      <div v-if="status" :class="[classes.status, displayToneClass(status.tone ?? 'success')]">
        <UIcon v-if="status.icon" :name="status.icon" class="size-4 shrink-0" />
        <DisplayRender :content="status.text" />
      </div>
      <div
        v-if="!isDisplayContentEmpty(caption) || chip"
        v-reveal-truncated
        :class="classes.caption"
      >
        <DisplayChip v-if="chip" :chip="chip" />
        <DisplayRender :content="caption" />
      </div>
    </div>
    <svg
      v-if="variant === 'trend' && sparkline"
      :class="classes.sparkline"
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path :d="sparkline.area" fill="currentColor" fill-opacity="0.14" />
      <path
        :d="sparkline.line"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  </div>
</template>
