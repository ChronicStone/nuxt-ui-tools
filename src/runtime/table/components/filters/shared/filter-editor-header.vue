<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import type { DataListFilterEditorUi } from '../../../types'
import { mergeDataListUiClass } from '../../../utils'

defineProps<{
  label: string
  active?: boolean
  embedded?: boolean
  ui?: DataListFilterEditorUi
}>()

const emit = defineEmits<{
  back: []
  clear: []
}>()

const { t } = useUiToolsLocale()
</script>

<template>
  <div
    :class="
      mergeDataListUiClass(
        'nut-dl-editor__head flex items-center gap-2 border-b border-default py-2 pr-3',
        embedded ? 'pl-1.5' : 'pl-3',
        ui?.editorHeader,
      )
    "
  >
    <button
      v-if="embedded"
      type="button"
      class="nut-dl-editor__back flex size-6 items-center justify-center rounded-md text-muted outline-none hover:bg-elevated hover:text-default focus-visible:ring-2 focus-visible:ring-primary/40"
      :aria-label="t('table.filters.sheet.back')"
      @click="emit('back')"
    >
      <UIcon name="i-lucide-arrow-left" class="size-4" />
    </button>
    <span class="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-highlighted">
      {{ label }}
    </span>
    <button
      type="button"
      class="nut-dl-editor__clear rounded text-[12.5px] font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40"
      :disabled="!active"
      @click="emit('clear')"
    >
      {{ t('table.filters.editor.clear') }}
    </button>
  </div>
</template>
