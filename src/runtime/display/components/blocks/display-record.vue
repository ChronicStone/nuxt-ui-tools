<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import ULink from '@nuxt/ui/components/Link.vue'
import { computed } from 'vue'

import { useDisplayAppUi } from '../../composables/use-display-config'
import { useDisplayReveal } from '../../composables/use-display-reveal'
import type { DisplayRecordItem, DisplayRecordProps, DisplayRecordSlot } from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty } from '../../utils/content'
import { DISPLAY_SURFACE_CLASSES } from '../../utils/tone'
import DisplayChip from '../parts/display-chip.vue'
import DisplayEmptyLine from '../parts/display-empty-line.vue'
import DisplayMore from '../parts/display-more.vue'
import DisplayRecordMedia from '../parts/display-record-media.vue'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  variant = 'row',
  heading = undefined,
  headingIcon = undefined,
  items = undefined,
  surface = 'bordered',
  max = undefined,
  step = undefined,
  empty = undefined,
  loading = false,
  ui = undefined,
  ...record
} = defineProps<DisplayRecordProps>()

const appUi = useDisplayAppUi('record')
const single = computed<DisplayRecordItem>(() => ({ ...record, title: record.title ?? '' }))
const reveal = useDisplayReveal({ items: () => items ?? [], max: () => max, step: () => step })
const classes = computed(() =>
  resolveDisplayClasses<DisplayRecordSlot>(
    {
      badges: 'mt-1.5 flex flex-wrap gap-1',
      body: 'min-w-0 flex-1',
      description: 'mt-1 line-clamp-2 text-sm text-muted',
      empty: '',
      header:
        'flex items-center gap-2 border-b border-default bg-elevated px-3 py-2 text-sm font-semibold text-toned',
      icon: 'size-4 shrink-0 text-dimmed',
      item: 'flex items-center gap-2.5 border-t border-muted px-3 py-2.5 first:border-t-0',
      list: '',
      media: '',
      meta: 'mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted',
      more: 'w-full justify-center rounded-none border-t border-muted',
      reference: 'font-mono text-[11px] text-dimmed',
      root:
        variant === 'card' || variant === 'stack'
          ? `min-w-0 overflow-hidden ${DISPLAY_SURFACE_CLASSES[surface]}`
          : `flex min-w-0 items-center ${variant === 'compact' ? 'gap-2.5 p-2' : 'gap-3 p-2.5'} ${DISPLAY_SURFACE_CLASSES[surface]}`,
      title: 'truncate font-semibold text-highlighted',
      trailing: 'shrink-0 text-end',
      trailingCaption: 'text-[11px] text-dimmed',
      trailingValue: 'font-extrabold text-highlighted tabular-nums',
    },
    appUi.value,
    ui,
  ),
)

function linkProps(item: DisplayRecordItem) {
  if (item.to) return { is: ULink, to: item.to }
  if (item.onClick) return { is: 'button', type: 'button', onClick: item.onClick }
  return { is: 'div' }
}
</script>

<template>
  <DisplaySkeleton v-if="loading" :layout="variant === 'stack' ? 'rows' : 'card'" :count="3" />
  <div
    v-else-if="variant === 'stack'"
    :class="classes.root"
    data-display="record"
    data-variant="stack"
  >
    <div v-if="!isDisplayContentEmpty(heading)" :class="classes.header">
      <UIcon v-if="headingIcon" :name="headingIcon" class="size-4 shrink-0 text-muted" />
      <DisplayRender :content="heading" />
      <span
        class="ms-auto rounded-full bg-default px-2 py-px text-xs font-semibold text-toned tabular-nums"
      >
        {{ items?.length ?? 0 }}
      </span>
    </div>
    <DisplayEmptyLine v-if="!items?.length" :content="empty" class="m-3" :class="classes.empty" />
    <div v-else :class="classes.list">
      <component
        :is="linkProps(item).is"
        v-for="(item, index) in reveal.visible.value"
        :key="index"
        v-bind="linkProps(item)"
        :class="[
          classes.item,
          item.to || item.onClick ? 'w-full text-start hover:bg-elevated' : '',
        ]"
      >
        <DisplayRecordMedia :item="item" size="sm" />
        <div :class="classes.body">
          <div :class="[classes.title, 'text-sm']"><DisplayRender :content="item.title" /></div>
          <div v-if="!isDisplayContentEmpty(item.meta)" :class="classes.meta">
            <UIcon v-if="item.metaIcon" :name="item.metaIcon" class="size-3 shrink-0" />
            <span class="truncate"><DisplayRender :content="item.meta" /></span>
          </div>
        </div>
        <DisplayChip v-if="item.chip" :chip="item.chip" />
        <div v-else-if="!isDisplayContentEmpty(item.trailing)" :class="classes.trailing">
          <div :class="classes.trailingValue"><DisplayRender :content="item.trailing" /></div>
        </div>
      </component>
      <DisplayMore
        v-if="reveal.hidden.value"
        :count="reveal.next.value"
        :class="classes.more"
        @reveal="reveal.reveal"
      />
    </div>
  </div>
  <component
    :is="linkProps(single).is"
    v-else-if="variant === 'card'"
    v-bind="linkProps(single)"
    :class="[classes.root, 'block text-start']"
    data-display="record"
    data-variant="card"
  >
    <DisplayRecordMedia :item="single" banner :class="classes.media" />
    <div class="p-3.5">
      <div v-if="!isDisplayContentEmpty(single.reference)" :class="classes.reference">
        <DisplayRender :content="single.reference" />
      </div>
      <div :class="classes.title"><DisplayRender :content="single.title" /></div>
      <div v-if="!isDisplayContentEmpty(single.meta)" :class="classes.meta">
        <UIcon v-if="single.metaIcon" :name="single.metaIcon" class="size-3 shrink-0" />
        <span class="truncate"><DisplayRender :content="single.meta" /></span>
      </div>
      <div v-if="single.badges?.length" :class="classes.badges">
        <DisplayChip v-for="(badge, index) in single.badges" :key="index" :chip="badge" />
      </div>
      <div v-if="!isDisplayContentEmpty(single.description)" :class="classes.description">
        <DisplayRender :content="single.description" />
      </div>
    </div>
  </component>
  <component
    :is="linkProps(single).is"
    v-else
    v-bind="linkProps(single)"
    :class="[
      classes.root,
      single.to || single.onClick ? 'w-full text-start hover:bg-elevated' : '',
    ]"
    data-display="record"
    :data-variant="variant"
  >
    <DisplayRecordMedia
      :item="single"
      :size="variant === 'compact' ? 'sm' : 'lg'"
      :class="classes.media"
    />
    <div :class="classes.body">
      <div v-if="!isDisplayContentEmpty(single.reference)" :class="classes.reference">
        <DisplayRender :content="single.reference" />
      </div>
      <div :class="classes.title"><DisplayRender :content="single.title" /></div>
      <div v-if="!isDisplayContentEmpty(single.meta)" :class="classes.meta">
        <UIcon v-if="single.metaIcon" :name="single.metaIcon" class="size-3 shrink-0" />
        <span class="truncate"><DisplayRender :content="single.meta" /></span>
      </div>
      <div v-if="single.badges?.length && variant === 'row'" :class="classes.badges">
        <DisplayChip v-for="(badge, index) in single.badges" :key="index" :chip="badge" />
      </div>
    </div>
    <DisplayChip v-if="single.chip" :chip="single.chip" />
    <div v-if="!isDisplayContentEmpty(single.trailing)" :class="classes.trailing">
      <div :class="classes.trailingValue"><DisplayRender :content="single.trailing" /></div>
      <div v-if="!isDisplayContentEmpty(single.trailingCaption)" :class="classes.trailingCaption">
        <DisplayRender :content="single.trailingCaption" />
      </div>
    </div>
    <UIcon
      v-if="variant === 'compact' && (single.to || single.onClick)"
      name="i-lucide-chevron-right"
      :class="classes.icon"
    />
  </component>
</template>
