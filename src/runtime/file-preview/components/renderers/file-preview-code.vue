<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { tintFilePreviewJsonLine } from '../../utils/format'
import FilePreviewButton from '../shell/file-preview-button.vue'
import FilePreviewTools from '../shell/file-preview-tools.vue'

const {
  json,
  text,
  tools = true,
} = defineProps<{
  text: string
  json: boolean
  facts: readonly string[]
  tools?: boolean
}>()

const { t } = useUiToolsLocale()
const wrap = ref<boolean>(false)
const clipboard = useClipboard({ copiedDuring: 1500, legacy: true })
const source = computed(() => {
  if (!json) return { formatted: false, text }
  try {
    return { formatted: true, text: JSON.stringify(JSON.parse(text), null, 2) }
  } catch {
    return { formatted: false, text }
  }
})
const lines = computed(() => source.value.text.split(/\r?\n/u))
const tinted = computed(() =>
  source.value.formatted ? lines.value.map(tintFilePreviewJsonLine) : null,
)
</script>

<template>
  <div class="absolute inset-0 flex flex-col bg-default" data-file-preview-code="">
    <div
      class="nut-fp-code min-h-0 flex-1 overflow-auto font-mono text-[12.5px] leading-[1.65] text-default [tab-size:2]"
    >
      <div :class="['py-2.5', wrap ? '' : 'min-w-max']">
        <div v-for="(line, position) in lines" :key="position" class="flex">
          <span
            class="sticky left-0 w-13 shrink-0 bg-default pe-3.5 text-end text-dimmed tabular-nums select-none"
            aria-hidden="true"
          >
            {{ position + 1 }}
          </span>
          <!-- eslint-disable-next-line vue/no-v-html -- each line is escaped before tinting -->
          <span
            v-if="tinted"
            :class="['pe-6', wrap ? 'break-all whitespace-pre-wrap' : 'whitespace-pre']"
            v-html="tinted[position] || ' '"
          />
          <span v-else :class="['pe-6', wrap ? 'break-all whitespace-pre-wrap' : 'whitespace-pre']">
            {{ line || ' ' }}
          </span>
        </div>
      </div>
    </div>
    <div
      class="flex shrink-0 flex-wrap gap-x-3.5 gap-y-1 border-t border-default bg-elevated px-3.5 py-1.5 text-[11.5px] text-muted tabular-nums"
      data-file-preview-facts=""
    >
      <span>{{ t('filePreview.text.lines', { count: lines.length.toLocaleString() }) }}</span>
      <span v-if="source.formatted">{{ t('filePreview.text.formatted') }}</span>
      <span v-for="fact in facts" :key="fact">{{ fact }}</span>
    </div>

    <FilePreviewTools v-if="tools">
      <FilePreviewButton
        icon="i-lucide-wrap-text"
        :label="t('filePreview.text.wrap')"
        :pressed="wrap"
        @click="wrap = !wrap"
      />
      <FilePreviewButton
        :icon="clipboard.copied.value ? 'i-lucide-check' : 'i-lucide-copy'"
        :label="clipboard.copied.value ? t('filePreview.text.copied') : t('filePreview.text.copy')"
        @click="clipboard.copy(source.text)"
      />
    </FilePreviewTools>
  </div>
</template>
