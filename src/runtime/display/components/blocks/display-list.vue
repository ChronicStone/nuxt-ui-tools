<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { fileExtensionLabel, formatFileSize } from '../../../shared/utils/file'
import { isString } from '../../../shared/utils/predicate'
import { useDisplayAppUi } from '../../composables/use-display-config'
import { useDisplayFilePreview } from '../../composables/use-display-file-preview'
import { useDisplayIcons } from '../../composables/use-display-icons'
import { useDisplayLocale } from '../../composables/use-display-locale'
import { useDisplayReveal } from '../../composables/use-display-reveal'
import { useDisplayUrlActions } from '../../composables/use-display-url'
import { vRevealTruncated } from '../../directives/reveal-truncated'
import type {
  DisplayListItem,
  DisplayListProps,
  DisplayListSlot,
  DisplayListVariant,
  DisplayTone,
} from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { displayContentText, isDisplayContentEmpty, resolveDisplayText } from '../../utils/content'
import { displayToneClass } from '../../utils/tone'
import { downloadDisplayUrl, openDisplayUrl } from '../../utils/urls'
import DisplayChip from '../parts/display-chip.vue'
import DisplayEmptyLine from '../parts/display-empty-line.vue'
import DisplayLoadError from '../parts/display-load-error.vue'
import DisplayMore from '../parts/display-more.vue'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  variant = 'bullets',
  title = undefined,
  items,
  columns = 2,
  preview = true,
  max = undefined,
  step = undefined,
  empty = undefined,
  loading = false,
  ui = undefined,
} = defineProps<DisplayListProps>()

const LIST_CLASSES = {
  bullets: 'flex flex-col gap-1.5',
  checks: 'flex flex-col gap-1.5',
  chips: 'flex flex-wrap gap-1.5',
  columns: 'block',
  files:
    'flex flex-col divide-y divide-muted rounded-[var(--nut-display-radius)] border border-default',
  icons: 'flex flex-col gap-1.5',
  numbered: 'flex flex-col gap-1.5',
  steps: 'flex flex-col',
} as const satisfies Record<DisplayListVariant, string>
const ITEM_CLASSES = {
  bullets: 'relative ps-4',
  checks: 'flex items-start gap-2',
  chips: 'inline-flex',
  columns: 'relative mb-1.5 break-inside-avoid ps-4',
  files: 'flex min-w-0 items-center gap-2.5 px-2.5 py-2',
  icons: 'flex items-start gap-2',
  numbered: 'flex items-start gap-2.5',
  steps:
    'relative grid grid-cols-[1.375rem_minmax(0,1fr)] gap-x-2.5 pb-3 before:absolute before:start-[0.6875rem] before:top-6 before:bottom-0 before:w-px before:bg-[var(--ui-border)] last:pb-0 last:before:hidden',
} as const satisfies Record<DisplayListVariant, string>
const MARKER_CLASSES = {
  bullets: 'absolute start-1 top-[0.6em] size-1.5 rounded-full bg-[var(--ui-border-accented)]',
  checks: 'mt-0.5 size-4 shrink-0',
  chips: '',
  columns: 'absolute start-1 top-[0.6em] size-1.5 rounded-full bg-[var(--ui-border-accented)]',
  files:
    'grid h-8 w-7 shrink-0 place-items-center rounded-[4px] bg-[var(--nut-tone)] text-[8.5px] font-extrabold tracking-[0.02em] text-[var(--nut-tone-contrast)]',
  icons: 'mt-0.5 size-4 shrink-0 text-muted',
  numbered:
    'grid size-5 shrink-0 place-items-center rounded-full bg-elevated text-[11px] font-bold text-toned',
  steps: 'grid size-5.5 place-items-center rounded-full text-[11px] font-bold',
} as const satisfies Record<DisplayListVariant, string>
const FILE_TONES: readonly [readonly string[], DisplayTone][] = [
  [['pdf'], 'error'],
  [['xls', 'xlsx', 'csv', 'ods'], 'success'],
  [['doc', 'docx', 'odt', 'txt', 'md'], 'info'],
  [['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'], 'secondary'],
  [['zip', 'rar', '7z', 'gz'], 'warning'],
]

const { t, code } = useDisplayLocale()
const icons = useDisplayIcons()
const filePreview = useDisplayFilePreview()
const links = useDisplayUrlActions()
const appUi = useDisplayAppUi('list')
const reveal = useDisplayReveal({ items: () => items, max: () => max, step: () => step })
const files = computed(() =>
  items.map((item) => ({
    item,
    label: fileExtensionLabel({ name: fileName(item), type: item.type }),
    size: item.size === undefined ? undefined : formatFileSize(item.size, code.value),
  })),
)
const classes = computed(() =>
  resolveDisplayClasses<DisplayListSlot>(
    {
      action: 'ms-auto shrink-0',
      description: variant === 'files' ? 'text-[11px] text-dimmed' : 'text-xs text-muted',
      empty: '',
      item: ITEM_CLASSES[variant],
      list: `m-0 list-none p-0 text-sm ${LIST_CLASSES[variant]}`,
      marker: MARKER_CLASSES[variant],
      meta: 'ms-auto shrink-0 text-xs text-dimmed',
      more: 'self-start',
      root: 'flex min-w-0 flex-col gap-2',
      text: variant === 'files' ? 'truncate font-medium text-highlighted' : 'min-w-0 text-default',
      title: 'text-sm font-semibold text-toned',
    },
    appUi.value,
    ui,
  ),
)
const ordered = computed(() => variant === 'numbered' || variant === 'steps')

function fileName(item: DisplayListItem) {
  return item.name ?? displayContentText(item.text) ?? (isString(item.href) ? item.href : '')
}

function fileTone(item: DisplayListItem): DisplayTone {
  const extension = fileName(item).split('.').at(-1)?.toLowerCase() ?? ''
  return FILE_TONES.find(([extensions]) => extensions.includes(extension))?.[1] ?? 'neutral'
}

function stepState(item: DisplayListItem) {
  if (item.done) return 'done'
  return item.current ? 'current' : 'todo'
}

function stepClass(item: DisplayListItem) {
  const state = stepState(item)
  if (state === 'done')
    return 'bg-[var(--nut-display-success-soft)] text-[var(--nut-display-success-ink)]'
  if (state === 'current')
    return 'bg-[var(--nut-tone)] text-[var(--nut-tone-contrast)] ring-3 ring-[var(--nut-tone-soft)]'
  return 'bg-elevated text-dimmed'
}

function openFile(event: MouseEvent, index: number) {
  const href = items[index]?.href
  if (!href) return
  const previewed =
    preview &&
    filePreview.open(
      items.flatMap((item) =>
        item.href
          ? [{ mime: item.type, name: fileName(item), size: item.size, src: item.href }]
          : [],
      ),
      items.slice(0, index).filter((item) => item.href).length,
    )
  if (previewed) {
    event.preventDefault()
    return
  }
  if (isString(href)) return
  event.preventDefault()
  void links.run(`open-${index}`, () => openDisplayUrl(href))
}

function downloadFile(index: number) {
  const item = items[index]
  if (!item?.href) return
  const href = item.href
  void links.run(`download-${index}`, () => downloadDisplayUrl(href, fileName(item)))
}
</script>

<template>
  <DisplaySkeleton v-if="loading" :count="Math.min(Math.max(items.length, 2), 5)" />
  <div v-else :class="classes.root" data-display="list" :data-variant="variant">
    <div v-if="!isDisplayContentEmpty(title)" v-reveal-truncated :class="classes.title">
      <DisplayRender :content="title" />
    </div>
    <DisplayEmptyLine v-if="!items.length" :content="empty" :class="classes.empty" />
    <component
      :is="ordered ? 'ol' : 'ul'"
      v-else
      :class="classes.list"
      :style="variant === 'columns' ? { columnCount: columns, columnGap: '1.25rem' } : undefined"
    >
      <li
        v-for="(item, index) in reveal.visible.value"
        :key="index"
        :class="[
          classes.item,
          item.tone ? displayToneClass(item.tone) : displayToneClass('primary'),
        ]"
        :data-state="
          variant === 'steps'
            ? stepState(item)
            : variant === 'checks'
              ? item.done
                ? 'done'
                : 'todo'
              : undefined
        "
      >
        <template v-if="variant === 'chips'">
          <DisplayChip
            :chip="{ icon: item.icon, size: 'md', tone: item.tone ?? 'neutral' }"
            :content="item.text"
            :title="resolveDisplayText(item.tooltip)"
          />
        </template>
        <template v-else-if="variant === 'files'">
          <span :class="[classes.marker, displayToneClass(fileTone(item))]" aria-hidden="true">
            {{ files[index]?.label }}
          </span>
          <div class="min-w-0 flex-1">
            <div v-reveal-truncated :class="classes.text">
              <a
                v-if="item.href"
                :href="isString(item.href) ? item.href : '#'"
                target="_blank"
                rel="noopener"
                class="hover:underline"
                :aria-busy="links.pending.value === `open-${index}` || undefined"
                @click="openFile($event, index)"
              >
                <DisplayRender :content="item.text" />
              </a>
              <DisplayRender v-else :content="item.text" />
            </div>
            <div
              v-if="files[index]?.size || !isDisplayContentEmpty(item.description)"
              v-reveal-truncated
              :class="classes.description"
            >
              {{ files[index]?.size
              }}<template v-if="files[index]?.size && !isDisplayContentEmpty(item.description)">
                ·
              </template>
              <DisplayRender :content="item.description" />
            </div>
          </div>
          <UButton
            v-if="item.href"
            :aria-label="t('display.download')"
            :loading="
              links.pending.value === `download-${index}` || links.pending.value === `open-${index}`
            "
            icon="i-lucide-download"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :class="classes.action"
            data-display-download
            @click="downloadFile(index)"
          />
        </template>
        <template v-else>
          <span
            v-if="variant === 'bullets' || variant === 'columns'"
            :class="classes.marker"
            aria-hidden="true"
          />
          <span v-else-if="variant === 'numbered'" :class="classes.marker" aria-hidden="true">{{
            index + 1
          }}</span>
          <UIcon
            v-else-if="variant === 'icons'"
            :name="item.icon ?? icons.chevronRight"
            :class="[classes.marker, item.tone ? 'text-[var(--nut-tone-ink)]' : '']"
          />
          <UIcon
            v-else-if="variant === 'checks'"
            :name="item.done ? icons.success : 'i-lucide-circle'"
            :class="[
              classes.marker,
              item.done ? 'text-[var(--nut-display-success-ink)]' : 'text-dimmed',
            ]"
          />
          <span
            v-else-if="variant === 'steps'"
            :class="[classes.marker, stepClass(item)]"
            aria-hidden="true"
          >
            <UIcon v-if="item.done" :name="icons.check" class="size-3" />
            <template v-else>{{ index + 1 }}</template>
          </span>
          <div class="min-w-0 flex-1">
            <div
              :class="[
                classes.text,
                variant === 'steps'
                  ? stepState(item) === 'todo'
                    ? 'leading-[1.375rem] font-medium text-muted'
                    : 'leading-[1.375rem] font-semibold text-highlighted'
                  : '',
                variant === 'checks' && !item.done ? 'text-muted' : '',
              ]"
            >
              <DisplayRender :content="item.text" />
            </div>
            <div
              v-if="!isDisplayContentEmpty(item.description)"
              v-reveal-truncated
              :class="classes.description"
            >
              <DisplayRender :content="item.description" />
            </div>
          </div>
          <span v-if="!isDisplayContentEmpty(item.meta)" v-reveal-truncated :class="classes.meta"
            ><DisplayRender :content="item.meta"
          /></span>
        </template>
      </li>
    </component>
    <DisplayLoadError v-if="links.failed.value" @retry="links.failed.value?.retry()" />
    <DisplayMore
      v-if="reveal.hidden.value"
      :count="reveal.next.value"
      :class="classes.more"
      @reveal="reveal.reveal"
    />
  </div>
</template>
