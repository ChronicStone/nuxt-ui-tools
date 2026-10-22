<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import ULink from '@nuxt/ui/components/Link.vue'
import { computed, ref } from 'vue'

import { fileExtensionLabel, fileNameFromUrl, formatFileSize } from '../../../shared/utils/file'
import { isString } from '../../../shared/utils/predicate'
import { useDisplayAppUi } from '../../composables/use-display-config'
import { useDisplayFilePreview } from '../../composables/use-display-file-preview'
import { useDisplayLocale } from '../../composables/use-display-locale'
import { useDisplayUrlActions, useResolvedDisplayUrl } from '../../composables/use-display-url'
import type {
  DisplayAction,
  DisplayMediaImage,
  DisplayMediaProps,
  DisplayMediaSlot,
} from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty, resolveDisplayText } from '../../utils/content'
import { downloadDisplayUrl, openDisplayUrl } from '../../utils/urls'
import DisplayActions from '../parts/display-actions.vue'
import DisplayLoadError from '../parts/display-load-error.vue'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  variant = 'image',
  src = undefined,
  alt = undefined,
  caption = undefined,
  images = undefined,
  max = 3,
  thumbnail = undefined,
  title = undefined,
  duration = undefined,
  name = undefined,
  size = undefined,
  type = undefined,
  pages = undefined,
  href = undefined,
  description = undefined,
  aspect = '16 / 9',
  preview = true,
  actions = undefined,
  loading = false,
  ui = undefined,
} = defineProps<DisplayMediaProps>()

const { t, code } = useDisplayLocale()
const filePreview = useDisplayFilePreview()
const appUi = useDisplayAppUi('media')
const playing = ref<boolean>(false)
const links = useDisplayUrlActions()
// Images and video show their file right away; documents and links resolve theirs on use.
const shown = useResolvedDisplayUrl(() =>
  variant === 'image' || variant === 'video' || (variant === 'gallery' && !images)
    ? src
    : undefined,
)

const gallery = computed<readonly DisplayMediaImage[]>(
  () => images ?? (shown.url.value ? [{ alt, src: shown.url.value }] : []),
)
const tiles = computed(() => gallery.value.slice(0, Math.max(1, max)))
const hiddenCount = computed(() => gallery.value.length - tiles.value.length)
const fileName = computed(() => name ?? (isString(src) ? fileNameFromUrl(src) : ''))
const documentMeta = computed(() =>
  [
    fileExtensionLabel({ name: fileName.value, type }),
    size === undefined ? undefined : formatFileSize(size, code.value),
    pages === undefined ? undefined : t('display.pages', { count: pages }),
  ]
    .filter(Boolean)
    .join(' · '),
)
const documentActions = computed<readonly DisplayAction[]>(
  () =>
    actions ??
    (src
      ? [
          {
            icon: 'i-lucide-eye',
            label: t('display.open'),
            loading: links.pending.value === 'open',
            onClick: openDocument,
          },
          {
            icon: 'i-lucide-download',
            label: t('display.download'),
            loading: links.pending.value === 'download',
            onClick: downloadDocument,
          },
        ]
      : []),
)
const domain = computed(() => {
  if (!isString(href)) return ''
  try {
    return new URL(href).hostname.replace(/^www\./u, '')
  } catch {
    return href
  }
})
const galleryGrid = computed(() => {
  const count = tiles.value.length
  if (count >= 3) return 'grid-cols-[2fr_1fr] grid-rows-2 [&>*:first-child]:row-span-2'
  return count === 2 ? 'grid-cols-2' : 'grid-cols-1'
})
const classes = computed(() =>
  resolveDisplayClasses<DisplayMediaSlot>(
    {
      actions: 'mt-2 flex flex-wrap gap-1.5',
      body: 'min-w-0 flex-1',
      caption: 'flex items-center gap-1.5 text-xs text-muted',
      description: 'line-clamp-2 text-xs text-muted',
      domain: 'flex items-center gap-1.5 text-xs text-muted',
      duration:
        'absolute end-2 bottom-2 rounded-[4px] bg-black/60 px-1.5 py-px text-[11px] font-semibold text-white',
      frame: 'relative w-full overflow-hidden rounded-[var(--nut-display-radius)] bg-elevated',
      grid: `grid w-full gap-1 overflow-hidden rounded-[var(--nut-display-radius)] ${galleryGrid.value}`,
      image: 'size-full object-cover',
      meta: 'mt-0.5 text-xs text-dimmed',
      name: 'text-sm font-semibold break-all text-highlighted',
      overflow:
        'absolute inset-0 grid place-items-center bg-black/50 text-base font-bold text-white',
      page: 'flex h-19 w-15 shrink-0 flex-col gap-1 overflow-hidden rounded-[4px] border border-default bg-white p-1.5',
      play: 'grid size-12 place-items-center rounded-full bg-white/90 text-black shadow-lg transition-transform group-hover:scale-105',
      root:
        variant === 'document'
          ? 'flex min-w-0 gap-3 rounded-[var(--nut-display-radius)] border border-default p-2.5'
          : variant === 'link'
            ? 'flex min-w-0 overflow-hidden rounded-[var(--nut-display-radius)] border border-default transition-colors hover:bg-elevated'
            : 'm-0 flex min-w-0 flex-col gap-1.5',
      thumbnail: 'w-24 shrink-0 object-cover',
      tile: 'relative min-h-0 overflow-hidden bg-elevated',
      title: 'text-sm font-semibold text-highlighted',
    },
    appUi.value,
    ui,
  ),
)

function openImages(index: number) {
  if (!preview) return
  filePreview.open(
    gallery.value.map((image) => ({ name: image.alt, src: image.src })),
    index,
  )
}

function openDocument() {
  if (!src) return
  if (preview && filePreview.open([{ mime: type, name: fileName.value, size, src }])) return
  void links.run('open', () => openDisplayUrl(src))
}

function downloadDocument() {
  if (src) void links.run('download', () => downloadDisplayUrl(src, fileName.value || undefined))
}

function openLink() {
  if (href) void links.run('open', () => openDisplayUrl(href))
}
</script>

<template>
  <DisplaySkeleton
    v-if="loading"
    :layout="variant === 'document' || variant === 'link' ? 'card' : 'media'"
  />
  <figure
    v-else-if="variant === 'image'"
    :class="classes.root"
    data-display="media"
    data-variant="image"
  >
    <component
      :is="preview && filePreview.available ? 'button' : 'div'"
      :type="preview && filePreview.available ? 'button' : undefined"
      :class="[classes.frame, preview && filePreview.available ? 'cursor-zoom-in' : '']"
      :style="{ aspectRatio: aspect }"
      @click="openImages(0)"
    >
      <img
        v-if="shown.url.value"
        :src="shown.url.value"
        :alt="alt ?? ''"
        :class="classes.image"
        loading="lazy"
      />
      <span v-else-if="shown.pending.value" class="nut-dash-shimmer absolute inset-0" />
    </component>
    <figcaption v-if="!isDisplayContentEmpty(caption)" :class="classes.caption">
      <DisplayRender :content="caption" />
    </figcaption>
  </figure>
  <figure
    v-else-if="variant === 'gallery'"
    :class="classes.root"
    data-display="media"
    data-variant="gallery"
  >
    <div :class="classes.grid" :style="{ aspectRatio: aspect }">
      <button
        v-for="(image, index) in tiles"
        :key="index"
        type="button"
        :class="[
          classes.tile,
          preview && filePreview.available ? 'cursor-zoom-in' : 'cursor-default',
        ]"
        @click="openImages(index)"
      >
        <img :src="image.src" :alt="image.alt ?? ''" :class="classes.image" loading="lazy" />
        <span v-if="hiddenCount > 0 && index === tiles.length - 1" :class="classes.overflow"
          >+{{ hiddenCount }}</span
        >
      </button>
    </div>
    <figcaption v-if="!isDisplayContentEmpty(caption)" :class="classes.caption">
      <DisplayRender :content="caption" />
    </figcaption>
  </figure>
  <figure
    v-else-if="variant === 'video'"
    :class="classes.root"
    data-display="media"
    data-variant="video"
  >
    <div :class="[classes.frame, 'bg-black']" :style="{ aspectRatio: aspect }">
      <video
        v-if="playing || !thumbnail"
        :src="shown.url.value"
        :poster="thumbnail"
        :autoplay="playing"
        controls
        preload="metadata"
        :class="classes.image"
      />
      <button
        v-else
        type="button"
        class="group absolute inset-0 grid cursor-pointer place-items-center"
        :aria-label="t('display.play')"
        @click="playing = true"
      >
        <img :src="thumbnail" alt="" :class="[classes.image, 'absolute inset-0']" />
        <span class="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent to-45%" />
        <span :class="[classes.play, 'relative']"
          ><UIcon name="i-lucide-play" class="size-5 translate-x-px"
        /></span>
        <span
          v-if="!isDisplayContentEmpty(title)"
          :class="[classes.title, 'absolute start-3 bottom-2 text-white']"
        >
          <DisplayRender :content="title" />
        </span>
        <span v-if="duration !== undefined" :class="classes.duration">{{
          resolveDisplayText(duration)
        }}</span>
      </button>
    </div>
    <figcaption v-if="!isDisplayContentEmpty(caption)" :class="classes.caption">
      <DisplayRender :content="caption" />
    </figcaption>
  </figure>
  <div
    v-else-if="variant === 'document'"
    :class="classes.root"
    data-display="media"
    data-variant="document"
  >
    <img
      v-if="thumbnail"
      :src="thumbnail"
      alt=""
      :class="[classes.page, 'p-0 object-cover object-top']"
    />
    <div v-else :class="classes.page" aria-hidden="true">
      <i class="mb-0.5 h-1 w-3/5 rounded-full bg-[var(--nut-display-primary)]" />
      <i
        v-for="width in [100, 92, 100, 78, 96, 60]"
        :key="width"
        class="h-0.5 rounded-full bg-[#e5e1db]"
        :style="{ width: `${width}%` }"
      />
    </div>
    <div :class="classes.body">
      <div :class="classes.name">{{ fileName }}</div>
      <div v-if="documentMeta" :class="classes.meta">{{ documentMeta }}</div>
      <div v-if="!isDisplayContentEmpty(description)" :class="classes.description">
        <DisplayRender :content="description" />
      </div>
      <DisplayActions
        v-if="documentActions.length"
        :actions="documentActions"
        size="xs"
        :class="classes.actions"
      />
    </div>
  </div>
  <component
    :is="isString(href) ? ULink : 'button'"
    v-else
    v-bind="isString(href) ? { target: '_blank', to: href } : { type: 'button' }"
    :class="[classes.root, isString(href) ? '' : 'w-full cursor-pointer text-start']"
    :aria-busy="links.pending.value === 'open' || undefined"
    data-display="media"
    data-variant="link"
    @click="isString(href) ? undefined : openLink()"
  >
    <div :class="[classes.body, 'px-3 py-2.5']">
      <div v-if="domain" :class="classes.domain">
        <UIcon name="i-lucide-globe" class="size-3.5 shrink-0" />{{ domain }}
      </div>
      <div :class="[classes.title, 'mt-0.5 flex items-center gap-1.5']">
        <DisplayRender :content="title ?? (isString(href) ? href : undefined)" />
        <UIcon
          v-if="links.pending.value === 'open'"
          name="i-lucide-loader-circle"
          class="size-3.5 shrink-0 animate-spin text-muted"
        />
      </div>
      <div v-if="!isDisplayContentEmpty(description)" :class="classes.description">
        <DisplayRender :content="description" />
      </div>
    </div>
    <img v-if="thumbnail" :src="thumbnail" alt="" :class="classes.thumbnail" loading="lazy" />
  </component>
  <DisplayLoadError
    v-if="!loading && (links.failed.value || shown.failed.value)"
    class="mt-1.5"
    @retry="links.failed.value ? links.failed.value.retry() : shown.retry()"
  />
</template>
