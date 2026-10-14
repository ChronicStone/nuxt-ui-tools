<script setup lang="ts">
import UAvatar from '@nuxt/ui/components/Avatar.vue'
import UChip from '@nuxt/ui/components/Chip.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import type { ResolvedFormOption } from '../../types'

const AVATAR_SIZES = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const

/**
 * The one visual an option draws before its label: its icon, else its avatar, else its chip, the
 * same order as Nuxt UI items. Draws nothing for an option that declares none, or for no option:
 * a menu fills its leading slot with this component even when a `renderOption` function owns the
 * content, because an empty slot would bring back the Nuxt UI icon.
 */
const props = withDefaults(
  defineProps<{
    option?: ResolvedFormOption
    /** Classes of the icon, so a control can match its own leading icon. */
    iconClass?: string
    /** Nuxt UI avatar size; one the avatar does not know falls back to `xs`. */
    avatarSize?: string
    /** Classes of the box the chip dot is centered in. */
    chipClass?: string
    /** Nuxt UI chip size: `sm` for the small text of a token. */
    chipSize?: 'sm' | 'md'
  }>(),
  { avatarSize: 'xs', chipClass: 'size-4', chipSize: 'md', iconClass: 'size-4 text-muted' },
)

const size = computed(() => AVATAR_SIZES.find((entry) => entry === props.avatarSize) ?? 'xs')
</script>

<template>
  <UIcon
    v-if="option?.icon"
    :name="option.icon"
    :class="['shrink-0', iconClass]"
    aria-hidden="true"
    data-form-option-leading="icon"
  />
  <UAvatar
    v-else-if="option?.avatar"
    :src="option.avatar.src"
    :alt="option.avatar.alt ?? option.label"
    :text="option.avatar.text"
    :size="size"
    class="shrink-0"
    data-form-option-leading="avatar"
  />
  <span
    v-else-if="option?.chip"
    :class="['grid shrink-0 place-items-center', chipClass]"
    aria-hidden="true"
    data-form-option-leading="chip"
  >
    <UChip standalone inset :size="chipSize" :color="option.chip.color" />
  </span>
</template>
