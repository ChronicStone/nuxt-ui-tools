<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { isPlainObject } from '../../../shared/utils/predicate'
import { useDisplayAppUi } from '../../composables/use-display-config'
import { useDisplayNumber } from '../../composables/use-display-number'
import type {
  DisplayMeterLevel,
  DisplayMeterProps,
  DisplayMeterSlot,
  DisplayText,
  DisplayTone,
} from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { displayContentText, isDisplayContentEmpty, resolveDisplayText } from '../../utils/content'
import { meterShare, meterTone } from '../../utils/meter'
import { displayToneClass } from '../../utils/tone'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  variant = 'bar',
  label = undefined,
  value = 0,
  max = undefined,
  valueLabel = undefined,
  tone = undefined,
  thresholds = undefined,
  parts = undefined,
  caption = undefined,
  levels = undefined,
  current = undefined,
  target = undefined,
  size = 'md',
  loading = false,
  ui = undefined,
} = defineProps<DisplayMeterProps>()

const PALETTE = ['primary', 'info', 'success', 'warning', 'secondary', 'neutral'] as const
const RING_SIZES = { lg: 112, md: 88, sm: 64 } as const

const format = useDisplayNumber()
const appUi = useDisplayAppUi('meter')
const partTotal = computed(() => (parts ?? []).reduce((sum, part) => sum + part.value, 0))
const resolvedMax = computed(
  () => max ?? (variant === 'segments' || variant === 'split' ? partTotal.value : 100),
)
const share = computed(() => meterShare(value, resolvedMax.value))
const resolvedTone = computed(() => meterTone(share.value, tone, thresholds))
const resolvedParts = computed(() =>
  (parts ?? []).map((part, index) => ({
    ...part,
    tone:
      part.tone ??
      (variant === 'ring' ? resolvedTone.value : (PALETTE[index % PALETTE.length] ?? 'primary')),
    width: meterShare(part.value, resolvedMax.value) * 100,
  })),
)
const headerValue = computed(() => valueLabel ?? `${format(value)} / ${format(resolvedMax.value)}`)
const ariaLabel = computed(() => displayContentText(label))
const ring = computed(() => {
  const diameter = RING_SIZES[size]
  const stroke = Math.round(diameter / 11)
  const radius = (diameter - stroke) / 2
  const circumference = 2 * Math.PI * radius
  return { circumference, diameter, radius, stroke, filled: circumference * share.value }
})
const resolvedLevels = computed<DisplayMeterLevel[]>(() =>
  (levels ?? []).map((level: DisplayText | DisplayMeterLevel) =>
    isMeterLevel(level) ? level : { label: level },
  ),
)
const classes = computed(() =>
  resolveDisplayClasses<DisplayMeterSlot>(
    {
      bar: 'h-full bg-[var(--nut-tone)] transition-[width] duration-300 ease-out first:rounded-s-full last:rounded-e-full',
      caption: 'mt-1.5 text-xs text-dimmed',
      header: 'flex items-baseline justify-between gap-3 text-sm',
      label: 'flex min-w-0 items-center gap-1.5 font-semibold text-toned',
      legend: 'mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted',
      legendItem: 'inline-flex items-center gap-1.5',
      level:
        'grid h-8 place-items-center rounded-[calc(var(--nut-display-radius)*0.75)] text-xs font-bold',
      levelCaption: 'text-center text-[10.5px] text-dimmed',
      levels: 'mt-2 grid gap-1',
      parts: 'flex min-w-0 flex-1 flex-col gap-2.5',
      ring: 'flex items-center gap-4',
      root: 'min-w-0',
      track: 'mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full bg-[var(--nut-display-track)]',
      value: 'shrink-0 font-semibold text-highlighted tabular-nums',
    },
    appUi.value,
    ui,
  ),
)

function levelClass(index: number) {
  if (index === current) return 'bg-[var(--nut-tone)] text-[var(--nut-tone-contrast)]'
  if (index === target)
    return 'text-[var(--nut-tone-ink)] outline-dashed outline-[1.5px] -outline-offset-[1.5px] outline-[var(--nut-tone)]'
  if (current !== undefined && index < current)
    return 'bg-[var(--nut-tone-soft)] text-[var(--nut-tone-ink)]'
  return 'bg-elevated text-dimmed'
}

function isMeterLevel(level: DisplayText | DisplayMeterLevel): level is DisplayMeterLevel {
  return isPlainObject(level)
}

function partTone(partToneName: DisplayTone) {
  return displayToneClass(partToneName)
}
</script>

<template>
  <DisplaySkeleton v-if="loading" :layout="variant === 'ring' ? 'ring' : 'lines'" :count="2" />
  <div
    v-else
    :class="[classes.root, displayToneClass(resolvedTone)]"
    data-display="meter"
    :data-variant="variant"
  >
    <div v-if="variant === 'ring'" :class="classes.ring">
      <svg
        :width="ring.diameter"
        :height="ring.diameter"
        :viewBox="`0 0 ${ring.diameter} ${ring.diameter}`"
        class="shrink-0"
        role="meter"
        :aria-valuenow="value"
        aria-valuemin="0"
        :aria-valuemax="resolvedMax"
        :aria-label="ariaLabel"
      >
        <circle
          :cx="ring.diameter / 2"
          :cy="ring.diameter / 2"
          :r="ring.radius"
          fill="none"
          stroke="var(--nut-display-track)"
          :stroke-width="ring.stroke"
        />
        <circle
          :cx="ring.diameter / 2"
          :cy="ring.diameter / 2"
          :r="ring.radius"
          fill="none"
          stroke="var(--nut-tone)"
          :stroke-width="ring.stroke"
          stroke-linecap="round"
          :stroke-dasharray="`${ring.filled} ${ring.circumference}`"
          :transform="`rotate(-90 ${ring.diameter / 2} ${ring.diameter / 2})`"
        />
        <text
          :x="ring.diameter / 2"
          :y="ring.diameter / 2 + ring.diameter * 0.04"
          text-anchor="middle"
          class="fill-[var(--ui-text-highlighted)] font-extrabold"
          :font-size="ring.diameter * 0.22"
        >
          {{ displayContentText(valueLabel) ?? format(value) }}
        </text>
        <text
          :x="ring.diameter / 2"
          :y="ring.diameter / 2 + ring.diameter * 0.2"
          text-anchor="middle"
          class="fill-[var(--ui-text-dimmed)]"
          :font-size="ring.diameter * 0.115"
        >
          / {{ format(resolvedMax) }}
        </text>
      </svg>
      <div :class="classes.parts">
        <div v-if="!isDisplayContentEmpty(label)" :class="classes.label">
          <DisplayRender :content="label" />
        </div>
        <div v-for="(part, index) in resolvedParts" :key="index" :class="partTone(part.tone)">
          <div :class="classes.header">
            <span :class="classes.label">
              <UIcon v-if="part.icon" :name="part.icon" class="size-3.5" />
              <DisplayRender :content="part.label" />
            </span>
            <span :class="classes.value"
              ><DisplayRender :content="part.valueLabel ?? format(part.value)"
            /></span>
          </div>
          <div :class="[classes.track, 'mt-1 h-1.5']">
            <i
              :class="classes.bar"
              :style="{ width: `${meterShare(part.value, part.max ?? resolvedMax) * 100}%` }"
            />
          </div>
        </div>
        <div v-if="!isDisplayContentEmpty(caption)" :class="classes.caption">
          <DisplayRender :content="caption" />
        </div>
      </div>
    </div>
    <template v-else-if="variant === 'scale'">
      <div :class="classes.header">
        <span :class="classes.label"><DisplayRender :content="label" /></span>
        <span v-if="!isDisplayContentEmpty(valueLabel)" :class="classes.value"
          ><DisplayRender :content="valueLabel"
        /></span>
      </div>
      <div
        :class="classes.levels"
        :style="{ gridTemplateColumns: `repeat(${resolvedLevels.length || 1}, minmax(0, 1fr))` }"
      >
        <div
          v-for="(level, index) in resolvedLevels"
          :key="index"
          :class="[classes.level, levelClass(index)]"
          :data-state="
            index === current
              ? 'current'
              : index === target
                ? 'target'
                : current !== undefined && index < current
                  ? 'reached'
                  : 'idle'
          "
        >
          {{ resolveDisplayText(level.label) }}
        </div>
      </div>
      <div
        v-if="resolvedLevels.some((level) => level.caption !== undefined)"
        class="mt-1 grid gap-1"
        :style="{ gridTemplateColumns: `repeat(${resolvedLevels.length}, minmax(0, 1fr))` }"
      >
        <span v-for="(level, index) in resolvedLevels" :key="index" :class="classes.levelCaption">
          {{ resolveDisplayText(level.caption) }}
        </span>
      </div>
      <div v-if="!isDisplayContentEmpty(caption)" :class="classes.caption">
        <DisplayRender :content="caption" />
      </div>
    </template>
    <template v-else-if="variant === 'split'">
      <div class="mb-1.5 flex items-end justify-between gap-3 text-xs">
        <span
          v-for="(part, index) in resolvedParts.slice(0, 2)"
          :key="index"
          :class="['flex items-baseline gap-1.5', index === 1 ? 'text-end' : '']"
        >
          <b class="text-base font-extrabold text-highlighted tabular-nums"
            >{{ Math.round(part.width) }} %</b
          >
          <span class="text-muted"><DisplayRender :content="part.label" /></span>
        </span>
      </div>
      <div :class="[classes.track, 'mt-0']" role="img" :aria-label="ariaLabel">
        <i
          v-for="(part, index) in resolvedParts.slice(0, 2)"
          :key="index"
          :class="[classes.bar, partTone(part.tone)]"
          :style="{ width: `${part.width}%` }"
        />
      </div>
      <div v-if="!isDisplayContentEmpty(caption)" :class="classes.caption">
        <DisplayRender :content="caption" />
      </div>
    </template>
    <template v-else>
      <div v-if="!isDisplayContentEmpty(label) || variant === 'bar'" :class="classes.header">
        <span :class="classes.label"><DisplayRender :content="label" /></span>
        <span :class="classes.value"
          ><DisplayRender :content="variant === 'bar' ? headerValue : valueLabel"
        /></span>
      </div>
      <div
        :class="classes.track"
        role="meter"
        :aria-valuenow="variant === 'bar' ? value : partTotal"
        aria-valuemin="0"
        :aria-valuemax="resolvedMax"
        :aria-label="ariaLabel"
      >
        <i v-if="variant === 'bar'" :class="classes.bar" :style="{ width: `${share * 100}%` }" />
        <i
          v-for="(part, index) in variant === 'segments' ? resolvedParts : []"
          v-else
          :key="index"
          :class="[classes.bar, partTone(part.tone)]"
          :style="{ width: `${part.width}%` }"
        />
      </div>
      <div v-if="variant === 'segments' && resolvedParts.length" :class="classes.legend">
        <span
          v-for="(part, index) in resolvedParts"
          :key="index"
          :class="[classes.legendItem, partTone(part.tone)]"
        >
          <i class="size-2 rounded-[2px] bg-[var(--nut-tone)]" />
          <DisplayRender :content="part.label" />
          <b class="font-semibold text-default tabular-nums"
            ><DisplayRender :content="part.valueLabel ?? format(part.value)"
          /></b>
        </span>
      </div>
      <div v-if="!isDisplayContentEmpty(caption)" :class="classes.caption">
        <DisplayRender :content="caption" />
      </div>
    </template>
  </div>
</template>
