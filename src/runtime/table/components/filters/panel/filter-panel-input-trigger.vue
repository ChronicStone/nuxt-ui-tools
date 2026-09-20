<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import type { DataListControlSize } from '../../../types'
import { resolveDataListControlGeometry } from '../../../utils'

const props = defineProps<{
  value?: string
  placeholder: string
  icon?: string
  size?: DataListControlSize
}>()

const geometry = computed(() => resolveDataListControlGeometry(props.size ?? 'md'))
</script>

<template>
  <UButton color="neutral" variant="outline" :size="size" class="w-full justify-between text-left">
    <span :class="['flex min-w-0 items-center', geometry.toolbarGap]">
      <UIcon v-if="icon" :name="icon" :class="[geometry.icon, 'shrink-0 text-muted']" />
      <span class="min-w-0 truncate" :class="value ? 'text-default' : 'text-muted'">
        {{ value || placeholder }}
      </span>
    </span>

    <UIcon name="i-lucide-chevron-down" :class="[geometry.icon, 'shrink-0 text-muted']" />
  </UButton>
</template>
