<script setup lang="ts">
import { computed } from 'vue'

import { provideUiToolsLocale, useUiToolsLocaleRef } from '#ui-tools/i18n'
import type { UiToolsLocale, UiToolsMessages } from '#ui-tools/i18n'

import { provideSpreadsheetImport } from '../composables/use-spreadsheet-import-context'
import type { SpreadsheetImporter, SpreadsheetSteps } from '../types'

/**
 * Provides an importer (and its steps, for a wizard) to every `SpreadsheetImport*` part inside.
 * Renders nothing of its own.
 */
const props = defineProps<{
  importer: SpreadsheetImporter
  steps?: SpreadsheetSteps
  locale?: UiToolsLocale<UiToolsMessages>
}>()

provideUiToolsLocale(useUiToolsLocaleRef(computed(() => props.locale)))
provideSpreadsheetImport({
  get importer() {
    return props.importer
  },
  get steps() {
    return props.steps ?? null
  },
})
</script>

<template>
  <slot />
</template>
