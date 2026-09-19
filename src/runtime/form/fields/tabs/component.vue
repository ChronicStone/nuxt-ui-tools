<script setup lang="ts">
import UTabs from '@nuxt/ui/components/Tabs.vue'
import { computed, ref, watch } from 'vue'

import FormFieldRenderer from '../../components/renderer/form-field-renderer.vue'
import { useFormContainerLayout } from '../../composables/use-form-layout'
import { fieldPath, useFormRuntimeContext } from '../../composables/use-form-runtime'
import { useFormUi } from '../../composables/use-form-ui'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import type { FormTab, FormTabsField } from './types'

const props = defineProps<{
  field: FormTabsField
  path: readonly string[]
  parentPath: readonly string[]
}>()

const form = useFormRuntimeContext()
const formUi = useFormUi()
const ui = computed(() => formUi.ui.value.tabs?.ui)
const containerLayout = useFormContainerLayout({
  formLayout: form.currentLayout,
  layout: () => props.field.layout,
})
const visibleTabs = computed(() =>
  props.field.tabs.filter((tab) => {
    if (!tab.condition) {
      return true
    }
    return tab.condition(form.getFieldCallbackParams(props.path, props.field))
  }),
)
const items = computed(() =>
  visibleTabs.value.map((tab) => ({
    icon: tab.icon,
    label: resolveFormText(tab.label) ?? tab.key,
    value: tab.key,
  })),
)
const active = ref<string>(props.field.defaultTab ?? props.field.tabs[0]?.key ?? '')

const activeTab = computed(() => visibleTabs.value.find((tab) => tab.key === active.value))

watch(visibleTabs, (tabs) => {
  if (!tabs.some((tab) => tab.key === active.value)) {
    active.value = tabs[0]?.key ?? ''
  }
})

watch(
  () => form.errors.value.map((error) => error.path),
  (paths) => {
    if (!paths.length || tabHasError(activeTab.value)) {
      return
    }
    const invalid = visibleTabs.value.find((tab) => tabHasErrorPaths(tab, paths))
    if (invalid) {
      active.value = invalid.key
    }
  },
)

function tabHasErrorPaths(tab: FormTab, paths: readonly string[]) {
  return tab.fields.some((child) => {
    const childPath = fieldPath(props.parentPath, child).join('.')
    return paths.some((path) => path === childPath || path.startsWith(`${childPath}.`))
  })
}

function tabHasError(tab: FormTab | undefined) {
  return tab
    ? tabHasErrorPaths(
        tab,
        form.errors.value.map((error) => error.path),
      )
    : false
}

function tabDescription(tab: FormTab | undefined) {
  return resolveFormText(tab?.description)
}
</script>

<template>
  <div :class="mergeFormUiClass('grid gap-4', ui?.root)" data-form-tabs="">
    <UTabs
      v-model="active"
      :items="items"
      :variant="field.variant ?? 'link'"
      color="primary"
      :content="false"
      :ui="{ list: ui?.list, trigger: ui?.trigger }"
    >
      <template #default="{ item }">
        <span
          :class="
            tabHasError(visibleTabs.find((tab) => tab.key === item.value)) ? 'text-error' : ''
          "
        >
          {{ item.label }}
        </span>
      </template>
    </UTabs>
    <template v-for="tab in visibleTabs" :key="tab.key">
      <div
        v-if="tab.key === active"
        :class="mergeFormUiClass('grid gap-4', ui?.content)"
        :data-form-tab="tab.key"
      >
        <p v-if="tabDescription(tab)" class="text-sm text-muted">{{ tabDescription(tab) }}</p>
        <div :class="mergeFormUiClass('grid', ui?.fields)" :style="containerLayout.style.value">
          <FormFieldRenderer
            v-for="child in tab.fields"
            :key="child.key"
            :field="child"
            :parent-path="parentPath"
          />
        </div>
      </div>
    </template>
  </div>
</template>
