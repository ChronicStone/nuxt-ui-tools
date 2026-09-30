<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, shallowRef } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useSpreadsheetImporter } from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetImporter } from '../../types'

const DEFAULT_ACCEPT = ['.xlsx', '.xls', '.csv']

const props = defineProps<{ importer?: SpreadsheetImporter }>()
const importer = useSpreadsheetImporter(() => props.importer)
const { t } = useUiToolsLocale()
const dragging = shallowRef<boolean>(false)

const accept = computed(() => importer.value.schema.file?.accept ?? DEFAULT_ACCEPT)
const hint = computed(() => {
  const types = accept.value.join(', ')
  const max = importer.value.schema.file?.maxRows
  return max
    ? t('spreadsheet.file.dropHint', { count: max.toLocaleString(), types })
    : t('spreadsheet.file.dropHintNoLimit', { types })
})

function load(file: File | undefined) {
  if (file) importer.value.file.load(file)
}

function onDrop(event: DragEvent) {
  dragging.value = false
  load(event.dataTransfer?.files[0])
}

function onChange(event: Event) {
  if (event.target instanceof HTMLInputElement) load(event.target.files?.[0])
}

function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text/plain')
  if (text?.includes('\t') || text?.includes('\n')) importer.value.file.paste(text)
}
</script>

<template>
  <div data-spreadsheet-dropzone class="grid gap-2">
    <slot
      :load="importer.file.load"
      :paste="importer.file.paste"
      :reading="importer.file.reading"
      :error="importer.file.error"
      :accept="accept"
    >
      <label
        tabindex="0"
        class="flex cursor-pointer items-center gap-4 rounded-xl border-[1.5px] border-dashed px-5 py-4.5 transition-colors outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
        :class="
          dragging
            ? 'border-primary bg-primary/6'
            : 'border-accented bg-default hover:border-primary hover:bg-primary/3'
        "
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="onDrop"
        @paste="onPaste"
      >
        <span
          class="grid size-11 shrink-0 place-items-center rounded-lg bg-elevated text-muted"
          aria-hidden="true"
        >
          <span
            v-if="importer.file.reading"
            class="size-4.5 animate-spin rounded-full border-2 border-accented border-t-primary"
          />
          <UIcon v-else name="i-lucide-file-up" class="size-5" />
        </span>
        <span class="grid min-w-0 gap-0.5">
          <span class="font-medium text-highlighted">
            {{ t('spreadsheet.file.dropTitle') }}
            <span class="text-primary underline decoration-primary/40 underline-offset-2">{{
              t('spreadsheet.file.dropBrowse')
            }}</span>
          </span>
          <span class="text-sm text-muted">{{ hint }}</span>
        </span>
        <input type="file" class="sr-only" :accept="accept.join(',')" @change="onChange" />
      </label>
      <p v-if="importer.file.error" class="flex items-center gap-1.5 text-sm text-error">
        <UIcon name="i-lucide-circle-x" class="size-4 shrink-0" />
        {{ t('spreadsheet.file.readFailed') }}
      </p>
      <p v-else class="text-xs text-dimmed">{{ t('spreadsheet.file.paste') }}</p>
    </slot>
  </div>
</template>
