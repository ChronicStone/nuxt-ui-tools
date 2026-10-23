<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import type { ButtonProps } from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import type { DisplayAction } from '../../types'
import { resolveDisplayText } from '../../utils/content'
import { isExternalLink } from '../../utils/links'

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
    // A link out of the app opens in a new tab unless the action sets its own target.
    target: action.target === undefined && isExternalLink(action.to) ? '_blank' : action.target,
  })),
)
</script>

<template>
  <div>
    <UButton v-for="(button, index) in buttons" :key="index" v-bind="button" />
  </div>
</template>
