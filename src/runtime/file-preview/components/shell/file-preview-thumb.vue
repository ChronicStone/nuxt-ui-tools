<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useObjectUrl } from '@vueuse/core'
import { computed, ref } from 'vue'

import { isString } from '../../../shared/utils/predicate'
import type { FilePreviewItem } from '../../types'

/** Remote images below this size double as their own thumbnail. */
const INLINE_THUMBNAIL_BYTES = 1.5 * 1024 * 1024

const props = defineProps<{
  item: FilePreviewItem
  icon: string
  current: boolean
  label: string
}>()

defineEmits<{ select: [] }>()

const broken = ref<boolean>(false)
const display = computed(() => props.item.rendition ?? props.item)
const localImage = computed(() => {
  const { src } = display.value.file
  return display.value.kind === 'image' && src instanceof Blob ? src : null
})
const localUrl = useObjectUrl(localImage)
const image = computed(() => {
  const { file, kind, size } = display.value
  if (props.item.file.thumbnail) return props.item.file.thumbnail
  if (file.poster) return file.poster
  if (localUrl.value) return localUrl.value
  const small = size === null || size <= INLINE_THUMBNAIL_BYTES
  return kind === 'image' && small && isString(file.src) ? file.src : null
})
</script>

<template>
  <button
    type="button"
    :class="[
      'relative grid h-11 w-16 shrink-0 place-items-center overflow-hidden rounded-md border bg-elevated text-muted transition',
      current
        ? 'border-transparent outline-2 outline-offset-1 outline-primary'
        : 'border-default opacity-80 hover:opacity-100',
    ]"
    :aria-label="label"
    :aria-current="current ? 'true' : undefined"
    data-file-preview-thumb=""
    @click="$emit('select')"
  >
    <img
      v-if="image && !broken"
      :src="image"
      alt=""
      loading="lazy"
      class="size-full object-cover"
      @error="broken = true"
    />
    <template v-else>
      <UIcon :name="icon" class="size-4" aria-hidden="true" />
      <span
        v-if="item.extension"
        class="absolute right-1 bottom-0.5 font-mono text-[8.5px] leading-none font-semibold uppercase"
        aria-hidden="true"
      >
        {{ item.extension }}
      </span>
    </template>
    <span
      v-if="display.kind === 'video'"
      class="absolute inset-0 grid place-items-center bg-black/25 text-white"
      aria-hidden="true"
    >
      <UIcon name="i-lucide-play" class="size-3.5" />
    </span>
  </button>
</template>
