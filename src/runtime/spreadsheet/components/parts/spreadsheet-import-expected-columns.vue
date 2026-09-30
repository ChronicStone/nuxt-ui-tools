<script setup lang="ts">
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useSpreadsheetImporter } from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetFieldState, SpreadsheetImporter } from '../../types'

const props = defineProps<{ importer?: SpreadsheetImporter }>()
defineSlots<{
  column?: (props: { field: SpreadsheetFieldState }) => unknown
  actions?: () => unknown
}>()
const importer = useSpreadsheetImporter(() => props.importer)
const { t } = useUiToolsLocale()

const fields = computed(() => importer.value.columns.fields.filter((field) => !field.from))
const hasDynamic = computed(() => fields.value.some((field) => field.group?.dynamic))
</script>

<template>
  <div v-if="fields.length" data-spreadsheet-expected-columns class="grid gap-2.5">
    <div class="flex items-center gap-2">
      <span class="text-[11px] font-semibold tracking-[0.08em] text-dimmed uppercase">
        {{ t('spreadsheet.file.expected') }}
      </span>
      <span class="text-xs text-dimmed tabular-nums"
        >· {{ t('spreadsheet.file.expectedCount', { count: fields.length }) }}</span
      >
      <span class="ms-auto"><slot name="actions" /></span>
    </div>
    <ul class="flex flex-wrap gap-1.5">
      <li v-for="field in fields" :key="field.path" :title="field.description || field.label">
        <slot name="column" :field="field">
          <span
            class="inline-flex h-6 items-center gap-1 rounded-md px-2 text-[12px] font-medium whitespace-nowrap"
            :class="
              field.group?.dynamic
                ? 'bg-primary/10 text-primary'
                : field.required
                  ? 'bg-elevated text-toned ring-1 ring-default ring-inset'
                  : 'text-muted ring-1 ring-default ring-inset'
            "
          >
            {{ field.name }}
            <span v-if="!field.required && !field.group?.dynamic" class="font-normal text-dimmed">
              · {{ t('spreadsheet.file.optional') }}
            </span>
          </span>
        </slot>
      </li>
    </ul>
    <p v-if="hasDynamic" class="text-xs text-dimmed">{{ t('spreadsheet.file.fromContext') }}</p>
  </div>
</template>
