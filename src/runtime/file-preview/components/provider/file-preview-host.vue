<script setup lang="ts">
import UDrawer from '@nuxt/ui/components/Drawer.vue'
import UModal from '@nuxt/ui/components/Modal.vue'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import {
  getResponsiveValue,
  useResponsiveValue,
} from '../../../shared/composables/use-responsive-value'
import { useFilePreview } from '../../composables/use-file-preview-api'
import type { FilePreviewInstance } from '../../types'
import { largestFilePreviewContainer, normalizeFilePreviewContainer } from '../../utils/container'
import { findFilePreviewRenderer } from '../../utils/renderers'
import FilePreviewShell from '../shell/file-preview-shell.vue'

const DRAWER_MIN_WIDTH = 420
const DRAWER_GUTTER = 56

const props = defineProps<{ instance: FilePreviewInstance }>()

const { t } = useUiToolsLocale()
const api = useFilePreview()
const expanded = ref<boolean>(false)
const drawerWidth = useLocalStorage<number>('nut-file-preview-drawer-width', 940)
const width = useResponsiveValue('narrow md:wide')
const narrow = computed(() => width.value === 'narrow')

const renderers = computed(() =>
  props.instance.files.value.map((item) =>
    findFilePreviewRenderer((item.rendition ?? item).kind, api.renderers.value),
  ),
)
/** Chosen once for the whole gallery, so navigating never swaps containers. */
const base = computed(() => {
  const explicit = props.instance.options.mode
  const modes = explicit ? [explicit] : renderers.value.map((renderer) => renderer.mode ?? 'modal')
  return largestFilePreviewContainer(
    modes.map((mode) => normalizeFilePreviewContainer(getResponsiveValue(mode, 'string'))),
  )
})
const container = computed(() => (expanded.value ? 'fullscreen' : base.value))
const compact = computed(
  () => base.value === 'modal' && renderers.value.every((renderer) => renderer.compact === true),
)
const canExpand = computed(() => !narrow.value && (base.value !== 'fullscreen' || expanded.value))
const title = computed(() => {
  const item = props.instance.files.value[props.instance.index.value]
  return item?.name || t('filePreview.untitled')
})
const drawerContent = computed(() => ({
  disableOutsidePointerEvents: undefined,
  style: {
    width: expanded.value
      ? '100vw'
      : `min(${Math.max(DRAWER_MIN_WIDTH, drawerWidth.value)}px, calc(100vw - ${DRAWER_GUTTER}px))`,
  },
}))

function close() {
  props.instance.handle.close()
}

function handleOpen(open: boolean) {
  if (!open) close()
}

function handleDrawerAnimation(open: boolean) {
  if (!open) props.instance.dispose()
}

function resize(event: PointerEvent) {
  if (expanded.value || !(event.currentTarget instanceof HTMLElement)) return
  const handle = event.currentTarget
  handle.setPointerCapture(event.pointerId)
  const move = (moved: PointerEvent) => {
    drawerWidth.value = Math.round(
      Math.min(
        window.innerWidth - DRAWER_GUTTER,
        Math.max(DRAWER_MIN_WIDTH, window.innerWidth - moved.clientX),
      ),
    )
  }
  const stop = () => {
    handle.removeEventListener('pointermove', move)
    handle.removeEventListener('pointerup', stop)
    handle.removeEventListener('pointercancel', stop)
  }
  handle.addEventListener('pointermove', move)
  handle.addEventListener('pointerup', stop)
  handle.addEventListener('pointercancel', stop)
}
</script>

<template>
  <UDrawer
    v-if="base === 'drawer'"
    :open="instance.open.value"
    :title="title"
    :description="title"
    direction="right"
    :handle="false"
    :content="drawerContent"
    :ui="{
      overlay: 'bg-(--nut-fp-veil)',
      content: 'h-dvh max-w-none overflow-hidden rounded-none border-s border-default p-0',
      container: 'size-full p-0',
    }"
    @update:open="handleOpen"
    @animation-end="handleDrawerAnimation"
  >
    <template #content>
      <div
        v-if="!expanded"
        class="absolute inset-y-0 start-0 z-30 w-1.5 cursor-col-resize touch-none transition-colors hover:bg-primary/40"
        aria-hidden="true"
        data-file-preview-resize=""
        @pointerdown="resize"
      />
      <FilePreviewShell
        :instance="instance"
        :container="container"
        :narrow="narrow"
        :can-expand="canExpand"
        :expanded="expanded"
        @close="close"
        @expand="expanded = !expanded"
      />
    </template>
  </UDrawer>

  <UModal
    v-else
    :open="instance.open.value"
    :title="title"
    :description="title"
    :fullscreen="container === 'fullscreen'"
    :ui="{
      overlay: 'bg-(--nut-fp-veil)',
      content:
        container === 'fullscreen'
          ? 'h-dvh max-w-none overflow-hidden rounded-none p-0'
          : compact
            ? 'h-auto max-h-[calc(100dvh-32px)] w-[min(468px,calc(100%-32px))] max-w-none overflow-hidden rounded-xl p-0'
            : 'h-[min(780px,calc(100dvh-48px))] w-[min(1080px,calc(100%-48px))] max-w-none overflow-hidden rounded-xl p-0',
    }"
    @update:open="handleOpen"
    @after:leave="instance.dispose()"
  >
    <template #content>
      <FilePreviewShell
        :instance="instance"
        :container="container"
        :narrow="narrow"
        :can-expand="canExpand"
        :expanded="expanded"
        @close="close"
        @expand="expanded = !expanded"
      />
    </template>
  </UModal>
</template>
