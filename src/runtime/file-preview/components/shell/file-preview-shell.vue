<script setup lang="ts">
import { useEventListener, useSwipe } from '@vueuse/core'
import {
  computed,
  inject,
  nextTick,
  onMounted,
  provide,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue'
import { routerKey } from 'vue-router'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { formatFileSize } from '../../../shared/utils/file'
import { useFilePreview } from '../../composables/use-file-preview-api'
import {
  filePreviewMarkdownKey,
  filePreviewShellKey,
  isFilePreviewControlKey,
} from '../../composables/use-file-preview-shell'
import { useFilePreviewSource } from '../../composables/use-file-preview-source'
import type {
  FilePreviewAction,
  FilePreviewContainer,
  FilePreviewDetail,
  FilePreviewInstance,
  FilePreviewItem,
} from '../../types'
import { downloadFilePreviewItem, openFilePreviewItem } from '../../utils/download'
import { formatFilePreviewDate, resolveFilePreviewText } from '../../utils/format'
import { filePreviewKindLabel, findFilePreviewRenderer } from '../../utils/renderers'
import FilePreviewButton from './file-preview-button.vue'
import FilePreviewDetails from './file-preview-details.vue'
import FilePreviewHeader from './file-preview-header.vue'
import FilePreviewStage from './file-preview-stage.vue'
import FilePreviewThumb from './file-preview-thumb.vue'

const props = defineProps<{
  instance: FilePreviewInstance
  container: FilePreviewContainer
  narrow: boolean
  canExpand: boolean
  expanded: boolean
}>()

const emit = defineEmits<{ close: []; expand: [] }>()

const { code, t } = useUiToolsLocale()
const api = useFilePreview()
const router = inject(routerKey, null)
const root = useTemplateRef<HTMLElement>('root')
const tools = useTemplateRef<HTMLElement>('tools')
const stage = useTemplateRef<HTMLElement>('stage')
const strip = useTemplateRef<HTMLElement>('strip')
const showDetails = ref<boolean>(false)
const reported = shallowRef<readonly FilePreviewDetail[]>([])

const files = computed(() => props.instance.files.value)
const index = computed(() => props.instance.index.value)
const loop = computed(() => props.instance.options.loop === true)
const item = computed<FilePreviewItem | null>(() => files.value[index.value] ?? null)
const display = computed<FilePreviewItem | null>(() => item.value?.rendition ?? item.value)
const renderer = computed(() =>
  findFilePreviewRenderer(display.value?.kind ?? 'other', api.renderers.value),
)
const itemRenderer = computed(() =>
  findFilePreviewRenderer(item.value?.kind ?? 'other', api.renderers.value),
)
const kindLabel = computed(() => filePreviewKindLabel(itemRenderer.value, t))
const source = useFilePreviewSource(() => display.value)
const many = computed(() => files.value.length > 1)
const hasPrevious = computed(() => loop.value || index.value > 0)
const hasNext = computed(() => loop.value || index.value < files.value.length - 1)
const showStrip = computed(
  () => many.value && !props.narrow && props.instance.options.gallery !== 'counter',
)
const arrows = computed(() =>
  many.value &&
  !props.narrow &&
  props.container !== 'drawer' &&
  ['image', 'video'].includes(display.value?.kind ?? '')
    ? { next: hasNext.value, previous: hasPrevious.value }
    : null,
)
const meta = computed(() => {
  const current = item.value
  if (!current) return ''
  return [
    props.narrow && many.value
      ? t('filePreview.counter', { current: index.value + 1, total: files.value.length })
      : null,
    kindLabel.value,
    current.size === null ? null : formatFileSize(current.size, code.value),
    current.updatedAt ? formatFilePreviewDate(current.updatedAt, code.value) : null,
  ]
    .filter(Boolean)
    .join(' · ')
})
const details = computed(() => {
  const current = item.value
  if (!current) return []
  const rows = [
    { label: t('filePreview.fields.name'), value: current.name || t('filePreview.untitled') },
    { label: t('filePreview.fields.type'), value: current.mime ?? kindLabel.value },
    current.size === null
      ? null
      : {
          label: t('filePreview.fields.size'),
          value: `${formatFileSize(current.size, code.value)} (${current.size.toLocaleString(code.value)} B)`,
        },
    current.updatedAt
      ? {
          label: t('filePreview.fields.modified'),
          value: formatFilePreviewDate(current.updatedAt, code.value),
        }
      : null,
  ]
  const extra = [...reported.value, ...(current.file.details ?? [])].map((detail) => ({
    label: resolveFilePreviewText(detail.label),
    value: resolveFilePreviewText(detail.value),
  }))
  return [...rows.filter((row) => row !== null), ...extra]
})
const announcement = computed(() =>
  many.value && item.value
    ? t('filePreview.position', {
        current: index.value + 1,
        name: item.value.name || t('filePreview.untitled'),
        total: files.value.length,
      })
    : '',
)

provide(filePreviewShellKey, {
  markdown: inject(filePreviewMarkdownKey, null),
  narrow: computed(() => props.narrow),
  options: props.instance.options,
  root,
  tools,
})

watch(
  () => item.value?.key,
  async () => {
    reported.value = []
    await nextTick()
    const row = strip.value
    const thumb = row?.querySelector('[aria-current="true"]')
    if (!row || !(thumb instanceof HTMLElement)) return
    // Scrolls the strip only: scrollIntoView would also shift the overlay, which clips its content.
    row.scrollTo({
      behavior: 'smooth',
      left: thumb.offsetLeft - (row.clientWidth - thumb.offsetWidth) / 2,
    })
  },
  { immediate: true },
)

onMounted(() => root.value?.focus({ preventScroll: true }))

useEventListener(root, 'keydown', (event: KeyboardEvent) => {
  if (isFilePreviewControlKey(event)) return
  const moves = new Map([
    ['ArrowLeft', props.instance.handle.previous],
    ['ArrowRight', props.instance.handle.next],
    ['End', () => props.instance.handle.goTo(files.value.length - 1)],
    ['Home', () => props.instance.handle.goTo(0)],
  ])
  const move = moves.get(event.key)
  if (!move || !many.value) return
  event.preventDefault()
  move()
})

useSwipe(stage, {
  onSwipeEnd: (event, direction) => {
    if (!props.narrow || !many.value) return
    if (event.target instanceof Element && event.target.closest('[data-file-preview-zoomed]'))
      return
    if (direction === 'left') props.instance.handle.next()
    if (direction === 'right') props.instance.handle.previous()
  },
  threshold: 60,
})

function download() {
  if (item.value) void downloadFilePreviewItem(item.value)
}

function openInTab() {
  const url = source.url.value
  if (url) window.open(url, '_blank', 'noopener')
  else if (display.value) void openFilePreviewItem(display.value)
}

async function runAction(action: FilePreviewAction) {
  if (!item.value) return
  if (action.onSelect) await action.onSelect(item.value.file)
  if (!action.to) return
  if (/^[a-z][\d+.a-z-]*:/iu.test(action.to) || !router) {
    window.open(action.to, '_blank', 'noopener')
    return
  }
  emit('close')
  await router.push(action.to)
}
</script>

<template>
  <div
    ref="root"
    class="relative flex size-full min-h-0 flex-col overflow-hidden bg-default outline-none"
    tabindex="-1"
    data-file-preview=""
    data-vaul-no-drag=""
    :data-container="container"
  >
    <FilePreviewHeader
      v-if="item"
      :item="item"
      :icon="itemRenderer.icon"
      :meta="meta"
      :index="index"
      :total="files.length"
      :loop="loop"
      :narrow="narrow"
      :can-expand="canExpand"
      :expanded="expanded"
      :details="showDetails"
      @previous="instance.handle.previous"
      @next="instance.handle.next"
      @close="emit('close')"
      @expand="emit('expand')"
      @details="showDetails = !showDetails"
      @download="download"
      @open="openInTab"
      @action="runAction"
    >
      <template #tools>
        <div
          ref="tools"
          class="flex shrink-0 items-center gap-0.5 empty:hidden"
          data-file-preview-tools=""
        />
        <span
          class="mx-1 h-5 w-px shrink-0 bg-(--ui-border) [:empty+&]:hidden"
          aria-hidden="true"
        />
      </template>
    </FilePreviewHeader>

    <div ref="stage" class="flex min-h-0 flex-1 flex-col">
      <FilePreviewStage
        v-if="item && display"
        :item="item"
        :display="display"
        :renderer="renderer"
        :source="source"
        :container="container"
        :kind-label="kindLabel"
        :arrows="arrows"
        @ready="reported = $event"
        @previous="instance.handle.previous"
        @next="instance.handle.next"
        @download="download"
      >
        <FilePreviewDetails v-if="showDetails" :rows="details" />
      </FilePreviewStage>
    </div>

    <div
      v-if="narrow"
      class="flex shrink-0 items-center justify-between gap-2 border-t border-default bg-default px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]"
      data-file-preview-bottom=""
      :data-single="many ? undefined : ''"
    >
      <FilePreviewButton
        v-if="many"
        icon="i-lucide-chevron-left"
        :label="t('filePreview.previous')"
        :disabled="!hasPrevious"
        @click="instance.handle.previous"
      />
      <div ref="tools" class="mx-auto flex items-center gap-0.5" data-file-preview-tools="" />
      <FilePreviewButton
        v-if="many"
        icon="i-lucide-chevron-right"
        :label="t('filePreview.next')"
        :disabled="!hasNext"
        @click="instance.handle.next"
      />
    </div>

    <div
      v-else-if="showStrip"
      ref="strip"
      class="relative flex shrink-0 gap-1.5 overflow-x-auto border-t border-default bg-default px-3 py-2"
      data-file-preview-strip=""
    >
      <FilePreviewThumb
        v-for="(entry, position) in files"
        :key="entry.key"
        :item="entry"
        :icon="findFilePreviewRenderer(entry.kind, api.renderers.value).icon"
        :current="position === index"
        :label="`${position + 1}. ${entry.name || t('filePreview.untitled')}`"
        @select="instance.handle.goTo(position)"
      />
    </div>

    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
  </div>
</template>
