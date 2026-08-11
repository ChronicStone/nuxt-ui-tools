<script setup lang="ts">
import FormFieldRenderer from '../../components/renderer/FormFieldRenderer.vue'
import type { FormColumnField } from '../../types'

defineProps<{
  field: FormColumnField
  path: readonly string[]
  parentPath: readonly string[]
}>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <FormFieldRenderer
      v-for="child in field.fields"
      :key="child.key"
      :field="child"
      :parent-path="parentPath"
    />
  </div>
</template>
