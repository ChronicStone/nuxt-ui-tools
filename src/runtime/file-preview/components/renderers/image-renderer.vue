<script setup lang="ts">
import { useElementSize, useEventListener } from '@vueuse/core'
import { computed, ref, shallowRef, useTemplateRef } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { onFilePreviewKey } from '../../composables/use-file-preview-shell'
import type { FilePreviewRendererEmits, FilePreviewRendererProps } from '../../types'
import FilePreviewButton from '../shell/file-preview-button.vue'
import FilePreviewTools from '../shell/file-preview-tools.vue'

/** Formats that may carry transparency, shown over a checkerboard. */
const TRANSPARENT = new Set(['apng', 'avif', 'gif', 'ico', 'png', 'svg', 'webp'])
const PADDING = 24
const MAX_ZOOM = 4

const props = defineProps<FilePreviewRendererProps>()
const emit = defineEmits<FilePreviewRendererEmits>()

const { t } = useUiToolsLocale()
const viewport = useTemplateRef<HTMLElement>('viewport')
const { height, width } = useElementSize(viewport)
const natural = shallowRef<{ width: number; height: number } | null>(null)
const scale = ref<number>(1)
const offset = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const rotation = ref<number>(0)
const dragging = ref<boolean>(false)

const transparent = computed(
  () => props.file.mime === 'image/svg+xml' || TRANSPARENT.has(props.file.extension ?? ''),
)
const turned = computed(() => rotation.value % 180 !== 0)
/** Scale that fits the image in the stage, never above its natural size. */
const fit = computed(() => {
  const size = natural.value
  if (!size || width.value <= 0 || height.value <= 0) return 1
  const shownWidth = turned.value ? size.height : size.width
  const shownHeight = turned.value ? size.width : size.height
  return Math.min(
    (width.value - PADDING * 2) / shownWidth,
    (height.value - PADDING * 2) / shownHeight,
    1,
  )
})
const maxScale = computed(() => Math.max(MAX_ZOOM / fit.value, 2))
const zoomed = computed(() => scale.value > 1.001)
const percent = computed(() => `${Math.round(fit.value * scale.value * 100)}%`)
const imageStyle = computed(() => {
  const size = natural.value
  return {
    height: size ? `${size.height * fit.value}px` : undefined,
    transform: `translate(-50%, -50%) translate(${offset.value.x}px, ${offset.value.y}px) scale(${scale.value}) rotate(${rotation.value}deg)`,
    width: size ? `${size.width * fit.value}px` : undefined,
  }
})

function zoomTo(next: number, point?: { x: number; y: number }) {
  const target = Math.min(Math.max(next, 1), maxScale.value)
  const box = viewport.value?.getBoundingClientRect()
  const x = point && box ? point.x - (box.left + box.width / 2) : 0
  const y = point && box ? point.y - (box.top + box.height / 2) : 0
  const ratio = target / scale.value
  offset.value =
    target <= 1.001
      ? { x: 0, y: 0 }
      : { x: x - (x - offset.value.x) * ratio, y: y - (y - offset.value.y) * ratio }
  scale.value = target <= 1.001 ? 1 : target
}

function reset() {
  scale.value = 1
  offset.value = { x: 0, y: 0 }
}

function rotate() {
  rotation.value = (rotation.value + 90) % 360
  reset()
}

function handleLoad(event: Event) {
  if (!(event.target instanceof HTMLImageElement)) return
  const size = {
    height: event.target.naturalHeight || 600,
    width: event.target.naturalWidth || 800,
  }
  natural.value = size
  emit('ready', [
    { label: t('filePreview.fields.dimensions'), value: `${size.width} × ${size.height} px` },
  ])
}

function toggleZoom(event: MouseEvent) {
  if (zoomed.value) return reset()
  zoomTo(Math.max(2.5, 1 / fit.value), { x: event.clientX, y: event.clientY })
}

function startDrag(event: PointerEvent) {
  if (!zoomed.value || !(event.currentTarget instanceof HTMLElement)) return
  const origin = { x: event.clientX - offset.value.x, y: event.clientY - offset.value.y }
  const surface = event.currentTarget
  surface.setPointerCapture(event.pointerId)
  dragging.value = true
  const move = (moved: PointerEvent) => {
    offset.value = { x: moved.clientX - origin.x, y: moved.clientY - origin.y }
  }
  const stop = () => {
    dragging.value = false
    surface.removeEventListener('pointermove', move)
    surface.removeEventListener('pointerup', stop)
    surface.removeEventListener('pointercancel', stop)
  }
  surface.addEventListener('pointermove', move)
  surface.addEventListener('pointerup', stop)
  surface.addEventListener('pointercancel', stop)
}

useEventListener(
  viewport,
  'wheel',
  (event: WheelEvent) => {
    event.preventDefault()
    const speed = event.ctrlKey ? 0.01 : 0.0018
    zoomTo(scale.value * Math.exp(-event.deltaY * speed), { x: event.clientX, y: event.clientY })
  },
  { passive: false },
)

onFilePreviewKey(['+', '=', '-', '0', 'r', 'R'], (event) => {
  if (event.key === '+' || event.key === '=') zoomTo(scale.value * 1.5)
  else if (event.key === '-') zoomTo(scale.value / 1.5)
  else if (event.key === '0') reset()
  else rotate()
})
</script>

<template>
  <div
    ref="viewport"
    :class="[
      'absolute inset-0 touch-none overflow-hidden select-none',
      transparent ? 'nut-fp-checker' : '',
      zoomed ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in',
    ]"
    :data-file-preview-zoomed="zoomed ? '' : undefined"
    data-file-preview-image=""
    @dblclick="toggleZoom"
    @pointerdown="startDrag"
  >
    <img
      :src="url"
      :alt="file.name"
      draggable="false"
      :class="[
        'absolute top-1/2 left-1/2 max-w-none origin-center',
        dragging ? '' : 'transition-transform duration-150 ease-out motion-reduce:transition-none',
        natural ? '' : 'opacity-0',
        transparent ? '' : 'shadow-[0_1px_3px_rgba(0,0,0,0.12)]',
      ]"
      :style="imageStyle"
      @load="handleLoad"
      @error="emit('error', { reason: 'decode' })"
    />

    <FilePreviewTools>
      <FilePreviewButton
        icon="i-lucide-zoom-out"
        :label="t('filePreview.image.zoomOut')"
        :kbds="['-']"
        :disabled="!zoomed"
        @click="zoomTo(scale / 1.5)"
      />
      <button
        type="button"
        class="min-w-12 rounded-md px-1.5 py-1 text-xs font-medium text-toned tabular-nums hover:bg-elevated"
        :aria-label="t('filePreview.image.fit')"
        :title="t('filePreview.image.fit')"
        data-file-preview-zoom=""
        @click="reset"
      >
        {{ percent }}
      </button>
      <FilePreviewButton
        icon="i-lucide-zoom-in"
        :label="t('filePreview.image.zoomIn')"
        :kbds="['+']"
        :disabled="scale >= maxScale"
        @click="zoomTo(scale * 1.5)"
      />
      <FilePreviewButton
        icon="i-lucide-rotate-cw"
        :label="t('filePreview.image.rotate')"
        :kbds="['R']"
        @click="rotate"
      />
    </FilePreviewTools>
  </div>
</template>
