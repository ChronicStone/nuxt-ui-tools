<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'

import { useDisplayIcons } from '../../composables/use-display-icons'
import { useDisplayLocale } from '../../composables/use-display-locale'
import type { DisplayContent } from '../../types'
import DisplayRender from './display-render'

const { content } = defineProps<{ content?: DisplayContent }>()

const { t } = useDisplayLocale()
const icons = useDisplayIcons()
</script>

<template>
  <div
    class="flex items-center justify-center gap-2 rounded-[var(--nut-display-radius)] border border-dashed border-accented px-4 py-4 text-sm text-muted"
    data-display-empty
  >
    <UIcon :name="icons.empty" class="size-4 shrink-0 text-dimmed" />
    <DisplayRender :content="content ?? t('display.empty')" />
  </div>
</template>
