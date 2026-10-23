<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useDisplayAppUi } from '../../composables/use-display-config'
import { vRevealTruncated } from '../../directives/reveal-truncated'
import type { DisplayHeadingProps, DisplayHeadingSlot } from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty, resolveDisplayText } from '../../utils/content'
import { isExternalLink } from '../../utils/links'
import { displayToneClass } from '../../utils/tone'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  title,
  description = undefined,
  variant = 'title',
  size = 'md',
  icon = undefined,
  tone = 'primary',
  count = undefined,
  action = undefined,
  level = 3,
  loading = false,
  ui = undefined,
} = defineProps<DisplayHeadingProps>()

const TITLE_CLASSES = {
  lg: 'text-base font-semibold text-highlighted',
  md: 'text-[15px] font-semibold text-highlighted',
  sm: 'text-sm font-semibold text-highlighted',
} as const

const appUi = useDisplayAppUi('heading')
const tile = computed(() => size === 'lg' && Boolean(icon))
const classes = computed(() =>
  resolveDisplayClasses<DisplayHeadingSlot>(
    {
      action: 'ms-auto shrink-0',
      count: 'rounded-full bg-elevated px-2 py-px text-xs font-semibold text-toned tabular-nums',
      description: 'mt-0.5 text-sm text-muted',
      icon: tile.value
        ? 'grid size-10 shrink-0 place-items-center rounded-[var(--nut-display-radius)] bg-[var(--nut-tone-soft)] text-[var(--nut-tone-ink)]'
        : 'size-4.5 shrink-0 text-muted',
      root:
        variant === 'eyebrow'
          ? 'flex items-center gap-3'
          : tile.value || !isDisplayContentEmpty(description)
            ? 'flex items-start gap-3'
            : 'flex items-center gap-2',
      rule: 'h-px flex-1 bg-[var(--ui-border)]',
      text: 'flex min-w-0 flex-1 flex-col',
      title:
        variant === 'eyebrow'
          ? 'm-0 text-[11px] font-bold tracking-[0.08em] text-muted uppercase'
          : `m-0 flex flex-wrap items-center gap-2 ${TITLE_CLASSES[size]}`,
    },
    appUi.value,
    ui,
  ),
)
const actionButton = computed(() => {
  if (!action) return undefined
  const { label, ...rest } = action
  return {
    color: 'primary' as const,
    size: 'sm' as const,
    variant: 'link' as const,
    ...rest,
    label: resolveDisplayText(label),
    target: rest.target === undefined && isExternalLink(rest.to) ? '_blank' : rest.target,
  }
})
</script>

<template>
  <DisplaySkeleton v-if="loading" :count="isDisplayContentEmpty(description) ? 1 : 2" />
  <div v-else-if="variant === 'eyebrow'" :class="classes.root" data-display="heading">
    <component :is="`h${level}`" :class="classes.title">
      <DisplayRender :content="title" />
    </component>
    <span :class="classes.rule" aria-hidden="true" />
  </div>
  <div v-else :class="[classes.root, displayToneClass(tone)]" data-display="heading">
    <span v-if="tile" :class="classes.icon"><UIcon :name="icon ?? ''" class="size-5" /></span>
    <UIcon v-else-if="icon" :name="icon" :class="classes.icon" />
    <div v-reveal-truncated :class="classes.text">
      <component :is="`h${level}`" :class="classes.title">
        <DisplayRender :content="title" />
        <span v-if="count !== undefined" :class="classes.count">{{
          resolveDisplayText(count)
        }}</span>
      </component>
      <div
        v-if="!isDisplayContentEmpty(description)"
        v-reveal-truncated
        :class="classes.description"
      >
        <DisplayRender :content="description" />
      </div>
    </div>
    <UButton v-if="actionButton" v-bind="actionButton" :class="classes.action" />
  </div>
</template>
