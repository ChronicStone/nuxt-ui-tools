<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import type { UiToolsLocale, UiToolsMessages } from '#ui-tools/i18n'

import { useSpreadsheetSteps } from '../composables/use-spreadsheet-steps'
import type { SpreadsheetImporter, SpreadsheetStep } from '../types'
import SpreadsheetImportRoot from './spreadsheet-import-root.vue'
import SpreadsheetImportStepNav from './steps/spreadsheet-import-step-nav.vue'
import SpreadsheetImportStep from './steps/spreadsheet-import-step.vue'
import SpreadsheetImportStepper from './steps/spreadsheet-import-stepper.vue'

/**
 * A ready-made import wizard built from the public parts: file, columns and values when needed,
 * review, and import. Pass `steps` to reorder them or add your own; a slot named after a step key
 * replaces its content.
 */
const props = defineProps<{
  importer: SpreadsheetImporter
  steps?: readonly SpreadsheetStep[]
  title?: string
  closable?: boolean
  locale?: UiToolsLocale<UiToolsMessages>
}>()
const emit = defineEmits<{ close: [] }>()
const { t } = useUiToolsLocale()
const wizard = useSpreadsheetSteps(props.importer, props.steps)
</script>

<template>
  <SpreadsheetImportRoot :importer="importer" :steps="wizard" :locale="locale">
    <div
      data-spreadsheet-import
      class="grid min-w-0 overflow-hidden rounded-xl border border-default bg-default"
    >
      <div class="grid gap-5 px-5 pt-5 sm:px-7">
        <div class="flex min-w-0 items-center gap-3">
          <h2 class="truncate text-base font-semibold text-highlighted">
            {{ title ?? t('spreadsheet.steps.submit') }}
          </h2>
          <span v-if="importer.file.name" class="hidden truncate text-sm text-muted sm:inline">{{
            importer.file.name
          }}</span>
          <UButton
            v-if="closable"
            class="ms-auto"
            color="neutral"
            variant="ghost"
            size="sm"
            square
            icon="i-lucide-x"
            :aria-label="t('spreadsheet.nav.close')"
            @click="emit('close')"
          />
        </div>
        <SpreadsheetImportStepper />
      </div>
      <div class="min-w-0 px-5 py-6 sm:px-7">
        <SpreadsheetImportStep headings>
          <template v-for="(_, name) in $slots" #[name]="scope">
            <slot :name="name" v-bind="scope" />
          </template>
        </SpreadsheetImportStep>
      </div>
      <div class="border-t border-default bg-elevated/40 px-5 py-4 sm:px-7">
        <SpreadsheetImportStepNav :closable="closable" @close="emit('close')" />
      </div>
    </div>
  </SpreadsheetImportRoot>
</template>
