<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { isString } from '../../../shared/utils/predicate'
import { useDataListUi } from '../../composables/use-data-list-ui'
import type { TableActionController } from '../../composables/use-table-actions'
import { useTableInternals } from '../../composables/use-table-internals'
import type {
  DataListControlSize,
  GenericObject,
  TableActionSlotProps,
  TableApi,
  TableRuntimeRecord,
} from '../../types'
import { resolveDataListControlGeometry } from '../../utils'
import { resolveTableActionLabel } from '../../utils/actions'

const props = defineProps<{ size?: DataListControlSize }>()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { locale, t } = useUiToolsLocale()
const size = computed(() => props.size ?? dataListUi.controlSize.value)
const geometry = computed(() => resolveDataListControlGeometry(size.value))
const actions = computed(() => internals.actions.bulkActions.value)
const selectedCount = computed(() => internals.selection.selectedCount.value)
const selection = internals.tableApi.selection
const summary = computed(() =>
  t('table.footer.rowsSelected', {
    selected: new Intl.NumberFormat(locale.value.code).format(selectedCount.value),
    total: new Intl.NumberFormat(locale.value.code).format(
      internals.pagination.rowCount.value ?? selectedCount.value,
    ),
  }),
)

type TableActionSlot = TableActionSlotProps<GenericObject, TableRuntimeRecord, TableRuntimeRecord>

defineSlots<{
  default?: (props: {
    actions: TableActionController[]
    selectedCount: number
    selection: TableApi['selection']
    clearSelection: () => void
  }) => import('vue').VNodeChild
  action?: (props: TableActionSlot) => import('vue').VNodeChild
}>()

function clearSelection() {
  internals.selection.clearSelection()
}
</script>

<template>
  <Transition name="table-selection-actions">
    <div
      v-if="selectedCount > 0 && actions.length"
      class="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
    >
      <div class="pointer-events-auto flex max-w-full justify-center">
        <slot
          :actions="actions"
          :selected-count="selectedCount"
          :selection="selection"
          :clear-selection="clearSelection"
        >
          <div
            :class="[
              'flex max-w-full flex-wrap items-center justify-center rounded-xl border border-default bg-default/95 shadow-lg shadow-default/10 backdrop-blur',
              geometry.floating,
            ]"
          >
            <span :class="['px-1 font-medium text-highlighted', geometry.text]" role="status">
              {{ summary }}
            </span>
            <div :class="['flex min-w-0 flex-wrap items-center justify-center', geometry.toolbarGap]">
              <template v-for="action in actions" :key="action.definition.key">
                <slot name="action" v-bind="action">
                  <UButton
                    color="neutral"
                    variant="soft"
                    :size="size"
                    :icon="isString(action.definition.icon) ? action.definition.icon : undefined"
                    :label="
                      resolveTableActionLabel(action.definition.label) ?? action.definition.key
                    "
                    :disabled="action.state.disabled"
                    :loading="action.state.loading || action.running"
                    @click="action.execute"
                  />
                </slot>
              </template>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              :size="size"
              icon="i-lucide-x"
              :aria-label="t('table.controls.clearSelection')"
              :title="t('table.controls.clearSelection')"
              @click="clearSelection"
            />
          </div>
        </slot>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.table-selection-actions-enter-active,
.table-selection-actions-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

.table-selection-actions-enter-from,
.table-selection-actions-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .table-selection-actions-enter-active,
  .table-selection-actions-leave-active {
    transition: opacity 80ms linear;
  }

  .table-selection-actions-enter-from,
  .table-selection-actions-leave-to {
    transform: none;
  }
}
</style>
