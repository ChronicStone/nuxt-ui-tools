<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { isString } from '../../../shared/utils/predicate'
import { useDataListBreakpoint } from '../../composables/use-data-list-breakpoint'
import { useDataListUi } from '../../composables/use-data-list-ui'
import type { TableActionController } from '../../composables/use-table-actions'
import { useTableInternals } from '../../composables/use-table-internals'
import type {
  DataListButtonProps,
  DataListControlSize,
  DataListSelectionActionsProps,
  DataListSelectionActionsUi,
  GenericObject,
  TableActionSlotProps,
  TableApi,
  TableRuntimeRecord,
} from '../../types'
import { mergeDataListProps, mergeDataListUiClass } from '../../utils'
import { resolveTableActionLabel } from '../../utils/actions'

const props = withDefaults(
  defineProps<{
    size?: DataListControlSize
    /** `absolute` docks the bar inside the nearest positioned ancestor; `fixed` pins it to the viewport. */
    position?: 'absolute' | 'fixed'
    /** Number of actions rendered inline before the overflow menu. */
    maxVisible?: number
    /** Shows the selection / all-results scope switch when the schema allows an `all` scope. */
    scope?: boolean
    ui?: DataListSelectionActionsUi
    props?: DataListSelectionActionsProps
  }>(),
  { maxVisible: undefined, position: 'absolute', scope: true },
)
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { isMobile } = useDataListBreakpoint()
const { locale, t } = useUiToolsLocale()
const config = computed(() => dataListUi.ui.value.selectionActions)
const size = computed(() => props.size ?? config.value?.size ?? 'sm')
const ui = computed<DataListSelectionActionsUi>(() => ({ ...config.value?.ui, ...props.ui }))
const controlProps = computed<DataListSelectionActionsProps>(() =>
  mergeDataListProps(config.value?.props, props.props),
)
const actionProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'neutral', size: size.value, variant: 'ghost' },
    controlProps.value.action,
  ),
)
const overflowProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    {
      color: 'neutral',
      icon: 'i-lucide-ellipsis-vertical',
      size: size.value,
      square: true,
      variant: 'ghost',
    },
    controlProps.value.overflow,
  ),
)
const dismissProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'neutral', icon: 'i-lucide-x', size: size.value, square: true, variant: 'ghost' },
    controlProps.value.dismiss,
  ),
)

const actions = computed(() => internals.actions.bulkActions.value)
const selectedCount = computed(() => internals.selection.selectedCount.value)
const matchingCount = computed(() => internals.pagination.rowCount.value)
const scopeEnabled = computed(
  () =>
    props.scope &&
    internals.schema.value.selection?.scope !== 'page' &&
    matchingCount.value != null &&
    matchingCount.value > 0,
)
const bulkScope = computed(() => internals.selection.bulkScope.value)
const maxVisible = computed(() => props.maxVisible ?? (isMobile.value ? 1 : 3))
const visibleActions = computed(() => actions.value.slice(0, maxVisible.value))
const overflowActions = computed(() => actions.value.slice(maxVisible.value))
const overflowItems = computed(() =>
  overflowActions.value.map((action) => ({
    disabled: action.state.disabled,
    icon: isString(action.definition.icon) ? action.definition.icon : undefined,
    label: resolveTableActionLabel(action.definition.label) ?? action.definition.key,
    onSelect: () => action.execute(),
  })),
)
const { selection } = internals.tableApi

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

function formatCount(value: number) {
  return new Intl.NumberFormat(locale.value.code).format(value)
}

function clearSelection() {
  internals.selection.clearSelection()
}
</script>

<template>
  <Transition name="nut-dl-selbar">
    <div
      v-if="selectedCount > 0 && actions.length"
      :class="
        mergeDataListUiClass(
          `nut-dl-selbar pointer-events-none z-40 flex justify-center px-4 ${position === 'fixed' ? 'fixed inset-x-0 bottom-4' : 'absolute inset-x-0 bottom-[22px]'}`,
          undefined,
          ui.root,
        )
      "
    >
      <div class="pointer-events-auto flex max-w-full justify-center">
        <slot
          :actions="actions"
          :selected-count="selectedCount"
          :selection="selection"
          :clear-selection="clearSelection"
        >
          <div
            :class="
              mergeDataListUiClass(
                'nut-dl-selbar__bar flex h-11 max-w-[min(840px,100%)] items-center gap-2.5 rounded-[10px] bg-inverted px-1.5 text-[13px] text-inverted shadow-[0_20px_50px_-18px_rgb(31_29_26/0.6)]',
                undefined,
                ui.bar,
              )
            "
            role="region"
            :aria-label="t('table.selectionBar.selection')"
          >
            <div
              v-if="scopeEnabled"
              :class="
                mergeDataListUiClass(
                  'nut-dl-selbar__scope flex shrink-0 items-center gap-0.5 rounded-lg bg-white/8 p-0.5',
                  undefined,
                  ui.scope,
                )
              "
            >
              <button
                type="button"
                class="nut-dl-selbar__scope-btn flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium whitespace-nowrap transition-colors"
                :class="
                  bulkScope === 'selection'
                    ? 'bg-white/16 text-inverted'
                    : 'text-inverted/60 hover:text-inverted'
                "
                @click="internals.selection.setBulkScope('selection')"
              >
                <span>{{ t('table.selectionBar.selection') }}</span>
                <b class="font-semibold text-primary">{{ formatCount(selectedCount) }}</b>
              </button>
              <button
                type="button"
                class="nut-dl-selbar__scope-btn flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium whitespace-nowrap transition-colors"
                :class="
                  bulkScope === 'all'
                    ? 'bg-white/16 text-inverted'
                    : 'text-inverted/60 hover:text-inverted'
                "
                @click="internals.selection.setBulkScope('all')"
              >
                <span>{{ t('table.selectionBar.allResults') }}</span>
                <b
                  class="font-semibold"
                  :class="bulkScope === 'all' ? 'text-primary' : 'text-primary/70'"
                >
                  {{ formatCount(matchingCount ?? 0) }}
                </b>
              </button>
            </div>
            <span
              v-else
              :class="
                mergeDataListUiClass(
                  'nut-dl-selbar__count px-2 font-semibold whitespace-nowrap',
                  undefined,
                  ui.count,
                )
              "
              role="status"
            >
              {{ t('table.selectionBar.selection') }}
              <b class="text-primary">{{ formatCount(selectedCount) }}</b>
            </span>

            <div
              :class="
                mergeDataListUiClass(
                  `nut-dl-selbar__actions flex min-w-0 items-center gap-0.5 ${scopeEnabled ? 'ml-1 pl-2' : ''}`,
                  undefined,
                  ui.actions,
                )
              "
            >
              <template v-for="action in visibleActions" :key="action.definition.key">
                <slot name="action" v-bind="action">
                  <UButton
                    v-bind="actionProps"
                    :icon="isString(action.definition.icon) ? action.definition.icon : undefined"
                    :label="
                      resolveTableActionLabel(action.definition.label) ?? action.definition.key
                    "
                    :disabled="action.state.disabled"
                    :loading="action.state.loading || action.running"
                    :ui="{
                      base: mergeDataListUiClass(
                        'nut-dl-selbar__action h-8 px-2.5 text-[12.5px] font-medium text-inverted/90 hover:bg-white/12 hover:text-inverted',
                        undefined,
                        ui.action,
                      ),
                      leadingIcon: 'size-3.5',
                    }"
                    @click="action.execute"
                  />
                </slot>
              </template>
              <UDropdownMenu
                v-if="overflowActions.length"
                :items="overflowItems"
                :content="{ side: 'top', align: 'end', sideOffset: 8 }"
                :ui="{ content: 'min-w-52' }"
              >
                <UButton
                  v-bind="overflowProps"
                  :aria-label="t('table.selectionBar.more')"
                  :ui="{
                    base: mergeDataListUiClass(
                      'nut-dl-selbar__more h-8 w-8 text-inverted/90 hover:bg-white/12 hover:text-inverted',
                      undefined,
                      ui.overflow,
                    ),
                  }"
                />
              </UDropdownMenu>
            </div>

            <UButton
              v-bind="dismissProps"
              :aria-label="t('table.selectionBar.clear')"
              :title="t('table.selectionBar.clear')"
              :ui="{
                base: mergeDataListUiClass(
                  'nut-dl-selbar__dismiss h-8 w-8 text-inverted hover:bg-white/12',
                  undefined,
                  ui.dismiss,
                ),
              }"
              @click="clearSelection"
            />
          </div>
        </slot>
      </div>
    </div>
  </Transition>
</template>

<style>
.nut-dl-selbar-enter-active,
.nut-dl-selbar-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.nut-dl-selbar-enter-from,
.nut-dl-selbar-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
@media (prefers-reduced-motion: reduce) {
  .nut-dl-selbar-enter-active,
  .nut-dl-selbar-leave-active {
    transition: opacity 80ms linear;
  }
  .nut-dl-selbar-enter-from,
  .nut-dl-selbar-leave-to {
    transform: none;
  }
}
</style>
