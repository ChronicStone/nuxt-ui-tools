<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useDisplayAppUi } from '../../composables/use-display-config'
import { useDisplayIcons } from '../../composables/use-display-icons'
import { useDisplayLocale } from '../../composables/use-display-locale'
import { vRevealTruncated } from '../../directives/reveal-truncated'
import type { DisplayDateProps, DisplayDateSlot, DisplayTone } from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty, resolveDisplayText } from '../../utils/content'
import {
  calendarDaysBetween,
  calendarLeaf,
  formatDayCount,
  formatDisplayDate,
  formatRelativeDays,
  toDisplayDate,
} from '../../utils/dates'
import { displayToneClass } from '../../utils/tone'
import DisplayChip from '../parts/display-chip.vue'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  variant = 'tile',
  value,
  end = undefined,
  title = undefined,
  description = undefined,
  icon = undefined,
  tone = undefined,
  time = false,
  deadline = true,
  warnWithin = 3,
  now = undefined,
  label = undefined,
  loading = false,
  ui = undefined,
} = defineProps<DisplayDateProps>()

const TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
const LONG_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  weekday: 'short',
}
const LONG_DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = { ...LONG_DATE_FORMAT, ...TIME_FORMAT }

const { t, code } = useDisplayLocale()
const icons = useDisplayIcons()
const appUi = useDisplayAppUi('date')
const start = computed(() => toDisplayDate(value))
const finish = computed(() => toDisplayDate(end))
const reference = computed(() => toDisplayDate(now) ?? new Date())
const days = computed(() => (start.value ? calendarDaysBetween(reference.value, start.value) : 0))
const overdue = computed(() => deadline && days.value < 0)
const resolvedTone = computed<DisplayTone>(() => {
  if (tone) return tone
  if (variant !== 'countdown') return 'primary'
  if (overdue.value) return 'error'
  return days.value <= warnWithin ? 'warning' : 'neutral'
})
const leaf = computed(() => (start.value ? calendarLeaf(start.value, code.value) : undefined))
const timeRange = computed(() => {
  if (!time || !start.value) return undefined
  const from = formatDisplayDate(start.value, code.value, TIME_FORMAT)
  return finish.value
    ? `${from} – ${formatDisplayDate(finish.value, code.value, TIME_FORMAT)}`
    : from
})
const countdownText = computed(() => {
  const text = resolveDisplayText(label)
  if (text !== undefined) return text
  if (overdue.value)
    return t('display.overdue', { duration: formatDayCount(-days.value, code.value) })
  return formatRelativeDays(days.value, code.value)
})
// The year shows whenever the date is not in the current year.
const longDate = (date: Date | null) =>
  date
    ? formatDisplayDate(date, code.value, {
        ...(time ? LONG_DATE_TIME_FORMAT : LONG_DATE_FORMAT),
        year: date.getFullYear() === reference.value.getFullYear() ? undefined : 'numeric',
      })
    : ''
const duration = computed(() =>
  start.value && finish.value
    ? formatDayCount(calendarDaysBetween(start.value, finish.value) + 1, code.value)
    : undefined,
)
const classes = computed(() =>
  resolveDisplayClasses<DisplayDateSlot>(
    {
      body: 'min-w-0',
      bound: 'flex flex-col',
      boundLabel: 'text-[11px] text-muted',
      boundValue: 'text-[15px] font-bold text-highlighted',
      caption: 'text-xs text-toned',
      day: 'pt-1 text-xl leading-none font-extrabold text-highlighted',
      description: 'mt-0.5 flex items-center gap-1 text-xs text-muted',
      duration: '',
      icon: 'size-5 shrink-0 text-[var(--nut-tone-ink)]',
      line: 'flex flex-1 items-center gap-2 before:h-px before:flex-1 before:bg-[var(--ui-border-accented)] after:h-px after:flex-1 after:bg-[var(--ui-border-accented)]',
      month:
        'bg-[var(--nut-tone)] py-0.5 text-[9.5px] font-extrabold tracking-[0.1em] text-[var(--nut-tone-contrast)]',
      root:
        variant === 'countdown'
          ? 'flex items-center gap-3 rounded-[var(--nut-display-radius)] bg-[var(--nut-tone-soft)] px-3.5 py-3'
          : 'flex min-w-0 items-center gap-3',
      tile: 'w-13 shrink-0 overflow-hidden rounded-[var(--nut-display-radius)] border border-default bg-default text-center',
      title: 'font-semibold text-highlighted',
      value: 'text-lg leading-tight font-extrabold text-[var(--nut-tone-ink)]',
      weekday: 'pb-1 text-[10.5px] text-muted',
    },
    appUi.value,
    ui,
  ),
)
</script>

<template>
  <DisplaySkeleton v-if="loading" layout="card" />
  <div
    v-else
    :class="[classes.root, displayToneClass(resolvedTone)]"
    data-display="date"
    :data-variant="variant"
  >
    <template v-if="variant === 'countdown'">
      <UIcon :name="icon ?? (overdue ? icons.warning : 'i-lucide-clock')" :class="classes.icon" />
      <div :class="classes.body">
        <div v-reveal-truncated :class="classes.value" data-display-countdown>
          {{ countdownText }}
        </div>
        <div v-reveal-truncated :class="classes.caption">
          <DisplayRender
            :content="
              description ??
              (deadline ? t('display.dueOn', { date: longDate(start) }) : longDate(start))
            "
          />
        </div>
      </div>
    </template>
    <template v-else-if="variant === 'range'">
      <div :class="classes.bound">
        <span :class="classes.boundLabel">{{ t('display.from') }}</span>
        <span v-reveal-truncated :class="classes.boundValue">{{ longDate(start) }}</span>
      </div>
      <div :class="classes.line">
        <DisplayChip v-if="duration" :chip="{ label: duration }" :class="classes.duration" />
      </div>
      <div :class="[classes.bound, 'text-end']">
        <span :class="classes.boundLabel">{{ t('display.to') }}</span>
        <span v-reveal-truncated :class="classes.boundValue">{{ longDate(finish) }}</span>
      </div>
    </template>
    <template v-else>
      <div :class="classes.tile" aria-hidden="true">
        <div :class="classes.month">{{ leaf?.month }}</div>
        <div :class="classes.day">{{ leaf?.day }}</div>
        <div :class="classes.weekday">{{ leaf?.weekday }}</div>
      </div>
      <div :class="classes.body">
        <div v-reveal-truncated :class="classes.title">
          <DisplayRender :content="title ?? longDate(start)" />
        </div>
        <div
          v-if="!isDisplayContentEmpty(description) || timeRange"
          v-reveal-truncated
          :class="classes.description"
        >
          <UIcon v-if="timeRange" :name="icon ?? 'i-lucide-clock'" class="size-3 shrink-0" />
          <span v-if="timeRange">{{ timeRange }}</span>
          <template v-if="timeRange && !isDisplayContentEmpty(description)"> · </template>
          <DisplayRender :content="description" />
        </div>
      </div>
    </template>
  </div>
</template>
