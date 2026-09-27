<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UProgress from '@nuxt/ui/components/Progress.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { fileExtensionLabel, fileIconName, formatFileSize } from '../../../shared/utils/file'
import type { FormUploadItem } from './use-upload-items'

const props = defineProps<{
  item: FormUploadItem
  disabled?: boolean
  compact?: boolean
  replaceable?: boolean
}>()

const emit = defineEmits<{
  open: []
  start: []
  cancel: []
  retry: []
  remove: []
  replace: []
}>()

const { code, t } = useUiToolsLocale()

const icon = computed(() => fileIconName(props.item.type))
const meta = computed(() => {
  if (props.item.description) return props.item.description
  const extension = fileExtensionLabel({ name: props.item.name, type: props.item.type })
  return props.item.size === null
    ? extension
    : `${extension} · ${formatFileSize(props.item.size, code.value)}`
})
const status = computed(() => {
  if (props.item.status === 'uploading')
    return props.item.progress === null
      ? t('form.fields.upload.uploading')
      : `${t('form.fields.upload.uploading')} ${Math.round(props.item.progress)} %`
  if (props.item.status === 'queued') return t('form.fields.upload.queued')
  return props.item.status === 'failed' ? props.item.error : null
})
</script>

<template>
  <li
    class="flex w-full min-w-0 items-center rounded-lg border bg-default"
    :class="[
      compact ? 'gap-2 px-2 py-1.5' : 'gap-3 px-3 py-2',
      item.status === 'failed' ? 'border-error/40' : 'border-default',
    ]"
    :data-form-upload-item="item.status"
  >
    <img
      v-if="item.thumbnail"
      :src="item.thumbnail"
      :alt="item.name"
      class="shrink-0 rounded-md border border-default bg-white object-contain p-0.5"
      :class="compact ? 'size-7' : 'size-10'"
    />
    <span
      v-else
      class="grid shrink-0 place-items-center rounded-md border border-default bg-elevated text-muted"
      :class="compact ? 'size-7' : 'size-10'"
    >
      <UIcon :name="icon" :class="compact ? 'size-4' : 'size-5'" aria-hidden="true" />
    </span>

    <span class="min-w-0 flex-1" :aria-busy="item.resolving || undefined">
      <template v-if="item.resolving">
        <span class="block h-3.5 w-2/3 animate-pulse rounded bg-elevated" />
        <span v-if="!compact" class="mt-1.5 block h-3 w-1/3 animate-pulse rounded bg-elevated" />
      </template>
      <template v-else>
        <button
          v-if="item.openable"
          type="button"
          class="block max-w-full truncate text-left text-sm font-medium text-highlighted underline-offset-2 outline-none hover:underline focus-visible:underline"
          :title="t('form.fields.upload.open')"
          data-form-upload-open=""
          @click="emit('open')"
        >
          {{ item.name }}
        </button>
        <span
          v-else
          class="block truncate text-sm font-medium text-highlighted"
          data-form-upload-name=""
        >
          {{ item.name }}
        </span>
        <span
          v-if="!compact || status"
          class="block truncate text-xs"
          :class="item.status === 'failed' ? 'text-error' : 'text-muted'"
          :role="item.status === 'failed' ? 'alert' : undefined"
          data-form-upload-meta=""
        >
          {{ status ?? meta }}
        </span>
      </template>
      <UProgress
        v-if="item.status === 'uploading'"
        :model-value="item.progress"
        size="xs"
        class="mt-1.5"
        data-form-upload-progress=""
      />
    </span>

    <span class="flex shrink-0 items-center gap-0.5">
      <UButton
        v-if="item.status === 'queued'"
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-upload"
        :disabled="disabled"
        :aria-label="t('form.fields.upload.upload')"
        :title="t('form.fields.upload.upload')"
        data-form-upload-start=""
        @click="emit('start')"
      />
      <UButton
        v-if="item.status === 'failed'"
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-rotate-cw"
        :disabled="disabled"
        :aria-label="t('form.fields.upload.retry')"
        :title="t('form.fields.upload.retry')"
        data-form-upload-retry=""
        @click="emit('retry')"
      />
      <UButton
        v-if="item.status === 'stored' && replaceable"
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-refresh-cw"
        :disabled="disabled"
        :aria-label="t('form.fields.upload.replace')"
        :title="t('form.fields.upload.replace')"
        data-form-upload-replace=""
        @click="emit('replace')"
      />
      <UButton
        v-if="item.status === 'uploading'"
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        :aria-label="t('form.fields.upload.cancel')"
        :title="t('form.fields.upload.cancel')"
        data-form-upload-cancel=""
        @click="emit('cancel')"
      />
      <UButton
        v-else
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-trash-2"
        :disabled="disabled"
        :aria-label="t('form.fields.upload.remove')"
        :title="t('form.fields.upload.remove')"
        data-form-upload-remove=""
        @click="emit('remove')"
      />
    </span>
  </li>
</template>
