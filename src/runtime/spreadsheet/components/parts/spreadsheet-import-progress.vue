<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UProgress from '@nuxt/ui/components/Progress.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import {
  useSpreadsheetImporter,
  useSpreadsheetStepsContext,
} from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetImporter } from '../../types'

const props = defineProps<{ importer?: SpreadsheetImporter }>()
defineSlots<{ done?: (props: { imported: number }) => unknown }>()
const importer = useSpreadsheetImporter(() => props.importer)
const steps = useSpreadsheetStepsContext()
const { t } = useUiToolsLocale()

const submit = computed(() => importer.value.submit)
const percent = computed(() =>
  submit.value.progress.total
    ? Math.round((submit.value.progress.done / submit.value.progress.total) * 100)
    : 0,
)

function retry() {
  void importer.value.submit.retryRejected()
}

function tryAgain() {
  void importer.value.submit.run()
}

function review() {
  importer.value.review.setTab('invalid')
  steps.value?.goTo('review')
}
</script>

<template>
  <div
    v-if="submit.status !== 'idle'"
    data-spreadsheet-progress
    class="grid justify-items-center gap-3.5 py-6 text-center"
  >
    <template v-if="submit.status === 'running'">
      <div class="text-4xl font-light tracking-tight text-highlighted tabular-nums">
        {{
          t('spreadsheet.progress.count', {
            done: submit.progress.done,
            total: submit.progress.total,
          })
        }}
      </div>
      <UProgress :model-value="percent" class="w-full max-w-md" />
      <p class="text-muted">{{ t('spreadsheet.progress.running') }}</p>
    </template>
    <template v-else-if="submit.status === 'done'">
      <span class="grid size-12 place-items-center rounded-full bg-success/10 text-success">
        <UIcon name="i-lucide-check" class="size-6" />
      </span>
      <h3 class="text-xl font-semibold text-highlighted">
        {{ t('spreadsheet.progress.done', { count: submit.imported.toLocaleString() }) }}
      </h3>
      <p v-if="!submit.rejected.length" class="text-muted">
        {{ t('spreadsheet.progress.doneHint') }}
      </p>
      <div
        v-else
        class="grid max-w-md gap-2 rounded-xl border border-error/30 bg-error/4 px-4 py-3 text-start"
      >
        <b class="text-sm font-semibold text-error">{{
          t('spreadsheet.progress.rejected', { count: submit.rejected.length })
        }}</b>
        <p class="text-sm text-muted">{{ t('spreadsheet.progress.rejectedHint') }}</p>
        <div class="flex flex-wrap gap-2">
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            :label="t('spreadsheet.progress.retry')"
            @click="retry"
          />
          <UButton
            v-if="steps"
            size="sm"
            color="neutral"
            variant="ghost"
            :label="t('spreadsheet.progress.review')"
            @click="review"
          />
        </div>
      </div>
      <slot name="done" :imported="submit.imported" />
    </template>
    <template v-else>
      <span class="grid size-12 place-items-center rounded-full bg-error/10 text-error">
        <UIcon name="i-lucide-circle-x" class="size-6" />
      </span>
      <h3 class="text-lg font-semibold text-highlighted">{{ t('spreadsheet.progress.error') }}</h3>
      <p v-if="submit.error instanceof Error" class="max-w-md text-sm text-muted">
        {{ submit.error.message }}
      </p>
      <UButton :label="t('spreadsheet.progress.tryAgain')" @click="tryAgain" />
    </template>
  </div>
</template>
