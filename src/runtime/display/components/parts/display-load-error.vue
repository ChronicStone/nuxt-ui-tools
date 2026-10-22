<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import { useDisplayIcons } from '../../composables/use-display-icons'
import { useDisplayLocale } from '../../composables/use-display-locale'

const emit = defineEmits<{ retry: [] }>()

const { t } = useDisplayLocale()
const icons = useDisplayIcons()
</script>

<template>
  <div
    class="nut-display-tone-error flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--nut-tone-ink)]"
    role="alert"
    data-display-error
  >
    <UIcon :name="icons.warning" class="size-4 shrink-0" />
    <span>{{ t('display.loadError') }}</span>
    <UButton
      :label="t('display.retry')"
      color="error"
      variant="link"
      size="sm"
      class="p-0"
      data-display-retry
      @click="emit('retry')"
    />
  </div>
</template>
