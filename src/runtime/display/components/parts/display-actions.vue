<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import type { ButtonProps } from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import type { DisplayAction } from '../../types'
import { resolveDisplayText } from '../../utils/content'

const { actions, size = 'sm' } = defineProps<{
  actions: readonly DisplayAction[]
  size?: ButtonProps['size']
}>()

const buttons = computed(() =>
  actions.map(({ label, ...action }) => ({
    color: 'neutral' as const,
    size,
    variant: 'outline' as const,
    ...action,
    label: resolveDisplayText(label),
  })),
)
</script>

<template>
  <div>
    <UButton v-for="(button, index) in buttons" :key="index" v-bind="button" />
  </div>
</template>
