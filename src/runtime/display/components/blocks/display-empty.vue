<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useDisplayAppUi } from '../../composables/use-display-config'
import { useDisplayIcons } from '../../composables/use-display-icons'
import { useDisplayLocale } from '../../composables/use-display-locale'
import type { DisplayEmptyProps, DisplayEmptySlot } from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty } from '../../utils/content'
import { displayToneClass } from '../../utils/tone'
import DisplayActions from '../parts/display-actions.vue'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  variant = 'dashed',
  icon = undefined,
  title = undefined,
  description = undefined,
  actions = undefined,
  tone = 'neutral',
  loading = false,
  ui = undefined,
} = defineProps<DisplayEmptyProps>()

const { t } = useDisplayLocale()
const icons = useDisplayIcons()
const appUi = useDisplayAppUi('empty')
const classes = computed(() =>
  resolveDisplayClasses<DisplayEmptySlot>(
    variant === 'plain'
      ? {
          actions: 'ms-auto flex gap-1.5',
          description: 'text-dimmed',
          icon: 'size-4 shrink-0',
          root: 'flex items-center gap-2 py-1.5 text-sm text-dimmed',
          title: '',
        }
      : {
          actions: 'mt-3 flex flex-wrap justify-center gap-2',
          description: 'max-w-sm text-sm text-muted',
          icon: 'mb-2 grid size-10 place-items-center rounded-[var(--nut-display-radius)] bg-[var(--nut-tone-soft)] text-[var(--nut-tone-ink)]',
          root: 'flex flex-col items-center gap-1 rounded-[var(--nut-display-radius)] border-[1.5px] border-dashed border-accented px-5 py-6 text-center',
          title: 'text-sm font-semibold text-highlighted',
        },
    appUi.value,
    ui,
  ),
)
</script>

<template>
  <DisplaySkeleton v-if="loading" layout="block" />
  <div
    v-else
    :class="[classes.root, displayToneClass(tone)]"
    data-display="empty"
    :data-variant="variant"
  >
    <UIcon v-if="variant === 'plain'" :name="icon ?? icons.empty" :class="classes.icon" />
    <span v-else :class="classes.icon"><UIcon :name="icon ?? icons.empty" class="size-5" /></span>
    <div :class="classes.title">
      <DisplayRender :content="title ?? (variant === 'plain' ? undefined : t('display.empty'))" />
    </div>
    <div v-if="!isDisplayContentEmpty(description)" :class="classes.description">
      <DisplayRender :content="description" />
    </div>
    <DisplayActions v-if="actions?.length" :actions="actions" :class="classes.actions" />
  </div>
</template>
