<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide } from 'vue'

import { provideFilePreview } from '../../composables/use-file-preview-api'
import { filePreviewMarkdownKey } from '../../composables/use-file-preview-shell'
import type { FilePreviewMarkdownRenderer } from '../../types'
import FilePreviewHost from './file-preview-host.vue'

const { markdown = null } = defineProps<{
  /**
   * Renders markdown files as HTML in the markdown preview. It must return sanitized HTML. Without
   * it, markdown files show their source.
   */
  markdown?: FilePreviewMarkdownRenderer | null
}>()

const filePreview = provideFilePreview()
const { instances } = filePreview
let detach: (() => void) | null = null

provide(filePreviewMarkdownKey, markdown)
onMounted(() => {
  detach = filePreview.attach()
})
onBeforeUnmount(() => detach?.())
</script>

<template>
  <slot />

  <FilePreviewHost v-for="instance in instances" :key="instance.id" :instance="instance" />
</template>
