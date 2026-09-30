<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useSpreadsheetImporter } from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetImporter } from '../../types'
import { downloadSpreadsheetBlob } from '../../utils'

const props = defineProps<{
  importer?: SpreadsheetImporter
  label?: string
  /** File name, without extension. Defaults to the schema key. */
  filename?: string
}>()
const importer = useSpreadsheetImporter(() => props.importer)
const { t } = useUiToolsLocale()

function download() {
  downloadSpreadsheetBlob(
    importer.value.template(),
    `${props.filename ?? importer.value.schema.key}.xlsx`,
  )
}
</script>

<template>
  <UButton
    data-spreadsheet-template
    color="neutral"
    variant="ghost"
    size="sm"
    icon="i-lucide-download"
    :label="label ?? t('spreadsheet.file.template')"
    @click="download"
  />
</template>
