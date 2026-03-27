<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'

defineProps<{
  title: string
  description?: string
  closable?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="flex items-start justify-between gap-3">
    <div class="grid gap-1">
      <h1 class="text-[1.75rem] font-semibold leading-none tracking-[-0.06em] text-highlighted">
        {{ title }}
      </h1>
      <p v-if="description" class="text-[13px] text-toned">
        {{ description }}
      </p>
    </div>

    <UButton
      v-if="closable"
      color="neutral"
      variant="ghost"
      size="sm"
      square
      icon="i-lucide-x"
      aria-label="Close import"
      @click="emit('close')"
    />
  </div>
</template>
