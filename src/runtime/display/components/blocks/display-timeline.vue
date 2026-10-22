<script setup lang="ts">
import UAvatar from '@nuxt/ui/components/Avatar.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useDisplayAppUi } from '../../composables/use-display-config'
import { useDisplayIcons } from '../../composables/use-display-icons'
import { useDisplayLocale } from '../../composables/use-display-locale'
import { useDisplayReveal } from '../../composables/use-display-reveal'
import type {
  DisplayTimelineItem,
  DisplayTimelineProps,
  DisplayTimelineSlot,
  DisplayTimelineState,
} from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty, resolveDisplayText } from '../../utils/content'
import { formatDisplayDate, toDisplayDate } from '../../utils/dates'
import { displayToneClass, initialsOf, toneFromName } from '../../utils/tone'
import DisplayEmptyLine from '../parts/display-empty-line.vue'
import DisplayMore from '../parts/display-more.vue'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  variant = 'vertical',
  items,
  current = undefined,
  now = undefined,
  nowLabel = undefined,
  dateFormat = undefined,
  max = undefined,
  step = undefined,
  empty = undefined,
  loading = false,
  ui = undefined,
} = defineProps<DisplayTimelineProps>()

const { t, code } = useDisplayLocale()
const icons = useDisplayIcons()
const appUi = useDisplayAppUi('timeline')
const reference = computed(() => toDisplayDate(now) ?? new Date())
const entries = computed(() =>
  items.map((item, index) => {
    const date = toDisplayDate(item.date)
    return { ...item, resolvedState: stateOf(item, index, date), timeLabel: timeOf(item, date) }
  }),
)
const reveal = useDisplayReveal({ items: () => entries.value, max: () => max, step: () => step })
const nowIndex = computed(() =>
  variant === 'schedule'
    ? reveal.visible.value.findIndex((entry) => entry.resolvedState === 'upcoming')
    : -1,
)
const nowText = computed(
  () =>
    resolveDisplayText(nowLabel) ??
    `${t('display.today')} · ${formatDisplayDate(reference.value, code.value, { day: 'numeric', month: 'short' })}`,
)
const classes = computed(() =>
  resolveDisplayClasses<DisplayTimelineSlot>(
    {
      actor: 'flex items-center gap-1.5',
      body: 'min-w-0',
      connector: 'absolute start-[7.5px] top-4 -bottom-px w-px bg-[var(--ui-border)]',
      description: 'mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted',
      empty: '',
      item:
        variant === 'pipeline'
          ? 'relative flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center'
          : variant === 'log'
            ? 'flex items-center gap-2.5 px-3 py-1.5 text-sm'
            : 'relative grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3 pb-3.5 last:pb-0',
      marker:
        variant === 'pipeline'
          ? 'relative z-[1] grid size-6 place-items-center rounded-full border-2 text-[10px] font-bold'
          : 'relative z-[1] mt-1 ms-[3px] size-2.5 rounded-full',
      more: 'self-start',
      now: 'mb-3.5 flex items-center gap-2 text-[11px] font-bold tracking-[0.06em] text-[var(--nut-display-primary-ink)] uppercase before:h-0.5 before:w-4 before:rounded-full before:bg-[var(--nut-display-primary)] after:h-px after:flex-1 after:bg-[var(--nut-display-primary-line)]',
      root:
        variant === 'log'
          ? 'flex min-w-0 flex-col divide-y divide-muted rounded-[var(--nut-display-radius)] border border-default'
          : 'flex min-w-0 flex-col gap-2',
      time:
        variant === 'log'
          ? 'w-11 shrink-0 font-mono text-[11px] text-dimmed'
          : 'shrink-0 text-xs font-normal text-dimmed',
      title:
        variant === 'pipeline'
          ? 'text-xs font-semibold text-highlighted'
          : 'flex items-baseline justify-between gap-2 text-sm font-semibold text-highlighted',
    },
    appUi.value,
    ui,
  ),
)

function stateOf(
  item: DisplayTimelineItem,
  index: number,
  date: Date | null,
): DisplayTimelineState {
  if (item.state) return item.state
  if (variant === 'pipeline' && current !== undefined)
    return index < current ? 'done' : index === current ? 'current' : 'upcoming'
  if (date) return date.getTime() > reference.value.getTime() ? 'upcoming' : 'done'
  return 'done'
}

function timeOf(item: DisplayTimelineItem, date: Date | null) {
  const text = resolveDisplayText(item.time)
  if (text !== undefined || !date) return text
  const options: Intl.DateTimeFormatOptions =
    dateFormat ??
    (variant === 'log'
      ? { hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short' })
  return formatDisplayDate(date, code.value, options)
}

function dotClass(state: DisplayTimelineState) {
  if (state === 'upcoming')
    return 'border-[1.5px] border-dashed border-[var(--ui-border-accented)] bg-default'
  if (state === 'current') return 'bg-[var(--nut-tone)] ring-4 ring-[var(--nut-tone-soft)]'
  return 'bg-[var(--nut-tone)] ring-3 ring-[var(--nut-tone-soft)]'
}

function stageClass(state: DisplayTimelineState) {
  if (state === 'done') return 'border-[var(--ui-bg-inverted)] bg-inverted text-inverted'
  if (state === 'current')
    return 'border-[var(--nut-tone)] bg-[var(--nut-tone)] text-[var(--nut-tone-contrast)] ring-4 ring-[var(--nut-tone-soft)]'
  return 'border-[var(--ui-border-accented)] bg-default text-dimmed'
}

function actorAvatar(name: string) {
  return {
    alt: name,
    class: displayToneClass(toneFromName(name)),
    size: '3xs' as const,
    text: initialsOf(name),
    ui: {
      fallback: 'text-[8px] font-bold text-[var(--nut-tone-ink)]',
      root: 'bg-[var(--nut-tone-soft)]',
    },
  }
}
</script>

<template>
  <DisplaySkeleton v-if="loading" :count="Math.min(Math.max(items.length, 2), 5)" />
  <DisplayEmptyLine v-else-if="!items.length" :content="empty" :class="classes.empty" />
  <div
    v-else-if="variant === 'log'"
    :class="classes.root"
    data-display="timeline"
    data-variant="log"
  >
    <div v-for="(entry, index) in reveal.visible.value" :key="index" :class="classes.item">
      <time :class="classes.time">{{ entry.timeLabel }}</time>
      <UAvatar
        v-if="entry.actor"
        v-bind="actorAvatar(resolveDisplayText(entry.actor.name) ?? '')"
        :src="entry.actor.avatar?.src"
        class="shrink-0"
      />
      <span class="min-w-0 flex-1 text-toned">
        <b v-if="entry.actor" class="font-semibold text-highlighted">{{
          resolveDisplayText(entry.actor.name)
        }}</b>
        {{ ' ' }}<DisplayRender :content="entry.title" />
      </span>
    </div>
  </div>
  <ol
    v-else-if="variant === 'pipeline'"
    class="m-0 flex list-none p-0"
    data-display="timeline"
    data-variant="pipeline"
  >
    <li
      v-for="(entry, index) in entries"
      :key="index"
      :class="[classes.item, displayToneClass(entry.tone ?? 'primary')]"
      :data-state="entry.resolvedState"
      :aria-current="entry.resolvedState === 'current' ? 'step' : undefined"
    >
      <span
        v-if="index > 0"
        :class="[
          'absolute top-[11px] -start-1/2 h-0.5 w-full',
          entry.resolvedState === 'upcoming' ? 'bg-[var(--ui-border)]' : 'bg-inverted',
        ]"
        aria-hidden="true"
      />
      <span :class="[classes.marker, stageClass(entry.resolvedState)]">
        <UIcon
          v-if="entry.resolvedState === 'done'"
          :name="entry.icon ?? icons.check"
          class="size-3"
        />
        <UIcon v-else-if="entry.icon" :name="entry.icon" class="size-3" />
        <template v-else>{{ index + 1 }}</template>
      </span>
      <span
        :class="[classes.title, entry.resolvedState === 'upcoming' ? 'font-medium text-muted' : '']"
      >
        <DisplayRender :content="entry.title" />
      </span>
      <span v-if="entry.timeLabel" :class="['-mt-1 text-[11px]', classes.time]">{{
        entry.timeLabel
      }}</span>
    </li>
  </ol>
  <div v-else :class="classes.root" data-display="timeline" :data-variant="variant">
    <ol class="m-0 list-none p-0">
      <template v-for="(entry, index) in reveal.visible.value" :key="index">
        <li v-if="index === nowIndex" :class="classes.now" data-display-now>{{ nowText }}</li>
        <li
          :class="[classes.item, displayToneClass(entry.tone ?? 'neutral')]"
          :data-state="entry.resolvedState"
        >
          <span
            v-if="index < reveal.visible.value.length - 1"
            :class="[
              classes.connector,
              reveal.visible.value[index + 1]?.resolvedState === 'upcoming'
                ? 'bg-[repeating-linear-gradient(var(--ui-border-accented)_0_3px,transparent_3px_6px)]'
                : '',
            ]"
            aria-hidden="true"
          />
          <span :class="[classes.marker, dotClass(entry.resolvedState)]" aria-hidden="true" />
          <div :class="classes.body">
            <div :class="[classes.title, entry.resolvedState === 'upcoming' ? 'text-muted' : '']">
              <span class="min-w-0"><DisplayRender :content="entry.title" /></span>
              <time v-if="entry.timeLabel" :class="classes.time">{{ entry.timeLabel }}</time>
            </div>
            <div
              v-if="entry.actor || !isDisplayContentEmpty(entry.description)"
              :class="classes.description"
            >
              <span v-if="entry.actor" :class="classes.actor">
                <UAvatar
                  v-bind="actorAvatar(resolveDisplayText(entry.actor.name) ?? '')"
                  :src="entry.actor.avatar?.src"
                />
                {{ resolveDisplayText(entry.actor.name) }}
              </span>
              <template v-if="entry.actor && !isDisplayContentEmpty(entry.description)">
                ·
              </template>
              <DisplayRender :content="entry.description" />
            </div>
          </div>
        </li>
      </template>
    </ol>
    <DisplayMore
      v-if="reveal.hidden.value"
      :count="reveal.next.value"
      :class="classes.more"
      @reveal="reveal.reveal"
    />
  </div>
</template>
