<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { resolveTextValue } from '../../../shared/utils/render'
import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListButtonProps, DataListControlSize } from '../../types'
import { mergeDataListProps, mergeDataListUiClass } from '../../utils'

const props = defineProps<{
  minHeight?: string
  size?: DataListControlSize
}>()
const { t } = useUiToolsLocale()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const ui = computed(() => dataListUi.ui.value.table?.ui)
const filtered = computed(
  () => internals.filters.hasActiveUiFilters.value || Boolean(internals.filters.searchQuery.value),
)
/** A list with no records at all: the schema's `empty` over the app's, field by field. */
const custom = computed(() => {
  if (filtered.value) return undefined
  const own = internals.schema.value.empty
  const app = dataListUi.ui.value.table?.props?.empty
  return {
    action: own?.action ?? app?.action,
    description: own?.description ?? app?.description,
    icon: own?.icon ?? app?.icon,
    title: own?.title ?? app?.title,
  }
})
const icon = computed(
  () => custom.value?.icon ?? (filtered.value ? 'i-lucide-search-x' : 'i-lucide-inbox'),
)
const title = computed(() =>
  resolveTextValue(
    custom.value?.title,
    filtered.value ? t('table.states.empty.filteredTitle') : t('table.states.empty.title'),
  ),
)
const description = computed(() => {
  if (custom.value?.description === false) return ''
  return (
    resolveTextValue(custom.value?.description) ||
    (filtered.value
      ? t('table.states.empty.filteredDescription')
      : t('table.states.empty.description'))
  )
})
const action = computed(() => {
  const configured = custom.value?.action
  if (!configured) return undefined
  const { label, onClick, ...button } = configured
  return {
    button: mergeDataListProps<DataListButtonProps>({ color: 'primary', size: 'md' }, button),
    label: resolveTextValue(label),
    onClick,
  }
})

function reset() {
  internals.filters.clearAllFilters()
  internals.filters.searchQuery.value = ''
}
</script>

<template>
  <div
    :class="
      mergeDataListUiClass(
        'nut-dl-empty flex h-full w-full flex-col items-center justify-center px-6 py-12 text-center',
        undefined,
        ui?.empty,
      )
    "
    :style="{ minHeight: props.minHeight }"
    role="status"
  >
    <div class="nut-dl-empty__art relative mb-4 flex size-14 items-center justify-center">
      <span
        class="nut-dl-empty__ring absolute inset-0 rounded-2xl bg-elevated ring ring-inset ring-default"
      />
      <span
        class="nut-dl-empty__ring nut-dl-empty__ring--back absolute inset-1.5 -z-10 rotate-6 rounded-xl bg-muted"
      />
      <UIcon :name="icon" class="nut-dl-empty__icon relative size-5 text-muted" />
    </div>
    <div class="nut-dl-empty__title text-[14px] font-medium text-highlighted">{{ title }}</div>
    <p
      v-if="description"
      class="nut-dl-empty__description mt-1 max-w-[34ch] text-[12.5px] leading-relaxed text-muted"
    >
      {{ description }}
    </p>
    <div
      v-if="filtered || action || $slots.actions"
      class="nut-dl-empty__actions mt-4 flex items-center gap-2"
    >
      <slot name="actions">
        <UButton
          v-if="filtered"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-rotate-ccw"
          :label="t('table.states.empty.reset')"
          :ui="{ base: mergeDataListUiClass('nut-dl-empty__action', undefined, ui?.emptyAction) }"
          @click="reset"
        />
        <UButton
          v-else-if="action"
          v-bind="action.button"
          :label="action.label"
          :ui="{ base: mergeDataListUiClass('nut-dl-empty__action', undefined, ui?.emptyAction) }"
          @click="action.onClick"
        />
      </slot>
    </div>
  </div>
</template>

<style>
.nut-dl-empty {
  animation: nut-dl-empty-in 0.24s cubic-bezier(0.2, 0.9, 0.3, 1) both;
}
.nut-dl-empty__ring--back {
  opacity: 0.7;
}
@keyframes nut-dl-empty-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .nut-dl-empty {
    animation: none;
  }
}
</style>
