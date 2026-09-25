<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import type { DataListContentUi, DataListControlSize } from '../../types'
import { mergeDataListUiClass } from '../../utils'

const props = defineProps<{
  minHeight?: string
  size?: DataListControlSize
  ui?: DataListContentUi
  /** Replaces the localized default title. */
  title?: string
  /** Replaces the localized default description. */
  description?: string
  /** Support reference shown under the description, such as a request identifier. */
  reference?: string
  icon?: string
}>()
const emit = defineEmits<{ retry: [] }>()
const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const rootUi = computed(() => dataListUi.ui.value.content?.ui)
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.content?.size ?? dataListUi.controlSize.value,
)
const resolvedTitle = computed(() => props.title ?? t('table.states.gridError.title'))
const resolvedDescription = computed(
  () => props.description ?? t('table.states.gridError.description'),
)
</script>

<template>
  <div
    :class="
      mergeDataListUiClass(
        'nut-dl-error flex w-full flex-col items-center justify-center px-6 py-12 text-center',
        rootUi?.error,
        ui?.error,
      )
    "
    :style="{ minHeight }"
    role="alert"
  >
    <div
      :class="
        mergeDataListUiClass(
          'nut-dl-error__art relative mb-4 flex size-14 items-center justify-center',
          rootUi?.errorIcon,
          ui?.errorIcon,
        )
      "
    >
      <span
        class="nut-dl-error__ring absolute inset-0 rounded-2xl bg-error/10 ring ring-inset ring-error/15"
      />
      <span
        class="nut-dl-error__ring nut-dl-error__ring--back absolute inset-1.5 -z-10 -rotate-6 rounded-xl bg-error/5"
      />
      <UIcon :name="icon ?? 'i-lucide-cloud-alert'" class="relative size-5 text-error" />
    </div>
    <div :class="mergeDataListUiClass('min-w-0 max-w-md', rootUi?.errorCopy, ui?.errorCopy)">
      <div
        :class="
          mergeDataListUiClass(
            'nut-dl-error__title text-[14px] font-medium text-highlighted',
            rootUi?.errorTitle,
            ui?.errorTitle,
          )
        "
      >
        {{ resolvedTitle }}
      </div>
      <p
        :class="
          mergeDataListUiClass(
            'nut-dl-error__description mx-auto mt-1 max-w-[40ch] text-[12.5px] leading-relaxed text-muted',
            rootUi?.errorDescription,
            ui?.errorDescription,
          )
        "
      >
        {{ resolvedDescription }}
      </p>
      <code
        v-if="reference"
        class="nut-dl-error__reference mt-2.5 inline-block rounded-md bg-elevated px-2 py-1 font-mono text-[11.5px] text-muted select-all"
      >
        {{ reference }}
      </code>
    </div>
    <div
      :class="
        mergeDataListUiClass(
          'nut-dl-error__actions mt-4 flex items-center gap-2',
          rootUi?.errorBody,
          ui?.errorBody,
        )
      "
    >
      <UButton
        color="neutral"
        variant="outline"
        :size="resolvedSize"
        icon="i-lucide-refresh-cw"
        :ui="{ base: mergeDataListUiClass(rootUi?.retry, ui?.retry) }"
        @click="emit('retry')"
      >
        {{ t('table.states.gridError.action') }}
      </UButton>
      <slot name="actions" />
    </div>
  </div>
</template>

<style>
.nut-dl-error {
  animation: nut-dl-error-in 0.24s cubic-bezier(0.2, 0.9, 0.3, 1) both;
}
@keyframes nut-dl-error-in {
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
  .nut-dl-error {
    animation: none;
  }
}
</style>
