<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import USelect from '@nuxt/ui/components/Select.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import type { SpreadsheetFieldState, SpreadsheetHeaderCell } from '../../types'

const NONE = -1
const props = defineProps<{
  field: SpreadsheetFieldState
  headers: readonly SpreadsheetHeaderCell[]
  suggestions: boolean
}>()
const emit = defineEmits<{ assign: [header: number]; ignore: []; reset: [] }>()
const { t } = useUiToolsLocale()

const items = computed(() => [
  { label: t('spreadsheet.columns.none'), value: NONE },
  ...props.headers
    .filter((header) => header.text)
    .map((header) => ({ label: header.text, value: header.index })),
])
const tone = computed(
  () =>
    ({
      default: 'bg-info',
      matched: props.field.assignedBy === 'user' ? 'bg-primary' : 'bg-success',
      missing: 'bg-error',
      unmatched: 'bg-accented',
    })[props.field.status],
)

function select(value: number) {
  if (value === NONE) emit('ignore')
  else emit('assign', value)
}

function useSuggestion() {
  if (props.field.suggestion) emit('assign', props.field.suggestion.header.index)
}
</script>

<template>
  <div
    :data-spreadsheet-field="field.path"
    :data-status="field.status"
    class="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_minmax(0,1fr)]"
    :class="field.status === 'missing' ? 'bg-error/3' : ''"
  >
    <div class="flex min-w-0 items-center gap-2.5">
      <span class="size-2 shrink-0 rounded-full" :class="tone" />
      <span class="truncate font-medium text-highlighted">{{ field.label }}</span>
      <span v-if="field.required" class="shrink-0 text-error" aria-hidden="true">*</span>
    </div>
    <USelect
      :model-value="field.header?.index ?? NONE"
      :items="items"
      :color="field.status === 'missing' ? 'error' : 'neutral'"
      :highlight="field.status === 'missing'"
      :aria-label="t('spreadsheet.columns.columnFor', { field: field.label })"
      class="w-full"
      @update:model-value="select"
    />
    <div class="min-w-0 text-[12.5px] leading-snug">
      <template v-if="field.status === 'missing' && suggestions && field.suggestion">
        <span class="text-muted">{{
          t('spreadsheet.columns.suggestion', {
            header: field.suggestion.header.text,
            samples: field.suggestion.samples.join(', '),
          })
        }}</span>
        <UButton
          data-spreadsheet-use-suggestion
          variant="link"
          size="xs"
          class="px-1"
          :label="t('spreadsheet.columns.useSuggestion')"
          @click="useSuggestion"
        />
      </template>
      <span v-else-if="field.status === 'missing'" class="font-medium text-error">{{
        t('spreadsheet.columns.statuses.missing')
      }}</span>
      <span v-else-if="field.status === 'default'" class="text-info">{{
        t('spreadsheet.columns.statuses.default')
      }}</span>
      <span v-else-if="field.status === 'unmatched'" class="text-dimmed">{{
        t('spreadsheet.columns.statuses.unmatched')
      }}</span>
      <span v-else class="flex min-w-0 items-center gap-1.5">
        <span class="truncate text-muted">{{
          field.samples.join(' · ') || t('spreadsheet.columns.emptyColumn')
        }}</span>
        <UButton
          v-if="field.assignedBy === 'user'"
          variant="link"
          color="neutral"
          size="xs"
          class="shrink-0 px-0"
          :label="t('spreadsheet.columns.reset')"
          @click="emit('reset')"
        />
      </span>
    </div>
  </div>
</template>
