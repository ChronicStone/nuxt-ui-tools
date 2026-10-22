<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useResizeObserver } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'

import { useDisplayAppUi } from '../../composables/use-display-config'
import { useDisplayLocale } from '../../composables/use-display-locale'
import type { DisplayTextAppearance, DisplayTextProps, DisplayTextSlot } from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty } from '../../utils/content'
import { displayToneClass } from '../../utils/tone'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  appearance = 'body',
  text = undefined,
  paragraphs = undefined,
  title = undefined,
  icon = undefined,
  author = undefined,
  meta = undefined,
  tone = undefined,
  maxLines = undefined,
  loading = false,
  ui = undefined,
} = defineProps<DisplayTextProps>()

const ROOT_CLASSES = {
  body: 'text-sm leading-relaxed text-default',
  caption: 'flex items-start gap-1.5 text-xs leading-snug text-dimmed',
  lead: 'text-base leading-snug text-highlighted',
  legal:
    'rounded-e-[var(--nut-display-radius)] border border-s-[3px] border-muted border-s-[var(--nut-tone-line)] bg-elevated px-3.5 py-3',
  muted: 'text-sm leading-relaxed text-muted',
  prose:
    'text-sm leading-relaxed text-default [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_b]:font-semibold [&_b]:text-highlighted [&_code]:rounded [&_code]:border [&_code]:border-muted [&_code]:bg-elevated [&_code]:px-1 [&_code]:text-[0.88em] [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:ps-5 [&_strong]:font-semibold [&_strong]:text-highlighted [&_ul]:list-disc [&_ul]:ps-5',
  quote: 'border-s-[3px] border-[var(--nut-tone)] ps-4',
} as const satisfies Record<DisplayTextAppearance, string>

const PARAGRAPH_CLASSES = {
  body: 'mt-2 first:mt-0',
  caption: '',
  lead: 'mt-2 first:mt-0',
  legal: 'mt-1.5 text-xs leading-relaxed text-muted',
  muted: 'mt-2 first:mt-0',
  prose: 'mt-2 first:mt-0',
  quote: 'mt-2 text-[15px] leading-relaxed font-light text-highlighted first:mt-0',
} as const satisfies Record<DisplayTextAppearance, string>

const { t } = useDisplayLocale()
const appUi = useDisplayAppUi('text')
const body = useTemplateRef<HTMLElement>('body')
const expanded = ref<boolean>(false)
const overflowing = ref<boolean>(false)

const resolvedTone = computed(() => tone ?? (appearance === 'quote' ? 'primary' : 'neutral'))
const blocks = computed(() =>
  [text, ...(paragraphs ?? [])].filter((content) => !isDisplayContentEmpty(content)),
)
const clampStyle = computed(() =>
  maxLines && !expanded.value
    ? {
        WebkitBoxOrient: 'vertical' as const,
        WebkitLineClamp: maxLines,
        display: '-webkit-box',
        overflow: 'hidden',
      }
    : undefined,
)
const classes = computed(() =>
  resolveDisplayClasses<DisplayTextSlot>(
    {
      footer: 'mt-2 text-xs text-muted',
      header: 'flex items-center gap-1.5 text-xs font-bold text-toned',
      icon: appearance === 'caption' ? 'mt-px size-3.5 shrink-0' : 'size-3.5 shrink-0',
      paragraph: PARAGRAPH_CLASSES[appearance],
      root: ROOT_CLASSES[appearance],
      title: 'min-w-0',
      toggle: 'mt-1 cursor-pointer text-xs font-semibold text-primary underline underline-offset-2',
    },
    appUi.value,
    ui,
  ),
)

useResizeObserver(body, () => {
  const element = body.value
  if (element && !expanded.value)
    overflowing.value = element.scrollHeight > element.clientHeight + 1
})
</script>

<template>
  <DisplaySkeleton v-if="loading" :count="Math.max(blocks.length, 2)" />
  <div
    v-else
    :class="[classes.root, displayToneClass(resolvedTone)]"
    :data-appearance="appearance"
    data-display="text"
  >
    <div
      v-if="appearance === 'legal' && (!isDisplayContentEmpty(title) || icon)"
      :class="classes.header"
    >
      <UIcon v-if="icon" :name="icon" :class="classes.icon" />
      <span :class="classes.title"><DisplayRender :content="title" /></span>
    </div>
    <UIcon v-if="appearance === 'caption' && icon" :name="icon" :class="classes.icon" />
    <div ref="body" :style="clampStyle">
      <div v-for="(content, index) in blocks" :key="index" :class="classes.paragraph">
        <DisplayRender :content="content" />
      </div>
    </div>
    <button
      v-if="maxLines && (overflowing || expanded)"
      type="button"
      :class="classes.toggle"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      {{ expanded ? t('display.readLess') : t('display.readMore') }}
    </button>
    <div
      v-if="
        appearance === 'quote' && (!isDisplayContentEmpty(author) || !isDisplayContentEmpty(meta))
      "
      :class="classes.footer"
    >
      <DisplayRender :content="author" />
      <template v-if="!isDisplayContentEmpty(author) && !isDisplayContentEmpty(meta)"> · </template>
      <DisplayRender :content="meta" />
    </div>
  </div>
</template>
