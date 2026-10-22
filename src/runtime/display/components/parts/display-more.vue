<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'

import { useDisplayIcons } from '../../composables/use-display-icons'
import { useDisplayLocale } from '../../composables/use-display-locale'

const { count } = defineProps<{ count: number }>()
const emit = defineEmits<{ reveal: [] }>()

const { t } = useDisplayLocale()
const icons = useDisplayIcons()
</script>

<template>
  <UButton
    :label="t('display.showMore', { count })"
    :trailing-icon="icons.chevronDown"
    color="neutral"
    variant="ghost"
    size="sm"
    data-display-more
    @click="emit('reveal')"
  />
</template>
