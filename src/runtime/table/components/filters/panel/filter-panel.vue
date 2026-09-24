<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import USlideover from '@nuxt/ui/components/Slideover.vue'
import { computed, onMounted, watch } from 'vue'
import type { VNodeChild } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { isNullish } from '../../../../shared/utils/predicate'
import { useDataListBreakpoint } from '../../../composables/use-data-list-breakpoint'
import { useDataListUi } from '../../../composables/use-data-list-ui'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  DataListBadgeProps,
  DataListButtonProps,
  DataListControlSize,
  DataListFilterPanelCommitMode,
  DataListFilterPanelMode,
  DataListFilterPanelProps,
  DataListFilterPanelUi,
} from '../../../types'
import { mergeDataListProps, mergeDataListUiClass } from '../../../utils'
import FilterPanelFields from './filter-panel-fields.vue'

const props = withDefaults(
  defineProps<{
    size?: DataListControlSize
    description?: string
    ui?: DataListFilterPanelUi
    props?: DataListFilterPanelProps
    mode?: DataListFilterPanelMode
    commitMode?: DataListFilterPanelCommitMode
  }>(),
  { commitMode: 'submit', mode: 'drawer' },
)
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { isMobile } = useDataListBreakpoint()
const { locale, t } = useUiToolsLocale()
const config = computed(() => dataListUi.ui.value.filterPanel)
const resolvedUi = computed<DataListFilterPanelUi>(() => ({ ...config.value?.ui, ...props.ui }))
const resolvedSize = computed(
  () => props.size ?? config.value?.size ?? dataListUi.controlSize.value,
)
const controlProps = computed<DataListFilterPanelProps>(() =>
  mergeDataListProps(config.value?.props, props.props),
)
const triggerProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'neutral', icon: 'i-lucide-funnel', size: resolvedSize.value, variant: 'outline' },
    controlProps.value.trigger,
  ),
)
const triggerBind = computed(() => {
  const { label: _label, ...rest } = triggerProps.value
  return rest
})
const triggerLabel = computed(() => triggerProps.value.label ?? t('table.filters.panel.trigger'))
const countProps = computed(() =>
  controlProps.value.count === false
    ? null
    : mergeDataListProps<DataListBadgeProps>(
        { color: 'neutral', size: 'xs', variant: 'solid' },
        controlProps.value.count,
      ),
)
const closeProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'neutral', icon: 'i-lucide-x', size: 'sm', square: true, variant: 'ghost' },
    controlProps.value.close,
  ),
)
const clearProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'neutral', size: resolvedSize.value, variant: 'ghost' },
    controlProps.value.clear,
  ),
)
const applyProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'primary', size: resolvedSize.value, variant: 'solid' },
    controlProps.value.apply,
  ),
)
const presentation = internals.filterPresentation
const open = computed(() => presentation.panelOpen.value)
const activeCount = computed(() => presentation.activePanelCount.value)
const matchingCount = computed(
  () => internals.pagination.rowCount.value ?? internals.pagination.loadedCount.value,
)
const live = computed(() => props.commitMode === 'live')
const hasDraft = computed(() =>
  presentation.panelDefinitions.value.some(
    (definition) => !isNullish(presentation.getPanelDraftFilterState({ key: definition.key })),
  ),
)

defineSlots<{
  trigger?: (props: {
    open: () => void
    close: () => void
    toggle: () => void
    openState: boolean
    activeCount: number
    triggerProps: { type: 'button'; 'aria-expanded': boolean }
  }) => VNodeChild
}>()

function formatCount(value: number) {
  return new Intl.NumberFormat(locale.value.code).format(value).replaceAll(' ', ' ')
}

function toggle() {
  if (open.value) {
    presentation.closePanel()
  } else {
    presentation.openPanel()
  }
}

function primary() {
  if (live.value) {
    presentation.closePanel()
  } else {
    presentation.applyPanelDraft()
  }
}

watch(
  () => props.commitMode,
  (mode) => presentation.setPanelCommitMode(mode),
  { immediate: true },
)

onMounted(() => {
  if (props.mode === 'panel') {
    presentation.openPanel()
  }
})
</script>

<template>
  <section
    v-if="props.mode === 'panel'"
    :class="
      mergeDataListUiClass(
        'nut-dl-fpanel nut-dl-fpanel--inline grid gap-6',
        undefined,
        resolvedUi.wrapper,
      )
    "
  >
    <FilterPanelFields :size="resolvedSize" :ui="resolvedUi" />

    <div
      :class="
        mergeDataListUiClass(
          'nut-dl-fpanel__foot flex items-center gap-2.5 border-t border-default pt-4 text-[12.5px] text-muted',
          undefined,
          resolvedUi.footerActions,
        )
      "
    >
      <span
        :class="
          mergeDataListUiClass(
            'nut-dl-fpanel__matching min-w-0 truncate tabular-nums',
            undefined,
            resolvedUi.matching,
          )
        "
      >
        {{ t('table.filters.panel.matching', { count: formatCount(matchingCount) }) }}
      </span>
      <span class="flex-1" />
      <UButton
        v-bind="clearProps"
        :label="t('table.filters.panel.reset')"
        :disabled="!hasDraft"
        :ui="{ base: mergeDataListUiClass('nut-dl-fpanel__reset', undefined, resolvedUi.clear) }"
        @click="presentation.clearPanelDraft()"
      />
      <UButton
        v-if="!live"
        v-bind="applyProps"
        :label="t('table.filters.panel.apply')"
        :ui="{ base: mergeDataListUiClass('nut-dl-fpanel__apply', undefined, resolvedUi.apply) }"
        @click="presentation.applyPanelDraft()"
      />
    </div>
  </section>

  <USlideover
    v-else
    :open="open"
    side="right"
    :overlay="true"
    :title="t('table.filters.panel.trigger')"
    :description="description"
    :close="false"
    :ui="{
      overlay: mergeDataListUiClass('nut-dl-fpanel__overlay', undefined, resolvedUi.overlay),
      content: mergeDataListUiClass(
        'nut-dl-fpanel w-screen max-w-[480px] rounded-none divide-y-0 bg-default shadow-[-24px_0_60px_-30px_rgb(31_29_26/0.45)]',
        undefined,
        resolvedUi.content,
      ),
      header: mergeDataListUiClass(
        'nut-dl-fpanel__head flex items-start gap-3 px-6 pt-6 pb-4',
        undefined,
        resolvedUi.header,
      ),
      wrapper: mergeDataListUiClass('min-w-0 flex-1', undefined, resolvedUi.wrapper),
      body: mergeDataListUiClass(
        'nut-dl-fpanel__body flex-1 overflow-y-auto px-6 py-5',
        undefined,
        resolvedUi.body,
      ),
      footer: mergeDataListUiClass(
        'nut-dl-fpanel__foot flex items-center gap-2.5 border-t border-default px-6 py-4 text-[12.5px] text-muted',
        undefined,
        resolvedUi.footer,
      ),
      title: mergeDataListUiClass(
        'nut-dl-fpanel__title text-[20px] font-medium tracking-[-0.01em] text-highlighted',
        undefined,
        resolvedUi.title,
      ),
      description: mergeDataListUiClass(
        'nut-dl-fpanel__description mt-1 text-[12.5px] text-muted',
        undefined,
        resolvedUi.description,
      ),
    }"
    @update:open="$event ? presentation.openPanel() : presentation.closePanel()"
  >
    <slot
      name="trigger"
      :open="presentation.openPanel"
      :close="presentation.closePanel"
      :toggle="toggle"
      :open-state="open"
      :active-count="activeCount"
      :trigger-props="{ type: 'button', 'aria-expanded': open }"
    >
      <UButton
        v-bind="triggerBind"
        :aria-expanded="open"
        :aria-label="triggerLabel"
        :square="triggerProps.square ?? (isMobile && (!countProps || activeCount === 0))"
        :ui="{
          base: mergeDataListUiClass(
            'nut-dl-fpanel-trigger shrink-0',
            undefined,
            resolvedUi.trigger,
          ),
        }"
      >
        <span
          v-if="!isMobile || (countProps && activeCount > 0)"
          :class="
            mergeDataListUiClass('nut-dl-fpanel-trigger__content flex items-center gap-2', undefined, resolvedUi.triggerContent)
          "
        >
          <span v-if="!isMobile">{{ triggerLabel }}</span>
          <UBadge
            v-if="countProps && activeCount > 0"
            v-bind="countProps"
            :label="formatCount(activeCount)"
            :class="
              mergeDataListUiClass(
                'nut-dl-fpanel-trigger__count tabular-nums',
                undefined,
                resolvedUi.count,
              )
            "
          />
        </span>
      </UButton>
    </slot>

    <template #header>
      <div class="min-w-0 flex-1">
        <div class="flex items-baseline gap-2.5">
          <h2
            :class="
              mergeDataListUiClass(
                'nut-dl-fpanel__title text-[20px] font-medium tracking-[-0.01em] text-highlighted',
                undefined,
                resolvedUi.title,
              )
            "
          >
            {{ t('table.filters.panel.trigger') }}
          </h2>
          <span
            :class="
              mergeDataListUiClass(
                'nut-dl-fpanel__results text-[10.5px] font-semibold tracking-[0.08em] text-dimmed uppercase tabular-nums',
                undefined,
                resolvedUi.results,
              )
            "
          >
            {{ t('table.filters.panel.results', { count: formatCount(matchingCount) }) }}
          </span>
        </div>
        <p
          v-if="description"
          :class="
            mergeDataListUiClass(
              'nut-dl-fpanel__description mt-1 text-[12.5px] text-muted',
              undefined,
              resolvedUi.description,
            )
          "
        >
          {{ description }}
        </p>
      </div>
      <UButton
        v-bind="closeProps"
        :aria-label="t('table.controls.close')"
        :ui="{
          base: mergeDataListUiClass(
            'nut-dl-fpanel__close -mt-1 -mr-2 text-muted hover:text-default',
            undefined,
            resolvedUi.close,
          ),
        }"
        @click="presentation.closePanel()"
      />
    </template>

    <template #body>
      <FilterPanelFields :size="resolvedSize" :ui="resolvedUi" />
    </template>

    <template #footer>
      <span
        :class="
          mergeDataListUiClass(
            'nut-dl-fpanel__matching min-w-0 truncate tabular-nums',
            undefined,
            resolvedUi.matching,
          )
        "
      >
        {{ t('table.filters.panel.matching', { count: formatCount(matchingCount) }) }}
      </span>
      <span class="flex-1" />
      <UButton
        v-bind="clearProps"
        :label="t('table.filters.panel.reset')"
        :disabled="!hasDraft"
        :ui="{ base: mergeDataListUiClass('nut-dl-fpanel__reset', undefined, resolvedUi.clear) }"
        @click="presentation.clearPanelDraft()"
      />
      <UButton
        v-bind="applyProps"
        :label="live ? t('table.filters.panel.done') : t('table.filters.panel.apply')"
        :ui="{ base: mergeDataListUiClass('nut-dl-fpanel__apply', undefined, resolvedUi.apply) }"
        @click="primary"
      />
    </template>
  </USlideover>
</template>
