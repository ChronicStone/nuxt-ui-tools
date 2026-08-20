<script setup lang="ts">
import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue'

import FormFieldRenderer from '../../components/renderer/FormFieldRenderer.vue'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormInputGroupField } from '../../types'
import { isNumber } from '../../utils/predicate'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<{
  field: FormInputGroupField
  path: readonly string[]
  parentPath: readonly string[]
}>()
const formUi = useFormUi()

function controlAttrs(field: FormInputGroupField['fields'][number]) {
  const span = 'layout' in field ? field.layout?.span : undefined
  const weight = isNumber(span) && Number.isFinite(span) && span > 0 ? span : 1
  return {
    class: `min-w-0 ${resolveFlexClass(weight)}`,
  }
}

function resolveFlexClass(weight: number) {
  if (weight >= 12) return 'flex-[12_1_0%]'
  if (weight >= 10) return 'flex-[10_1_0%]'
  if (weight >= 8) return 'flex-[8_1_0%]'
  if (weight >= 6) return 'flex-[6_1_0%]'
  if (weight >= 5) return 'flex-[5_1_0%]'
  if (weight >= 4) return 'flex-[4_1_0%]'
  if (weight >= 3) return 'flex-[3_1_0%]'
  if (weight >= 2) return 'flex-[2_1_0%]'
  return 'flex-[1_1_0%]'
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UFieldGroup
      :size="formUi.controlSize.value"
      :orientation="field.orientation ?? 'horizontal'"
      :class="
        mergeFormUiClass(
          'w-full [&>button:has(+input[data-hidden]:last-child)]:rounded-e-md',
          formUi.ui.value.group?.ui?.root,
          formUi.ui.value.group?.ui?.base,
        )
      "
    >
      <FormFieldRenderer
        v-for="child in field.fields"
        :key="child.key"
        :field="child"
        :parent-path="parentPath"
        :control-attrs="controlAttrs(child)"
        bare
      />
    </UFieldGroup>
  </FormFieldShell>
</template>
