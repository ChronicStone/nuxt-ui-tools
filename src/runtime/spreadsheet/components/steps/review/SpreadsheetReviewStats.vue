<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'

defineProps<{
  items: Array<{
    key: string
    value: number
    label: string
    hint: string
    valueClass: string
    accentClass: string
    cardClass: string
  }>
  limitText?: string
}>()
</script>

<template>
  <div class="flex min-h-11 flex-wrap items-center gap-3 rounded-[4px] border border-default/70 bg-default px-4 py-2">
    <template v-for="(item, index) in items" :key="item.key">
      <div class="flex min-w-0 items-center gap-2">
        <div class="size-[7px] rounded-full" :class="item.accentClass" />
        <span class="font-mono text-[13px] font-semibold leading-none" :class="item.valueClass">
          {{ item.value }}
        </span>
        <span class="text-[11px] text-muted">
          {{ item.label }}
        </span>
        <span class="font-mono text-[10px] text-muted">
          {{ item.hint }}
        </span>
      </div>

      <div v-if="index < items.length - 1" class="h-4 w-px bg-default/70" />
    </template>

    <template v-if="limitText">
      <div class="h-4 w-px bg-default/70" />
      <div class="flex items-center gap-1.5">
        <UIcon name="i-lucide-info" class="size-3 text-warning" />
        <span class="font-mono text-[10px] font-medium text-warning">
          {{ limitText }}
        </span>
      </div>
    </template>
  </div>
</template>
