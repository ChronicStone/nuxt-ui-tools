<script setup lang="ts">
import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue'

import FormFieldRenderer from '../../components/renderer/FormFieldRenderer.vue'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFormUi } from '../../composables/use-form-ui'
import { mergeFormUiClass } from '../../utils/ui'
import type { FormGroupField } from './types'

defineProps<{
  field: FormGroupField
  path: readonly string[]
  parentPath: readonly string[]
}>()

const formUi = useFormUi()
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UFieldGroup
      :size="formUi.controlSize.value"
      :class="
        mergeFormUiClass('w-full', formUi.ui.value.group?.ui?.root, formUi.ui.value.group?.ui?.base)
      "
    >
      <FormFieldRenderer
        v-for="child in field.fields"
        :key="child.key"
        :field="child"
        :parent-path="parentPath"
        bare
      />
    </UFieldGroup>
  </FormFieldShell>
</template>
