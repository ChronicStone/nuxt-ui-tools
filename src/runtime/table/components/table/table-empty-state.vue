<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize } from '../../types'
import { mergeDataListUiClass } from '../../utils'

const props = defineProps<{
  minHeight: string
  size?: DataListControlSize
}>()
const { t } = useUiToolsLocale()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const ui = computed(() => dataListUi.ui.value.table?.ui)
const emptyProps = computed(() => dataListUi.ui.value.table?.props?.empty)
const filtered = computed(
  () => internals.filters.hasActiveUiFilters.value || Boolean(internals.filters.searchQuery.value),
)
const icon = computed(
  () => emptyProps.value?.icon ?? (filtered.value ? 'i-lucide-search-x' : 'i-lucide-inbox'),
)
const title = computed(
  () =>
    emptyProps.value?.title ??
    (filtered.value ? t('table.states.empty.filteredTitle') : t('table.states.empty.title')),
)
const description = computed(() => {
  if (emptyProps.value?.description === false) {
    return ''
  }
  return (
    emptyProps.value?.description ||
    (filtered.value
      ? t('table.states.empty.filteredDescription')
      : t('table.states.empty.description'))
  )
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
      v-if="filtered || $slots.actions"
      class="nut-dl-empty__actions mt-4 flex items-center gap-2"
    >
      <slot name="actions">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-rotate-ccw"
          :label="t('table.states.empty.reset')"
          @click="reset"
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
