<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, onScopeDispose, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'

const props = defineProps<{
  file: File
  index: number
  disabled?: boolean
  removeFile: (index?: number) => void
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
const icon = computed(() => fileIcon(props.file.type))
const meta = computed(() => `${extension(props.file)} · ${formatSize(props.file.size)}`)

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

function fileIcon(type: string) {
  if (type === 'application/pdf') {
    return 'i-lucide-file-text'
  }
  if (type.includes('spreadsheet') || type.includes('excel') || type === 'text/csv') {
    return 'i-lucide-file-spreadsheet'
  }
  if (type.includes('word') || type.includes('document')) {
    return 'i-lucide-file-type'
  }
  if (type.includes('zip') || type.includes('compressed')) {
    return 'i-lucide-file-archive'
  }
  return 'i-lucide-file'
}

function extension(file: File) {
  const dot = file.name.lastIndexOf('.')
  return dot === -1 ? file.type || '—' : file.name.slice(dot + 1).toUpperCase()
}

function formatSize(bytes: number) {
  const units = ['o', 'Ko', 'Mo', 'Go']
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  let digits = 0
  if (unit > 0 && size < 10) {
    digits = 1
  }
  const formatted = new Intl.NumberFormat(code.value, { maximumFractionDigits: digits }).format(
    size,
  )
  return `${formatted} ${units[unit]}`
}
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
