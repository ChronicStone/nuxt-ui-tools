<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useSpreadsheetStepsContext } from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetSteps, SpreadsheetStepState, SpreadsheetStepStatus } from '../../types'

const props = withDefaults(
  defineProps<{
    steps?: SpreadsheetSteps
    /** `vertical` lists steps with their hints from `lg` up, and a row of steps below. */
    orientation?: 'horizontal' | 'vertical'
    /** Vertical only: numbers without labels, for a narrow rail. */
    compact?: boolean
  }>(),
  { compact: false, orientation: 'horizontal', steps: undefined },
)
const steps = useSpreadsheetStepsContext(() => props.steps)
const { t } = useUiToolsLocale()

const entries = computed(() =>
  (steps.value?.list ?? []).map((step) => ({
    ...step,
    hintText: resolveTextValue(
      step.hint,
      step.builtIn ? t(`spreadsheet.stepHints.${step.builtIn}`) : '',
    ),
    labelText: resolveTextValue(
      step.label,
      step.builtIn ? t(`spreadsheet.steps.${step.builtIn}`) : step.key,
    ),
  })),
)

function open(step: SpreadsheetStepStatus) {
  if (step.state === 'done') steps.value?.goTo(step.key)
}

function markerClass(state: SpreadsheetStepState) {
  return {
    current: 'border-primary bg-primary text-[var(--nut-sheet-accent-fg,var(--ui-text-inverted))]',
    done: 'border-inverted bg-inverted text-inverted',
    skipped: 'border-transparent bg-accented text-muted',
    upcoming: 'border-accented bg-default text-muted',
  }[state]
}
</script>

<template>
  <ol
    v-if="orientation === 'vertical'"
    data-spreadsheet-stepper="vertical"
    class="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible"
  >
    <li v-for="entry in entries" :key="entry.key" class="shrink-0 lg:shrink">
      <button
        type="button"
        class="flex w-full items-start gap-3 rounded-lg p-2.5 text-start transition-colors"
        :class="[
          entry.state === 'current' ? 'bg-default shadow-xs ring-1 ring-default' : '',
          entry.state === 'done' ? 'cursor-pointer hover:bg-default/60' : 'cursor-default',
          compact ? 'lg:justify-center' : '',
        ]"
        :aria-current="entry.state === 'current' ? 'step' : undefined"
        :tabindex="entry.state === 'done' ? 0 : -1"
        :title="compact ? entry.labelText : undefined"
        @click="open(entry)"
      >
        <span
          class="grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] text-[11.5px] font-semibold tabular-nums"
          :class="markerClass(entry.state)"
        >
          <UIcon
            v-if="entry.state === 'done' || entry.state === 'skipped'"
            name="i-lucide-check"
            class="size-3"
          />
          <template v-else>{{ entry.position }}</template>
        </span>
        <span class="grid min-w-0 gap-px pt-0.5" :class="compact ? 'lg:sr-only' : ''">
          <span
            class="flex items-baseline gap-1.5 text-[13.5px] leading-5 whitespace-nowrap"
            :class="{
              'font-semibold text-highlighted': entry.state === 'current',
              'font-medium text-toned': entry.state === 'done',
              'font-medium text-muted': entry.state === 'upcoming' || entry.state === 'skipped',
            }"
          >
            {{ entry.labelText }}
            <small v-if="entry.skipped" class="text-[11px] font-normal text-dimmed">{{
              t('spreadsheet.steps.auto')
            }}</small>
          </span>
          <span v-if="entry.hintText" class="hidden text-xs leading-4 text-dimmed lg:block">{{
            entry.hintText
          }}</span>
        </span>
      </button>
    </li>
  </ol>
  <ol v-else data-spreadsheet-stepper="horizontal" class="flex border-b border-default">
    <li
      v-for="entry in entries"
      :key="entry.key"
      class="min-w-0 flex-1"
      :class="entry.state === 'current' ? 'max-sm:flex-[3]' : ''"
    >
      <button
        type="button"
        class="relative flex w-full items-center gap-2 pb-3 text-start text-sm"
        :class="[
          entry.state === 'current' ? 'font-semibold text-highlighted' : 'text-muted',
          entry.state === 'done'
            ? 'cursor-pointer text-toned hover:text-highlighted'
            : 'cursor-default',
        ]"
        :aria-current="entry.state === 'current' ? 'step' : undefined"
        :tabindex="entry.state === 'done' ? 0 : -1"
        @click="open(entry)"
      >
        <span
          class="grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] text-[11px] font-semibold tabular-nums"
          :class="markerClass(entry.state)"
        >
          <UIcon
            v-if="entry.state === 'done' || entry.state === 'skipped'"
            name="i-lucide-check"
            class="size-3"
          />
          <template v-else>{{ entry.position }}</template>
        </span>
        <span class="truncate" :class="entry.state === 'current' ? 'inline' : 'hidden sm:inline'">{{
          entry.labelText
        }}</span>
        <span
          v-if="entry.state === 'current'"
          class="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
        />
      </button>
    </li>
  </ol>
</template>
