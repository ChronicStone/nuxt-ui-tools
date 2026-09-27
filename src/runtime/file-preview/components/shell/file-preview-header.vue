<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import type { FilePreviewAction, FilePreviewItem } from '../../types'
import { resolveFilePreviewText, splitFilePreviewName } from '../../utils/format'
import FilePreviewButton from './file-preview-button.vue'

const props = defineProps<{
  item: FilePreviewItem
  icon: string
  meta: string
  index: number
  total: number
  loop: boolean
  narrow: boolean
  canExpand: boolean
  expanded: boolean
  details: boolean
}>()

const emit = defineEmits<{
  previous: []
  next: []
  close: []
  expand: []
  details: []
  download: []
  open: []
  action: [action: FilePreviewAction]
}>()

const { t } = useUiToolsLocale()
const name = computed(() => splitFilePreviewName(props.item.name || t('filePreview.untitled')))
const downloadable = computed(() => props.item.file.download !== false)
const actions = computed(() => props.item.file.actions ?? [])
const menu = computed(() => [
  [
    { icon: 'i-lucide-info', label: t('filePreview.details'), onSelect: () => emit('details') },
    ...(downloadable.value
      ? [
          {
            icon: 'i-lucide-download',
            label: t('filePreview.download'),
            onSelect: () => emit('download'),
          },
        ]
      : []),
    {
      icon: 'i-lucide-external-link',
      label: t('filePreview.openInNewTab'),
      onSelect: () => emit('open'),
    },
  ],
  actions.value.map((action) => ({
    icon: action.icon,
    label: resolveFilePreviewText(action.label),
    onSelect: () => emit('action', action),
  })),
])
</script>

<template>
  <header
    class="flex min-h-14 shrink-0 items-center gap-1.5 border-b border-default bg-default py-2 ps-3.5 pe-2 sm:gap-2"
    data-file-preview-header=""
  >
    <span
      class="grid size-8 shrink-0 place-items-center rounded-lg border border-default bg-elevated text-toned"
      aria-hidden="true"
    >
      <UIcon :name="icon" class="size-4" />
    </span>
    <div class="ms-0.5 min-w-0 flex-1">
      <p
        class="m-0 flex min-w-0 text-sm leading-5 font-semibold text-highlighted"
        :title="item.name"
        data-file-preview-name=""
      >
        <span class="overflow-hidden text-ellipsis whitespace-pre">{{ name.head }}</span>
        <span class="shrink-0 whitespace-pre">{{ name.tail }}</span>
      </p>
      <p class="m-0 truncate text-xs text-muted tabular-nums" data-file-preview-meta="">
        {{ meta }}
      </p>
    </div>

    <template v-if="!narrow">
      <div v-if="total > 1" class="flex shrink-0 items-center" data-file-preview-nav="">
        <FilePreviewButton
          icon="i-lucide-chevron-left"
          :label="t('filePreview.previous')"
          :kbds="['arrowleft']"
          :disabled="!loop && index === 0"
          @click="emit('previous')"
        />
        <span
          class="min-w-11 text-center text-xs text-muted tabular-nums"
          data-file-preview-counter=""
        >
          {{ t('filePreview.counter', { current: index + 1, total }) }}
        </span>
        <FilePreviewButton
          icon="i-lucide-chevron-right"
          :label="t('filePreview.next')"
          :kbds="['arrowright']"
          :disabled="!loop && index === total - 1"
          @click="emit('next')"
        />
      </div>
      <span v-if="total > 1" class="mx-1 h-5 w-px shrink-0 bg-(--ui-border)" aria-hidden="true" />
      <slot name="tools" />
      <FilePreviewButton
        icon="i-lucide-info"
        :label="t('filePreview.details')"
        :pressed="details"
        @click="emit('details')"
      />
      <template v-for="(action, position) in actions" :key="position">
        <FilePreviewButton
          v-if="action.icon"
          :icon="action.icon"
          :label="resolveFilePreviewText(action.label)"
          @click="emit('action', action)"
        />
        <UButton
          v-else
          :label="resolveFilePreviewText(action.label)"
          color="neutral"
          variant="ghost"
          size="sm"
          class="shrink-0 text-toned"
          @click="emit('action', action)"
        />
      </template>
      <FilePreviewButton
        v-if="downloadable"
        icon="i-lucide-download"
        :label="t('filePreview.download')"
        @click="emit('download')"
      />
      <FilePreviewButton
        icon="i-lucide-external-link"
        :label="t('filePreview.openInNewTab')"
        @click="emit('open')"
      />
      <span class="mx-1 h-5 w-px shrink-0 bg-(--ui-border)" aria-hidden="true" />
      <FilePreviewButton
        v-if="canExpand"
        :icon="expanded ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
        :label="expanded ? t('filePreview.restore') : t('filePreview.expand')"
        @click="emit('expand')"
      />
    </template>
    <UDropdownMenu v-else :items="menu" :content="{ align: 'end' }">
      <UButton
        icon="i-lucide-ellipsis"
        :aria-label="t('filePreview.moreActions')"
        color="neutral"
        variant="ghost"
        size="sm"
        square
        class="shrink-0 text-muted"
        data-file-preview-menu=""
      />
    </UDropdownMenu>

    <FilePreviewButton
      icon="i-lucide-x"
      :label="t('filePreview.close')"
      :kbds="['escape']"
      data-file-preview-close=""
      @click="emit('close')"
    />
  </header>
</template>
