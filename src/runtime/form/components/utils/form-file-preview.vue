<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, onScopeDispose, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { fileExtensionLabel, fileIconName, formatFileSize } from '../../../shared/utils/file'

const props = defineProps<{
  file: File
  index: number
  disabled?: boolean
  removeFile: (index?: number) => void
  replace?: () => void
}>()

const { code, t } = useUiToolsLocale()
let previewUrl: string | null = null

const isImage = computed(() => props.file.type.startsWith('image/'))
const preview = computed(() => {
  if (!isImage.value) {
    return null
  }
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl)
  }
  previewUrl = URL.createObjectURL(props.file)
  return previewUrl
})
const icon = computed(() => fileIconName(props.file.type))
const meta = computed(
  () => `${fileExtensionLabel(props.file)} · ${formatFileSize(props.file.size, code.value)}`,
)

watch(
  () => props.file,
  () => {
    if (previewUrl && !isImage.value) {
      URL.revokeObjectURL(previewUrl)
      previewUrl = null
    }
  },
)

onScopeDispose(() => {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl)
  }
})
</script>

<template>
  <div
    class="flex w-full items-center gap-3 rounded-lg border border-default bg-default px-3 py-2"
    data-form-file=""
  >
    <img
      v-if="preview"
      :src="preview"
      :alt="file.name"
      class="size-10 shrink-0 rounded-md border border-default object-cover"
    />
    <span
      v-else
      class="grid size-10 shrink-0 place-items-center rounded-md border border-default bg-elevated text-muted"
    >
      <UIcon :name="icon" class="size-5" aria-hidden="true" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block truncate text-sm font-medium text-highlighted" data-form-file-name="">
        {{ file.name }}
      </span>
      <span class="block text-xs text-muted" data-form-file-meta="">{{ meta }}</span>
    </span>
    <UButton
      v-if="replace"
      size="xs"
      color="neutral"
      variant="ghost"
      icon="i-lucide-refresh-cw"
      :disabled="disabled"
      :aria-label="t('form.fields.file.replace')"
      :title="t('form.fields.file.replace')"
      data-form-file-replace=""
      @click.stop="replace()"
    />
    <UButton
      size="xs"
      color="neutral"
      variant="ghost"
      icon="i-lucide-x"
      :disabled="disabled"
      :aria-label="t('form.fields.file.remove')"
      :title="t('form.fields.file.remove')"
      data-form-file-remove=""
      @click.stop="removeFile(index)"
    />
  </div>
</template>
