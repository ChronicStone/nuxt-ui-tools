<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useTimeoutFn } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import type { useFilePreviewSource } from '../../composables/use-file-preview-source'
import type {
  FilePreviewContainer,
  FilePreviewDetail,
  FilePreviewItem,
  FilePreviewRendererDefinition,
  FilePreviewRendererError,
} from '../../types'
import { filePreviewRendererComponent } from '../../utils/renderers'
import FilePreviewMessage from './file-preview-message.vue'

const props = defineProps<{
  item: FilePreviewItem
  display: FilePreviewItem
  renderer: FilePreviewRendererDefinition
  source: ReturnType<typeof useFilePreviewSource>
  container: FilePreviewContainer
  kindLabel: string
  arrows: { previous: boolean; next: boolean } | null
}>()

const emit = defineEmits<{
  ready: [details: readonly FilePreviewDetail[]]
  previous: []
  next: []
  download: []
}>()

const { t } = useUiToolsLocale()
const failure = shallowRef<FilePreviewRendererError | null>(null)
const ready = ref<boolean>(false)
const slow = ref<boolean>(false)
const attempt = ref<number>(0)
const delay = useTimeoutFn(() => (slow.value = true), 150, { immediate: false })
const component = computed(() => filePreviewRendererComponent(props.renderer))
const converted = computed(() => props.display !== props.item)
const downloadable = computed(() => props.item.file.download !== false)
const extension = computed(() => (props.display.extension ?? props.kindLabel).toUpperCase())

function restart() {
  failure.value = null
  ready.value = false
  slow.value = false
  delay.start()
}

watch(() => [props.display.key, props.source.url.value], restart, { immediate: true })

function handleReady(details?: readonly FilePreviewDetail[]) {
  ready.value = true
  delay.stop()
  emit('ready', details ?? [])
}

function handleError(error: FilePreviewRendererError) {
  failure.value = error
  delay.stop()
}

function retry() {
  attempt.value += 1
  restart()
  if (props.source.retryable.value) void props.source.retry()
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col" data-file-preview-stage="" :data-kind="display.kind">
    <div
      v-if="converted"
      class="flex shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-default bg-elevated px-4 py-2 text-[12.5px] text-toned"
      data-file-preview-converted=""
    >
      <UIcon name="i-lucide-repeat" class="size-3.5 text-muted" aria-hidden="true" />
      <span>
        <b class="font-semibold text-highlighted">{{ t('filePreview.converted.title') }}.</b>
        {{ t('filePreview.converted.description', { kind: kindLabel }) }}
      </span>
      <UButton
        v-if="downloadable"
        :label="t('filePreview.converted.download')"
        color="neutral"
        variant="link"
        size="xs"
        class="ms-auto p-0 font-semibold"
        @click="emit('download')"
      />
    </div>

    <div class="relative min-h-0 flex-1 overflow-hidden bg-(--nut-fp-stage)">
      <div
        v-if="source.status.value === 'loading'"
        class="grid size-full place-items-center p-8"
        data-file-preview-loading=""
      >
        <span
          class="h-2/3 w-2/3 max-w-2xl animate-pulse rounded-md bg-accented"
          aria-hidden="true"
        />
      </div>

      <FilePreviewMessage
        v-else-if="source.status.value === 'error'"
        icon="i-lucide-triangle-alert"
        tone="error"
        :title="t('filePreview.errors.sourceTitle')"
        :description="t('filePreview.errors.sourceDescription')"
        :detail="source.error.value?.message"
      >
        <UButton
          v-if="source.retryable.value"
          icon="i-lucide-refresh-cw"
          :label="t('filePreview.retry')"
          data-file-preview-retry=""
          @click="retry"
        />
        <UButton
          v-if="downloadable"
          icon="i-lucide-download"
          :label="t('filePreview.download')"
          color="neutral"
          variant="outline"
          @click="emit('download')"
        />
      </FilePreviewMessage>

      <FilePreviewMessage
        v-else-if="failure"
        :icon="renderer.icon"
        :badge="display.extension?.toUpperCase()"
        tone="error"
        :title="t('filePreview.errors.decodeTitle', { extension })"
        :description="t('filePreview.errors.decodeDescription')"
        :detail="failure.message"
      >
        <UButton
          v-if="downloadable"
          icon="i-lucide-download"
          :label="t('filePreview.download')"
          @click="emit('download')"
        />
      </FilePreviewMessage>

      <component
        :is="component"
        v-else-if="source.url.value"
        :key="`${display.key}:${attempt}`"
        :file="display"
        :url="source.url.value"
        :blob="source.blob.value"
        :container="container"
        @ready="handleReady"
        @error="handleError"
      />

      <div
        v-if="slow && !ready && !failure && source.status.value !== 'error'"
        class="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden"
        aria-hidden="true"
      >
        <span class="nut-fp-progress block h-full w-1/3 bg-primary" />
      </div>

      <template v-if="arrows">
        <button
          v-if="arrows.previous"
          type="button"
          class="absolute top-1/2 left-3.5 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-default bg-default/90 text-highlighted shadow-md backdrop-blur-sm transition hover:bg-default"
          :aria-label="t('filePreview.previous')"
          @click="emit('previous')"
        >
          <UIcon name="i-lucide-chevron-left" class="size-5" />
        </button>
        <button
          v-if="arrows.next"
          type="button"
          class="absolute top-1/2 right-3.5 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-default bg-default/90 text-highlighted shadow-md backdrop-blur-sm transition hover:bg-default"
          :aria-label="t('filePreview.next')"
          @click="emit('next')"
        >
          <UIcon name="i-lucide-chevron-right" class="size-5" />
        </button>
      </template>

      <slot />
    </div>
  </div>
</template>
