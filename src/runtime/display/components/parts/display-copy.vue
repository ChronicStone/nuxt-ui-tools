<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { useClipboard } from '@vueuse/core'

import { useDisplayIcons } from '../../composables/use-display-icons'
import { useDisplayLocale } from '../../composables/use-display-locale'

const { value } = defineProps<{ value: string }>()

const { t } = useDisplayLocale()
const icons = useDisplayIcons()
const { copy, copied } = useClipboard({ copiedDuring: 1500, legacy: true })
</script>

<template>
  <UButton
    :icon="copied ? icons.copyCheck : icons.copy"
    :aria-label="copied ? t('display.copied') : t('display.copy')"
    :title="copied ? t('display.copied') : t('display.copy')"
    :class="copied ? 'text-success' : 'text-dimmed'"
    color="neutral"
    variant="ghost"
    size="xs"
    square
    data-display-copy
    @click.stop="copy(value)"
  />
</template>
