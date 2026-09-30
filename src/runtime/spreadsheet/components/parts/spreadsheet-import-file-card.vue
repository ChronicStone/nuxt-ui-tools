<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useSpreadsheetImporter } from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetImporter } from '../../types'

const props = defineProps<{ importer?: SpreadsheetImporter }>()
const importer = useSpreadsheetImporter(() => props.importer)
const { t } = useUiToolsLocale()

const extension = computed(
  () => importer.value.file.name.split('.').pop()?.toUpperCase().slice(0, 4) || 'XLSX',
)
const summary = computed(() =>
  t('spreadsheet.file.summary', {
    rows: importer.value.rows.all.length.toLocaleString(),
    sheets: importer.value.file.sheets.length,
  }),
)
</script>

<template>
  <div
    v-if="importer.file.loaded"
    data-spreadsheet-file-card
    class="flex items-center gap-3.5 rounded-xl border border-default bg-default px-4 py-3"
  >
    <span
      class="grid h-11 w-9.5 shrink-0 place-items-center rounded-md bg-success/10 text-[10px] font-bold tracking-wide text-success"
    >
      {{ extension }}
    </span>
    <div class="grid min-w-0">
      <span class="truncate font-medium text-highlighted">{{ importer.file.name }}</span>
      <span class="text-sm text-muted tabular-nums">{{ summary }}</span>
    </div>
    <div class="ms-auto flex shrink-0 items-center gap-2">
      <slot name="actions" />
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        icon="i-lucide-refresh-cw"
        :label="t('spreadsheet.file.replace')"
        @click="importer.file.clear()"
      />
    </div>
  </div>
</template>
