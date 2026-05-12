<script setup lang="ts">
import type { FormInputGroupField } from '../../types'
import FormFieldRenderer from '../../components/renderer/FormFieldRenderer.vue'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'

defineProps<{
  field: FormInputGroupField
  path: readonly string[]
  parentPath: readonly string[]
}>()
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <div class="flex flex-wrap items-start gap-2">
      <FormFieldRenderer
        v-for="child in field.fields"
        :key="child.key"
        :field="child"
        :parent-path="parentPath"
      />
    </div>
  </FormFieldShell>
</template>
