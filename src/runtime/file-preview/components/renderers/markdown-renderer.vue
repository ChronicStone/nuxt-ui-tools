<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { useFilePreviewShell } from '../../composables/use-file-preview-shell'
import { useFilePreviewText } from '../../composables/use-file-preview-text'
import type { FilePreviewRendererEmits, FilePreviewRendererProps } from '../../types'
import FilePreviewTools from '../shell/file-preview-tools.vue'
import FilePreviewCode from './file-preview-code.vue'
import FilePreviewTextLoading from './file-preview-text-loading.vue'

const props = defineProps<FilePreviewRendererProps>()
const emit = defineEmits<FilePreviewRendererEmits>()

const { t } = useUiToolsLocale()
const shell = useFilePreviewShell()
const content = useFilePreviewText(props)
const view = ref<'preview' | 'source'>(shell.markdown ? 'preview' : 'source')
const html = ref<string | null>(null)
const facts = computed(() => (content.notice.value ? [content.notice.value] : []))

watch(
  content.status,
  async (status) => {
    if (status === 'error')
      emit('error', { message: content.error.value?.message, reason: 'source' })
    if (status !== 'ready') return
    if (shell.markdown) {
      try {
        html.value = await shell.markdown(content.text.value)
      } catch {
        view.value = 'source'
      }
    }
    emit('ready')
  },
  { immediate: true },
)
</script>

<template>
  <template v-if="content.status.value === 'ready'">
    <div
      v-if="view === 'preview' && html !== null"
      class="absolute inset-0 overflow-auto bg-default px-6 py-7 sm:px-10"
      data-file-preview-markdown=""
    >
      <!-- eslint-disable-next-line vue/no-v-html -- the app's markdown renderer returns sanitized HTML -->
      <article class="nut-fp-prose mx-auto max-w-[68ch]" v-html="html" />
    </div>
    <FilePreviewCode
      v-else
      :text="content.text.value"
      :json="false"
      :facts="facts"
      :tools="view === 'source'"
    />

    <FilePreviewTools v-if="shell.markdown">
      <div class="flex gap-0.5 rounded-md border border-default bg-elevated p-0.5" role="group">
        <button
          v-for="option in ['preview', 'source'] as const"
          :key="option"
          type="button"
          :aria-pressed="view === option"
          :class="[
            'rounded px-2 py-0.5 text-xs font-medium transition',
            view === option
              ? 'bg-default text-highlighted shadow-xs ring ring-default'
              : 'text-muted hover:text-highlighted',
          ]"
          @click="view = option"
        >
          {{ t(`filePreview.markdown.${option}`) }}
        </button>
      </div>
    </FilePreviewTools>
  </template>
  <FilePreviewTextLoading v-else />
</template>
