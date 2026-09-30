<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import {
  useSpreadsheetImporter,
  useSpreadsheetStepsContext,
} from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetImporter, SpreadsheetSteps } from '../../types'
import SpreadsheetImportSubmitButton from '../parts/spreadsheet-import-submit-button.vue'

const props = defineProps<{
  importer?: SpreadsheetImporter
  steps?: SpreadsheetSteps
  /** Page the Cancel button of the first step goes to. */
  cancelTo?: string
  /** Shows Cancel on the first step and Close after the import, emitting `close`. */
  closable?: boolean
}>()
const emit = defineEmits<{ close: [] }>()
const importer = useSpreadsheetImporter(() => props.importer)
const steps = useSpreadsheetStepsContext(() => props.steps)
const { t } = useUiToolsLocale()

const step = computed(() => steps.value?.step ?? null)
const submitting = computed(() => step.value?.builtIn === 'submit')
const status = computed(() => importer.value.submit.status)

const hint = computed(() => {
  const current = step.value
  if (!current) return { blocking: false, text: '' }
  if (current.builtIn === 'file' && !importer.value.file.loaded)
    return { blocking: false, text: t('spreadsheet.nav.blockers.file') }
  if (current.builtIn === 'columns' && current.blockers)
    return {
      blocking: true,
      text: t('spreadsheet.nav.blockers.columns', { count: current.blockers }),
    }
  if (current.builtIn === 'values' && current.blockers)
    return {
      blocking: true,
      text: t('spreadsheet.nav.blockers.values', { count: current.blockers }),
    }
  if (current.builtIn === 'review') {
    if (!importer.value.readiness.importable)
      return { blocking: true, text: t('spreadsheet.nav.blockers.review') }
    const invalid = importer.value.readiness.invalidRows
    return {
      blocking: false,
      text: invalid ? t('spreadsheet.nav.blockers.invalid', { count: invalid }) : '',
    }
  }
  return { blocking: false, text: '' }
})

function next() {
  steps.value?.next()
}

function back() {
  steps.value?.back()
}

function another() {
  importer.value.reset()
  steps.value?.reset()
}
</script>

<template>
  <div v-if="steps" data-spreadsheet-step-nav class="flex flex-wrap items-center gap-x-3 gap-y-2">
    <UButton
      v-if="steps.canBack && status !== 'running' && status !== 'done'"
      color="neutral"
      variant="outline"
      icon="i-lucide-arrow-left"
      :label="t('spreadsheet.nav.back')"
      @click="back"
    />
    <UButton
      v-else-if="!steps.canBack && cancelTo"
      color="neutral"
      variant="ghost"
      :to="cancelTo"
      :label="t('spreadsheet.nav.cancel')"
    />
    <UButton
      v-else-if="!steps.canBack && closable"
      color="neutral"
      variant="ghost"
      :label="t('spreadsheet.nav.cancel')"
      @click="emit('close')"
    />
    <span
      v-if="hint.text"
      class="order-last basis-full text-sm sm:order-none sm:ms-auto sm:basis-auto sm:text-end"
      :class="hint.blocking ? 'font-medium text-error' : 'text-muted'"
    >
      {{ hint.text }}
    </span>
    <div class="ms-auto flex gap-2" :class="hint.text ? 'sm:ms-0' : ''">
      <template v-if="submitting">
        <SpreadsheetImportSubmitButton v-if="status === 'idle' || status === 'running'" />
        <template v-else-if="status === 'done'">
          <UButton
            color="neutral"
            variant="outline"
            :label="t('spreadsheet.nav.another')"
            @click="another"
          />
          <UButton v-if="closable" :label="t('spreadsheet.nav.close')" @click="emit('close')" />
          <UButton v-else-if="cancelTo" :to="cancelTo" :label="t('spreadsheet.nav.close')" />
        </template>
      </template>
      <UButton
        v-else
        data-spreadsheet-next
        trailing-icon="i-lucide-arrow-right"
        :label="t('spreadsheet.nav.continue')"
        :disabled="!steps.canNext"
        @click="next"
      />
    </div>
  </div>
</template>
