<script setup lang="ts">
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'
import { refDebounced } from '@vueuse/core'
import { computed, shallowRef, watch } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import type {
  SpreadsheetResolvedOption,
  SpreadsheetValueAnswer,
  SpreadsheetValueQuestion,
} from '../../types'

const props = defineProps<{
  question: SpreadsheetValueQuestion
  choices: readonly SpreadsheetResolvedOption[]
  search: (text: string) => Promise<readonly SpreadsheetResolvedOption[]>
}>()
const emit = defineEmits<{ answer: [answer: SpreadsheetValueAnswer] }>()
const { t } = useUiToolsLocale()

const term = shallowRef<string>('')
const debounced = refDebounced(term, 250)
const found = shallowRef<readonly SpreadsheetResolvedOption[]>([])
const searching = shallowRef<boolean>(false)

watch(debounced, async (text) => {
  if (!props.question.remote) return
  searching.value = true
  try {
    found.value = await props.search(text)
  } finally {
    searching.value = false
  }
})

const options = computed(() => {
  const list = props.question.remote ? found.value : props.choices
  const answer = props.question.answer
  if (answer?.action === 'map' && !list.some((option) => option.value === answer.value))
    return [{ aliases: [], label: answer.label, value: answer.value }, ...list]
  return list
})

const items = computed(() => [
  ...options.value.map((option, index) => ({ label: option.label, value: `option:${index}` })),
  { type: 'separator' as const },
  ...(props.question.canCreate
    ? [
        {
          icon: 'i-lucide-plus',
          label: t('spreadsheet.values.create', { value: props.question.value }),
          value: 'action:create',
        },
      ]
    : []),
  {
    icon: 'i-lucide-eraser',
    label: t('spreadsheet.values.leaveEmpty'),
    value: 'action:leave-empty',
  },
  { icon: 'i-lucide-ban', label: t('spreadsheet.values.skipRows'), value: 'action:skip-rows' },
])

const selected = computed(() => {
  const answer = props.question.answer
  if (!answer) return undefined
  if (answer.action !== 'map') return `action:${answer.action}`
  const index = options.value.findIndex((option) => option.value === answer.value)
  return index < 0 ? undefined : `option:${index}`
})

const status = computed(() =>
  props.question.state === 'open'
    ? 'open'
    : props.question.answeredBy === 'policy'
      ? 'policy'
      : 'user',
)

function select(value: string | undefined) {
  if (!value) return
  if (value === 'action:create') emit('answer', { action: 'create' })
  else if (value === 'action:leave-empty') emit('answer', { action: 'leave-empty' })
  else if (value === 'action:skip-rows') emit('answer', { action: 'skip-rows' })
  else {
    const option = options.value[Number(value.slice('option:'.length))]
    if (option) emit('answer', { action: 'map', label: option.label, value: option.value })
  }
}
</script>

<template>
  <div
    :data-spreadsheet-value="question.id"
    :data-state="question.state"
    class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1.15fr)_6.5rem]"
    :class="question.state === 'open' ? 'bg-warning/4' : ''"
  >
    <span
      class="line-clamp-2 min-w-0 font-medium break-words text-highlighted"
      :title="question.value"
      >{{ question.value }}</span
    >
    <span class="text-end text-sm text-muted tabular-nums sm:text-start">{{
      t('spreadsheet.values.rowCount', { count: question.rows.length })
    }}</span>
    <USelectMenu
      v-model:search-term="term"
      :model-value="selected"
      :items="items"
      value-key="value"
      :ignore-filter="question.remote"
      :loading="searching"
      :placeholder="t('spreadsheet.values.choose')"
      :search-input="{ placeholder: t('spreadsheet.values.search') }"
      :color="question.state === 'open' ? 'warning' : 'neutral'"
      :highlight="question.state === 'open'"
      :aria-label="t('spreadsheet.values.valueFor', { value: question.value })"
      class="col-span-2 w-full sm:col-span-1"
      @update:model-value="select"
    />
    <span
      class="hidden h-5.5 items-center justify-self-start rounded-full px-2 text-[11.5px] font-semibold whitespace-nowrap sm:inline-flex"
      :class="{
        'bg-warning/12 text-warning': status === 'open',
        'bg-primary/10 text-primary': status === 'user',
        'bg-elevated text-muted': status === 'policy',
      }"
    >
      {{ t(`spreadsheet.values.statuses.${status}`) }}
    </span>
  </div>
</template>
