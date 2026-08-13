<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import USlideover from '@nuxt/ui/components/Slideover.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import { useTableInternals } from '../../../composables/use-table-internals'
import type { DataListControlSize, DataListFilterPanelUi } from '../../../types'
import { mergeDataListUiClass } from '../../../utils'
import { resolveFilterPanelComponent } from './registry'

const props = defineProps<{ size?: DataListControlSize; ui?: DataListFilterPanelUi }>()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const resolvedUi = computed<DataListFilterPanelUi>(() => ({
  ...dataListUi.ui.value.filterPanel?.ui,
  ...props.ui,
}))

defineSlots<{
  trigger?: (props: {
    open: () => void
    close: () => void
    toggle: () => void
    openState: boolean
    triggerProps: { type: 'button'; 'aria-expanded': boolean }
  }) => unknown
}>()

function toggle() {
  if (internals.filterPresentation.panelOpen.value) internals.filterPresentation.closePanel()
  else internals.filterPresentation.openPanel()
}
</script>

<template>
  <USlideover
    :open="internals.filterPresentation.panelOpen.value"
    side="right"
    inset
    :overlay="true"
    :title="t('table.filters.panel.trigger')"
    :ui="{
      overlay: resolvedUi.overlay,
      content: resolvedUi.content,
      header: resolvedUi.header,
      wrapper: resolvedUi.wrapper,
      body: resolvedUi.body,
      footer: resolvedUi.footer,
      title: resolvedUi.title,
      description: resolvedUi.description,
      close: resolvedUi.close,
    }"
    @update:open="
      $event ? internals.filterPresentation.openPanel() : internals.filterPresentation.closePanel()
    "
  >
    <slot
      name="trigger"
      :open="internals.filterPresentation.openPanel"
      :close="internals.filterPresentation.closePanel"
      :toggle="toggle"
      :open-state="internals.filterPresentation.panelOpen.value"
      :trigger-props="{
        type: 'button',
        'aria-expanded': internals.filterPresentation.panelOpen.value,
      }"
    >
      <UButton
        color="neutral"
        variant="outline"
        :size="props.size ?? dataListUi.ui.value.filterPanel?.size ?? dataListUi.controlSize.value"
        icon="i-lucide-funnel"
        :ui="{
          base: mergeDataListUiClass('shrink-0', undefined, resolvedUi.trigger),
        }"
      >
        <span
          :class="
            mergeDataListUiClass('flex items-center gap-2', undefined, resolvedUi.triggerContent)
          "
        >
          <span>{{ t('table.filters.panel.trigger') }}</span>
          <UBadge
            v-if="internals.filterPresentation.activePanelCount.value > 0"
            color="neutral"
            variant="subtle"
            size="sm"
            :label="String(internals.filterPresentation.activePanelCount.value)"
            :class="resolvedUi.count"
          />
        </span>
      </UButton>
    </slot>

    <template #body>
      <div class="min-h-0 overflow-y-auto">
        <div :class="mergeDataListUiClass('grid gap-5', undefined, resolvedUi.fields)">
          <component
            :is="resolveFilterPanelComponent(definition)"
            v-for="definition in internals.filterPresentation.panelDefinitions.value"
            :key="definition.key"
            :definition="definition"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div
        :class="
          mergeDataListUiClass(
            'flex w-full items-center justify-between gap-3',
            undefined,
            resolvedUi.footerActions,
          )
        "
      >
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          :label="t('table.filters.panel.clearAll')"
          :ui="{ base: resolvedUi.clear }"
          @click="internals.filterPresentation.clearPanelDraft()"
        />

        <UButton
          color="neutral"
          variant="subtle"
          size="sm"
          :label="t('table.filters.panel.apply')"
          :ui="{ base: resolvedUi.apply }"
          @click="internals.filterPresentation.applyPanelDraft()"
        />
      </div>
    </template>
  </USlideover>
</template>
