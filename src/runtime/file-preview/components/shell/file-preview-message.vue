<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'

const {
  badge = null,
  detail = null,
  tone = 'neutral',
} = defineProps<{
  icon: string
  title: string
  description: string
  badge?: string | null
  detail?: string | null
  tone?: 'neutral' | 'error'
}>()
</script>

<template>
  <div
    class="flex size-full flex-col items-center justify-center gap-2.5 p-8 text-center"
    data-file-preview-message=""
    :data-tone="tone"
  >
    <span
      :class="[
        'relative mb-1.5 grid h-[76px] w-16 place-items-center rounded-[6px_16px_6px_6px] border bg-default shadow-[0_10px_24px_-14px_rgba(0,0,0,0.35)]',
        tone === 'error' ? 'border-error/40 text-error' : 'border-accented text-muted',
      ]"
      aria-hidden="true"
    >
      <UIcon :name="icon" class="size-7" />
      <span
        v-if="badge"
        class="absolute bottom-2.5 -left-2 rounded bg-inverted px-1.5 py-1 font-mono text-[10px] leading-none font-semibold tracking-wide text-inverted"
      >
        {{ badge }}
      </span>
    </span>
    <p class="m-0 max-w-[36ch] text-[15px] font-semibold text-balance text-highlighted">
      {{ title }}
    </p>
    <p class="m-0 max-w-[44ch] text-sm text-muted">{{ description }}</p>
    <p v-if="detail" class="m-0 max-w-[48ch] font-mono text-xs break-all text-dimmed">
      {{ detail }}
    </p>
    <div v-if="$slots.default" class="mt-2 flex flex-wrap justify-center gap-2">
      <slot />
    </div>
  </div>
</template>
