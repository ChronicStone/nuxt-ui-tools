<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, ref } from 'vue'

import { useDisplayAppUi } from '../../composables/use-display-config'
import { toneIcon, useDisplayIcons } from '../../composables/use-display-icons'
import { useDisplayLocale } from '../../composables/use-display-locale'
import type { DisplayAlertAppearance, DisplayAlertProps, DisplayAlertSlot } from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty } from '../../utils/content'
import { displayToneClass } from '../../utils/tone'
import DisplayActions from '../parts/display-actions.vue'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  tone = 'info',
  appearance = 'soft',
  icon = undefined,
  title = undefined,
  message = undefined,
  items = undefined,
  list = undefined,
  details = undefined,
  defaultOpen = false,
  actions = undefined,
  loading = false,
  ui = undefined,
} = defineProps<DisplayAlertProps>()

const BOX = 'flex items-start gap-2.5 rounded-[var(--nut-display-radius)] px-3.5 py-3 text-sm'
const ROOT_CLASSES = {
  banner:
    'flex flex-wrap items-center gap-3 rounded-[var(--nut-display-radius)] border border-default bg-default p-3.5 text-sm text-default',
  callout:
    'flex items-start gap-2.5 rounded-e-[var(--nut-display-radius)] border-s-[3px] border-[var(--nut-tone)] bg-elevated px-3.5 py-3 text-sm text-default',
  inline: 'flex items-start gap-2 text-sm text-toned',
  outline: `${BOX} border border-[var(--nut-tone-line)] text-[var(--nut-tone-ink)]`,
  soft: `${BOX} bg-[var(--nut-tone-soft)] text-[var(--nut-tone-ink)]`,
  solid: `${BOX} bg-[var(--nut-tone)] text-[var(--nut-tone-contrast)]`,
  subtle: `${BOX} border border-[var(--nut-tone-line)] bg-[var(--nut-tone-soft)] text-[var(--nut-tone-ink)]`,
} as const satisfies Record<DisplayAlertAppearance, string>

const { t } = useDisplayLocale()
const icons = useDisplayIcons()
const appUi = useDisplayAppUi('alert')
const open = ref<boolean>(defaultOpen)

const resolvedIcon = computed(() =>
  icon === false ? undefined : (icon ?? toneIcon(icons.value, tone)),
)
const plain = computed(() => ['banner', 'callout', 'inline'].includes(appearance))
const titled = computed(() => !isDisplayContentEmpty(title))
const classes = computed(() =>
  resolveDisplayClasses<DisplayAlertSlot>(
    {
      actions:
        appearance === 'banner' ? 'ms-auto flex flex-wrap gap-2' : 'mt-2.5 flex flex-wrap gap-2',
      body: 'min-w-0 flex-1',
      details: 'mt-1.5 text-xs opacity-90',
      icon:
        appearance === 'banner'
          ? 'grid size-9 shrink-0 place-items-center rounded-[var(--nut-display-radius)] bg-[var(--nut-tone-soft)] text-[var(--nut-tone-ink)]'
          : `mt-px size-4.5 shrink-0 ${plain.value ? 'text-[var(--nut-tone-ink)]' : ''}`,
      item: 'flex items-start gap-2',
      itemIcon: 'mt-0.5 size-3.5 shrink-0',
      items: 'mt-1.5 flex flex-col gap-1',
      list: 'mt-1 list-disc ps-4.5 marker:opacity-60',
      message:
        appearance === 'banner' ? 'mt-0.5 text-muted' : titled.value ? 'mt-0.5 opacity-90' : '',
      root: ROOT_CLASSES[appearance],
      title: appearance === 'banner' ? 'font-semibold text-highlighted' : 'font-semibold',
      toggle:
        'mt-1.5 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold underline underline-offset-2',
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
    :role="tone === 'error' || tone === 'warning' ? 'status' : undefined"
    :data-tone="tone"
    :data-appearance="appearance"
    data-display="alert"
  >
    <span v-if="resolvedIcon && appearance === 'banner'" :class="classes.icon">
      <UIcon :name="resolvedIcon" class="size-4.5" />
    </span>
    <UIcon v-else-if="resolvedIcon" :name="resolvedIcon" :class="classes.icon" />
    <div :class="classes.body">
      <div v-if="titled" :class="classes.title"><DisplayRender :content="title" /></div>
      <div v-if="!isDisplayContentEmpty(message)" :class="classes.message">
        <DisplayRender :content="message" />
      </div>
      <div v-if="items?.length" :class="classes.items">
        <div v-for="(item, index) in items" :key="index" :class="classes.item">
          <UIcon :name="item.icon ?? resolvedIcon ?? icons.info" :class="classes.itemIcon" />
          <span class="min-w-0"><DisplayRender :content="item.text" /></span>
        </div>
      </div>
      <ul v-if="list?.length" :class="classes.list">
        <li v-for="(content, index) in list" :key="index"><DisplayRender :content="content" /></li>
      </ul>
      <template v-if="!isDisplayContentEmpty(details)">
        <button type="button" :class="classes.toggle" :aria-expanded="open" @click="open = !open">
          {{ open ? t('display.hideDetails') : t('display.showDetails') }}
          <UIcon
            :name="icons.chevronDown"
            class="size-3.5 transition-transform"
            :class="open ? 'rotate-180' : ''"
          />
        </button>
        <div v-if="open" :class="classes.details"><DisplayRender :content="details" /></div>
      </template>
      <DisplayActions
        v-if="actions?.length && appearance !== 'banner'"
        :actions="actions"
        size="xs"
        :class="classes.actions"
      />
    </div>
    <DisplayActions
      v-if="actions?.length && appearance === 'banner'"
      :actions="actions"
      :class="classes.actions"
    />
  </div>
</template>
