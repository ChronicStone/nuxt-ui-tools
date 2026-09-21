<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue'
import UTooltip from '@nuxt/ui/components/Tooltip.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListBreakpoint } from '../../composables/use-data-list-breakpoint'
import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type {
  DataListButtonProps,
  DataListControlSize,
  DataListLayoutSwitchProps,
  DataListLayoutSwitchUi,
  TableLayout,
} from '../../types'
import { mergeDataListProps, mergeDataListUiClass } from '../../utils'

const props = withDefaults(
  defineProps<{
    size?: DataListControlSize
    labels?: boolean
    order?: TableLayout[]
    mobile?: boolean
    ui?: DataListLayoutSwitchUi
    props?: DataListLayoutSwitchProps
  }>(),
  { mobile: false, order: () => ['table', 'grid'] },
)
const resolvedUi = computed<DataListLayoutSwitchUi>(() => ({
  ...dataListUi.ui.value.layoutSwitch?.ui,
  ...props.ui,
}))
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { isMobile } = useDataListBreakpoint()
const { t } = useUiToolsLocale()
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.layoutSwitch?.size ?? dataListUi.controlSize.value,
)

const controlProps = computed<DataListLayoutSwitchProps>(() =>
  mergeDataListProps(dataListUi.ui.value.layoutSwitch?.props, props.props),
)
function buttonProps(active: boolean) {
  const base = mergeDataListProps<DataListButtonProps>(
    { color: 'neutral', size: resolvedSize.value, variant: 'ghost' },
    controlProps.value.trigger,
  )
  return active
    ? mergeDataListProps<DataListButtonProps>(
        base,
        { variant: 'soft' },
        controlProps.value.activeTrigger,
      )
    : base
}

function setLayout(layout: TableLayout) {
  internals.tableApi.layout.set(layout)
}
</script>

<template>
  <slot
    :layout="internals.controls.tableLayout.value"
    :set-layout="setLayout"
    :available="internals.controls.layoutState.value.available"
  >
    <UFieldGroup
      v-if="
        internals.controls.gridEnabled.value &&
        internals.controls.tableEnabled.value &&
        (mobile || !isMobile)
      "
      :size="resolvedSize"
      :class="mergeDataListUiClass('nut-dl-layout', undefined, resolvedUi.root)"
    >
      <UTooltip
        v-for="layout in order"
        :key="layout"
        :text="layout === 'table' ? t('table.header.tableView') : t('table.header.gridView')"
      >
        <UButton
          v-bind="buttonProps(internals.controls.tableLayout.value === layout)"
          :data-active="internals.controls.tableLayout.value === layout"
          :icon="
            controlProps.icons?.[layout] ?? (layout === 'table' ? 'i-lucide-menu' : 'i-lucide-box')
          "
          :label="labels ? (layout === 'table' ? 'Table' : 'Grid') : undefined"
          :aria-label="
            layout === 'table' ? t('table.header.tableView') : t('table.header.gridView')
          "
          :ui="{
            base: mergeDataListUiClass('nut-dl-layout__btn', undefined, resolvedUi.trigger),
            label: resolvedUi.triggerLabel,
            leadingIcon: mergeDataListUiClass('size-3.5', undefined, resolvedUi.triggerLeadingIcon),
            trailingIcon: resolvedUi.triggerTrailingIcon,
          }"
          @click="setLayout(layout)"
        />
      </UTooltip>
    </UFieldGroup>
  </slot>
</template>
