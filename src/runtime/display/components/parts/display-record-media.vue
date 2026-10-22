<script setup lang="ts">
import UAvatar from '@nuxt/ui/components/Avatar.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { ref, watch } from 'vue'

import type { DisplayRecordItem } from '../../types'
import { displayToneClass } from '../../utils/tone'

const {
  item,
  size = 'md',
  banner = false,
} = defineProps<{
  item: DisplayRecordItem
  size?: 'sm' | 'md' | 'lg'
  banner?: boolean
}>()

const BOX = { lg: 'size-13', md: 'size-10', sm: 'size-8' } as const
const ICON = { lg: 'size-6', md: 'size-5', sm: 'size-4' } as const
const AVATAR = { lg: 'xl', md: 'lg', sm: 'md' } as const

const failed = ref<boolean>(false)
watch(
  () => item.image?.src,
  () => {
    failed.value = false
  },
)
</script>

<template>
  <img
    v-if="item.image?.src && !failed"
    :src="item.image.src"
    :alt="item.image.alt ?? ''"
    :class="[
      'shrink-0 bg-elevated object-cover',
      banner ? 'h-28 w-full' : `${BOX[size]} rounded-[var(--nut-display-radius)]`,
    ]"
    loading="lazy"
    @error="failed = true"
  />
  <UAvatar
    v-else-if="item.avatar && !banner"
    v-bind="item.avatar"
    :size="item.avatar.size ?? AVATAR[size]"
    class="shrink-0"
  />
  <span
    v-else-if="item.icon || item.image || banner"
    :class="[
      'grid shrink-0 place-items-center bg-[var(--nut-tone-soft)] text-[var(--nut-tone-ink)]',
      displayToneClass(item.tone ?? 'primary'),
      banner ? 'h-28 w-full' : `${BOX[size]} rounded-[var(--nut-display-radius)]`,
    ]"
    aria-hidden="true"
  >
    <UIcon
      :name="item.icon ?? 'i-lucide-image'"
      :class="banner ? 'size-8 opacity-70' : ICON[size]"
    />
  </span>
</template>
