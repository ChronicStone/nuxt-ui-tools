<script setup lang="ts">
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useSpreadsheetImporter } from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetImporter } from '../../types'
import SpreadsheetImportStat from './spreadsheet-import-stat.vue'

const props = defineProps<{ importer?: SpreadsheetImporter }>()
defineSlots<{
  default?: (props: {
    importable: number
    invalid: number
    discarded: number
    byMode: { create: number; update: number; skip: number }
  }) => unknown
  extra?: () => unknown
}>()
const importer = useSpreadsheetImporter(() => props.importer)
const { t } = useUiToolsLocale()

const rows = computed(() => importer.value.rows)
const warnings = computed(() => rows.value.importable.filter((row) => row.warnings.length).length)
const blocking = computed(() =>
  rows.value.invalid.reduce((total, row) => total + row.errors.length, 0),
)
const importableHint = computed(() => {
  if (rows.value.byMode.update)
    return `${t('spreadsheet.stats.create', { count: rows.value.byMode.create })} · ${t('spreadsheet.stats.update', { count: rows.value.byMode.update })}`
  return warnings.value ? t('spreadsheet.stats.warnings', { count: warnings.value }) : undefined
})
</script>

<template>
  <div
    data-spreadsheet-stats
    class="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]"
  >
    <slot
      :importable="rows.importable.length"
      :invalid="rows.invalid.length"
      :discarded="rows.discarded.length"
      :by-mode="rows.byMode"
    >
      <SpreadsheetImportStat
        :value="rows.importable.length"
        :label="t('spreadsheet.stats.importable')"
        :hint="importableHint"
        tone="success"
      />
      <SpreadsheetImportStat
        :value="rows.invalid.length"
        :label="t('spreadsheet.stats.invalid')"
        :hint="blocking ? t('spreadsheet.stats.blocking', { count: blocking }) : undefined"
        :tone="rows.invalid.length ? 'error' : 'neutral'"
      />
      <SpreadsheetImportStat
        v-if="rows.discarded.length"
        :value="rows.discarded.length"
        :label="t('spreadsheet.stats.discarded')"
      />
    </slot>
    <slot name="extra" />
  </div>
</template>
