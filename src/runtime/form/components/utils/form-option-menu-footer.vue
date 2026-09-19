<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
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
    '[data-slot="focusScope"], [data-slot="content"], [data-ui-content]',
  )
  const candidate = scope?.querySelector('[data-slot="viewport"], [role="listbox"]')
  return candidate instanceof HTMLElement ? candidate : null
}

async function loadMore() {
  await props.options.loadMore()
}

async function retry() {
  await props.options.retry()
}

async function refresh() {
  await props.options.refresh()
}
</script>

<template>
  <div v-if="showActions" class="grid gap-1 border-t border-default p-1" data-form-option-footer>
    <UButton
      v-if="options.retryable.value"
      block
      size="xs"
      variant="ghost"
      color="error"
      icon="i-lucide-rotate-ccw"
      data-form-option-retry
      @click.stop="retry"
    >
      {{ t('form.fields.options.retry') }}
    </UButton>
    <UButton
      v-else-if="options.remote.value && options.hasMore.value"
      block
      size="xs"
      variant="ghost"
      color="neutral"
      icon="i-lucide-chevrons-down"
      :loading="options.loadingMore.value"
      data-form-option-load-more
      @click.stop="loadMore"
    >
      {{
        options.loadingMore.value
          ? t('form.fields.options.loadingMore')
          : t('form.fields.options.loadMore')
      }}
    </UButton>
    <span ref="sentinel" aria-hidden="true" class="block h-px w-full" />
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
</template>
