<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useSpreadsheetImporter } from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetImporter } from '../../types'
import { downloadSpreadsheetBlob } from '../../utils'

const props = defineProps<{ importer?: SpreadsheetImporter; label?: string }>()
const importer = useSpreadsheetImporter(() => props.importer)
const { t } = useUiToolsLocale()
const count = computed(() => importer.value.rows.invalid.length)

function download() {
  const base = importer.value.file.name.replace(/\.[^.]+$/u, '') || importer.value.schema.key
  downloadSpreadsheetBlob(
    importer.value.rows.exportInvalid(),
    `${base}-${t('spreadsheet.review.export').toLowerCase().replaceAll(' ', '-')}.xlsx`,
  )
}
</script>

<template>
  <UButton
    v-if="count"
    data-spreadsheet-export
    color="neutral"
    variant="outline"
    size="sm"
    icon="i-lucide-download"
    :label="label ?? `${t('spreadsheet.review.export')} · ${count}`"
    @click="download"
  />
</template>
