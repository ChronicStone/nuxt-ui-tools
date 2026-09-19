<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useEventListener } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import type { FormOptionRuntimeState } from '../../types'

const props = defineProps<{
  options: FormOptionRuntimeState
  disabled?: boolean
  showCreate?: boolean
  createLabel?: string
}>()

const emit = defineEmits<{
  create: []
}>()
const { t } = useUiToolsLocale()

const sentinel = ref<HTMLElement | null>(null)
const showMore = computed(
  () =>
    props.options.remote.value && (props.options.hasMore.value || props.options.retryable.value),
)
const showActions = computed(
  () => props.options.refreshable.value || props.showCreate === true || showMore.value,
)
const viewport = ref<HTMLElement | null>(null)

watch(
  sentinel,
  (element) => {
    viewport.value = findScrollViewport(element)
  },
  { immediate: true },
)

useEventListener(viewport, 'scroll', handleViewportScroll, { passive: true })

function handleViewportScroll() {
  const element = viewport.value
  if (!element || !props.options.hasMore.value || props.options.loadingMore.value) {
    return
  }
  const distance = props.options.prefetchDistance.value
  const threshold = distance === 'viewport' ? element.clientHeight : Math.max(0, distance)
  if (element.scrollHeight - element.scrollTop - element.clientHeight <= threshold) {
    void props.options.loadMore()
  }
}

function findScrollViewport(element: HTMLElement | null) {
  const scope = element?.closest(
    '[data-slot="focusScope"], [data-slot="content"], [data-ui-content], [data-form-tree-scope]',
  )
  const candidate = scope?.querySelector('[data-slot="viewport"], [role="listbox"], [role="tree"]')
  return candidate instanceof HTMLElement ? candidate : null
}

async function retry() {
  await props.options.retry()
}

async function refresh() {
  await props.options.refresh()
}
</script>

<template>
  <div v-if="showActions" data-form-option-footer>
    <div
      v-if="options.remote.value && options.loadingMore.value"
      class="flex items-center justify-center gap-2 px-2 py-1.5 text-xs text-muted"
      data-form-option-loading
    >
      <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin" aria-hidden="true" />
      {{ t('form.fields.options.loadingMore') }}
    </div>
    <div
      v-else-if="options.retryable.value"
      class="flex items-center justify-between gap-2 border-t border-default px-2 py-1.5 text-xs text-error"
      data-form-option-error
    >
      <span class="truncate">{{ t('form.fields.options.loadError') }}</span>
      <UButton
        size="xs"
        variant="link"
        color="error"
        class="p-0"
        data-form-option-retry
        @click.stop="retry"
      >
        {{ t('form.fields.options.retry') }}
      </UButton>
    </div>
    <span ref="sentinel" aria-hidden="true" class="block h-px w-full" />
    <div
      v-if="options.refreshable.value || showCreate"
      class="grid gap-1 border-t border-default p-1"
      :class="options.refreshable.value && showCreate ? 'sm:grid-cols-2' : 'grid-cols-1'"
    >
      <UButton
        v-if="options.refreshable.value"
        block
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-lucide-refresh-cw"
        :loading="options.pending.value || options.fetching.value"
        @click.stop="refresh"
      >
        {{ t('form.fields.options.refresh') }}
      </UButton>
      <UButton
        v-if="showCreate"
        block
        size="xs"
        variant="ghost"
        color="primary"
        icon="i-lucide-plus"
        :loading="options.creating.value"
        :disabled="disabled || options.creating.value"
        @click.stop="emit('create')"
      >
        {{ createLabel ?? t('form.fields.options.create') }}
      </UButton>
    </div>
  </div>
</template>
