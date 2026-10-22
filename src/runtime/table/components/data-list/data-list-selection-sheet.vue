<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDrawer from '@nuxt/ui/components/Drawer.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { isString } from '../../../shared/utils/predicate'
import type { TableActionController } from '../../composables/use-table-actions'
import { useTableInternals } from '../../composables/use-table-internals'
import type {
  DataListButtonProps,
  DataListSelectionActionsProps,
  DataListSelectionActionsUi,
} from '../../types'
import { mergeDataListProps, mergeDataListUiClass } from '../../utils'
import { resolveTableActionLabel } from '../../utils/actions'

const props = defineProps<{
  /** Shows the selection / all-results scope switch at the top of the sheet. */
  scope: boolean
  ui: DataListSelectionActionsUi
  controls: DataListSelectionActionsProps
}>()

const internals = useTableInternals()
const { locale, t } = useUiToolsLocale()
const id = useId()
const open = ref<boolean>(false)
const sheetBody = useTemplateRef<HTMLElement>('sheetBody')
const selectedCount = computed(() => internals.selection.selectedCount.value)
const matchingCount = computed(() => internals.pagination.rowCount.value ?? 0)
const bulkScope = computed(() => internals.selection.bulkScope.value)
const targetsAll = computed(() => props.scope && bulkScope.value === 'all')
const count = computed(() => {
  const template = targetsAll.value
    ? t('table.selectionBar.countAll')
    : selectedCount.value === 1
      ? t('table.selectionBar.countSelectedOne')
      : t('table.selectionBar.countSelectedOther')
  const [before = '', after = ''] = template.split('{count}')
  const value = formatCount(targetsAll.value ? matchingCount.value : selectedCount.value)

  return { after, before, text: `${before}${value}${after}`, value }
})
const scopeOptions = computed(() => [
  {
    count: selectedCount.value,
    label: t('table.selectionBar.selection'),
    value: 'selection' as const,
  },
  { count: matchingCount.value, label: t('table.selectionBar.allResults'), value: 'all' as const },
])
const rows = computed(() => internals.actions.bulkActions.value.map(toRow))
const groups = computed(() =>
  [
    rows.value.filter((row) => !row.destructive),
    rows.value.filter((row) => row.destructive),
  ].filter((group) => group.length),
)
const busy = computed(() => rows.value.some((row) => row.pending))
const triggerProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    {
      color: 'primary',
      label: t('table.selectionBar.actions'),
      size: 'lg',
      trailingIcon: 'i-lucide-chevron-up',
      variant: 'solid',
    },
    props.controls.trigger,
  ),
)
const dismissProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'neutral', icon: 'i-lucide-x', size: 'lg', square: true, variant: 'ghost' },
    props.controls.dismiss,
  ),
)

function formatCount(value: number) {
  return new Intl.NumberFormat(locale.value.code).format(value)
}

function toRow(action: TableActionController) {
  const pending = action.running || action.state.loading
  const icon = isString(action.definition.icon) ? action.definition.icon : undefined

  return {
    action,
    destructive: action.definition.color === 'error',
    detail: (action.state.disabled && action.state.disabledReason) || action.definition.description,
    detailId: `${id}-${action.definition.key}`,
    icon: pending ? 'i-lucide-loader-circle' : icon,
    label: resolveTableActionLabel(action.definition.label) ?? action.definition.key,
    pending,
    unavailable: action.state.disabled || pending,
  }
}

watch(open, async (value) => {
  if (!value) return
  await nextTick()
  sheetBody.value
    ?.querySelector<HTMLElement>(
      '[role="radio"][aria-checked="true"], .nut-dl-selsheet__action:not([aria-disabled])',
    )
    ?.focus({ preventScroll: true })
})

function run(row: ReturnType<typeof toRow>) {
  if (row.unavailable) return
  open.value = false
  void row.action.execute()
}
</script>

<template>
  <div
    :class="
      mergeDataListUiClass(
        'nut-dl-selbar__bar nut-dl-selbar__bar--compact flex h-[60px] w-full items-center gap-1 rounded-[calc(var(--ui-radius)*2+0.5rem)] bg-inverted p-2 text-inverted shadow-[0_20px_50px_-18px_rgb(31_29_26/0.6)]',
        undefined,
        ui.bar,
      )
    "
    role="region"
    :aria-label="t('table.selectionBar.selection')"
  >
    <UButton
      v-bind="dismissProps"
      :aria-label="t('table.selectionBar.clear')"
      :title="t('table.selectionBar.clear')"
      :ui="{
        base: mergeDataListUiClass(
          'nut-dl-selbar__dismiss size-11 shrink-0 justify-center text-inverted/80 hover:bg-white/12 hover:text-inverted focus-visible:outline-2 focus-visible:outline-[var(--ui-text-inverted)] active:bg-white/16 active:text-inverted',
          undefined,
          ui.dismiss,
        ),
      }"
      @click="internals.selection.clearSelection()"
    />

    <span
      :class="
        mergeDataListUiClass(
          'nut-dl-selbar__count min-w-0 flex-1 text-[15px] leading-tight font-semibold',
          undefined,
          ui.count,
        )
      "
      role="status"
    >
      {{ count.before }}<span class="text-primary tabular-nums">{{ count.value }}</span
      >{{ count.after }}
    </span>

    <UDrawer
      v-model:open="open"
      direction="bottom"
      :handle="true"
      :title="t('table.selectionBar.actionsTitle')"
      :ui="{
        header: 'sr-only',
        content: mergeDataListUiClass(
          'nut-dl-sheet nut-dl-selsheet max-h-[85vh] rounded-t-[16px]',
          undefined,
          ui.sheet,
        ),
        container: 'gap-0 p-0',
        body: 'min-h-0 overflow-y-auto p-0 pb-[max(12px,env(safe-area-inset-bottom))]',
      }"
    >
      <UButton
        v-bind="triggerProps"
        :aria-label="t('table.selectionBar.actionsTitle')"
        :loading="busy"
        :ui="{
          base: mergeDataListUiClass(
            'nut-dl-selbar__trigger h-11 shrink-0 rounded-lg px-4 text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-text-inverted)]',
            undefined,
            ui.trigger,
          ),
          trailingIcon: 'size-4',
        }"
      />

      <template #body>
        <div ref="sheetBody">
          <div
            v-if="scope"
            class="nut-dl-selsheet__scope mx-[10px] mt-2 mb-1 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-0.5 rounded-md bg-elevated p-0.5"
            role="radiogroup"
            :aria-label="t('table.selectionBar.selection')"
          >
            <button
              v-for="option in scopeOptions"
              :key="option.value"
              type="button"
              role="radio"
              class="nut-dl-selsheet__scope-btn flex min-h-11 min-w-0 flex-wrap items-center justify-center gap-x-1.5 rounded-[5px] px-1 py-1 text-center text-[13px] leading-tight font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40"
              :class="
                bulkScope === option.value
                  ? 'bg-default text-highlighted shadow-[0_0_0_1px_var(--ui-border)]'
                  : 'text-muted hover:text-default'
              "
              :aria-checked="bulkScope === option.value"
              @click="internals.selection.setBulkScope(option.value)"
            >
              <span>{{ option.label }}</span>
              <b class="font-semibold text-primary tabular-nums">{{ formatCount(option.count) }}</b>
            </button>
          </div>
          <div
            v-else
            class="nut-dl-sheet__title px-5 pt-3 pb-1.5 text-[13px] font-semibold text-muted"
          >
            {{ count.text }}
          </div>

          <div class="px-[10px] pt-1">
            <template v-for="(group, groupIndex) in groups" :key="groupIndex">
              <div v-if="groupIndex" class="my-1 border-t border-default" />
              <button
                v-for="row in group"
                :key="row.action.definition.key"
                type="button"
                class="nut-dl-sheet__row nut-dl-selsheet__action flex min-h-[46px] w-full items-center gap-[10px] rounded-lg px-[10px] py-2 text-left text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
                :class="
                  row.unavailable
                    ? 'cursor-not-allowed text-dimmed'
                    : row.destructive
                      ? 'text-error active:bg-error/10'
                      : 'text-highlighted active:bg-elevated'
                "
                :aria-disabled="row.unavailable || undefined"
                :aria-describedby="row.detail ? row.detailId : undefined"
                @click="run(row)"
              >
                <UIcon
                  v-if="row.icon"
                  :name="row.icon"
                  class="size-4 shrink-0"
                  :class="[
                    row.pending ? 'animate-spin motion-reduce:animate-none' : '',
                    row.destructive && !row.unavailable ? 'text-error' : 'text-muted',
                  ]"
                />
                <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span class="nut-dl-selsheet__label">{{ row.label }}</span>
                  <span
                    v-if="row.detail"
                    :id="row.detailId"
                    class="nut-dl-selsheet__detail text-[12.5px] leading-snug text-muted"
                  >
                    {{ row.detail }}
                  </span>
                </span>
              </button>
            </template>
          </div>
        </div>
      </template>
    </UDrawer>
  </div>
</template>
