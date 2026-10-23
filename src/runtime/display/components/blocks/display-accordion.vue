<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, defineAsyncComponent, ref, useId } from 'vue'

import { useDisplayAppUi } from '../../composables/use-display-config'
import { useDisplayIcons } from '../../composables/use-display-icons'
import { vRevealTruncated } from '../../directives/reveal-truncated'
import type { DisplayAccordionProps, DisplayAccordionSlot } from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  variant = 'separated',
  items,
  multiple = false,
  loading = false,
  ui = undefined,
} = defineProps<DisplayAccordionProps>()

// Lazy, so the dispatcher and this block do not import each other while their modules load.
const DisplayBlock = defineAsyncComponent(() => import('../display.vue'))

const id = useId()
const icons = useDisplayIcons()
const appUi = useDisplayAppUi('accordion')
const open = ref<number[]>(
  items
    .flatMap((item, index) => (item.defaultOpen ? [index] : []))
    .slice(0, multiple ? undefined : 1),
)
const classes = computed(() =>
  resolveDisplayClasses<DisplayAccordionSlot>(
    {
      chevron: 'size-4 shrink-0 text-muted transition-transform duration-200',
      content: variant === 'flush' ? 'pb-3 text-sm text-toned' : 'px-3 pb-3 text-sm text-toned',
      icon: 'size-4 shrink-0 text-muted',
      item:
        variant === 'flush'
          ? ''
          : 'overflow-hidden rounded-[var(--nut-display-radius)] border border-default',
      label: 'min-w-0 flex-1',
      root:
        variant === 'flush'
          ? 'flex min-w-0 flex-col divide-y divide-default border-y border-default'
          : 'flex min-w-0 flex-col gap-1.5',
      trigger: `flex w-full cursor-pointer items-center gap-2 py-2.5 text-start text-sm font-semibold text-highlighted ${variant === 'flush' ? '' : 'px-3 hover:bg-elevated'}`,
    },
    appUi.value,
    ui,
  ),
)

function toggle(index: number) {
  const isOpen = open.value.includes(index)
  if (multiple)
    open.value = isOpen ? open.value.filter((entry) => entry !== index) : [...open.value, index]
  else open.value = isOpen ? [] : [index]
}
</script>

<template>
  <DisplaySkeleton v-if="loading" layout="rows" :count="Math.max(items.length, 2)" />
  <div v-else :class="classes.root" data-display="accordion" :data-variant="variant">
    <div
      v-for="(item, index) in items"
      :key="index"
      :class="classes.item"
      :data-state="open.includes(index) ? 'open' : 'closed'"
    >
      <button
        :id="`${id}-trigger-${index}`"
        type="button"
        :class="classes.trigger"
        :aria-expanded="open.includes(index)"
        :aria-controls="`${id}-panel-${index}`"
        @click="toggle(index)"
      >
        <UIcon v-if="item.icon" :name="item.icon" :class="classes.icon" />
        <span v-reveal-truncated :class="classes.label"
          ><DisplayRender :content="item.label"
        /></span>
        <UIcon
          :name="icons.chevronDown"
          :class="[classes.chevron, open.includes(index) ? 'rotate-180' : '']"
        />
      </button>
      <div
        v-if="open.includes(index)"
        :id="`${id}-panel-${index}`"
        role="region"
        :aria-labelledby="`${id}-trigger-${index}`"
        :class="classes.content"
      >
        <DisplayBlock
          v-if="item.block"
          :display="item.block.display"
          :props="item.block.props"
          :preset="item.block.preset"
        />
        <DisplayRender v-else :content="item.content" />
      </div>
    </div>
  </div>
</template>
