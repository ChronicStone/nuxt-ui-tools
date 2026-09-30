<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useSpreadsheetImporter } from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetImporter } from '../../types'

const props = defineProps<{ importer?: SpreadsheetImporter; label?: string }>()
const importer = useSpreadsheetImporter(() => props.importer)
const { t } = useUiToolsLocale()
const count = computed(() => importer.value.readiness.importable)

function run() {
  void importer.value.submit.run()
}
</script>

<template>
  <UButton
    data-spreadsheet-submit
    icon="i-lucide-check"
    :label="label ?? t('spreadsheet.nav.import', { count: count.toLocaleString() })"
    :disabled="!importer.readiness.canSubmit || importer.submit.status === 'running'"
    :loading="importer.submit.status === 'running'"
    @click="run"
  />
</template>
