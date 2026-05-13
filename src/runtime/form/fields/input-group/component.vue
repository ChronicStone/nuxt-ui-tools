<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue'

import type { FormField, FormInputGroupField } from '../../types'
import { fieldPath } from '../../composables/use-form-runtime'
import FormFieldRenderer from '../../components/renderer/FormFieldRenderer.vue'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import NumberField from '../number/component.vue'
import PasswordField from '../password/component.vue'
import SelectField from '../select/component.vue'
import TextField from '../text/component.vue'

const props = defineProps<{
  field: FormInputGroupField
  path: readonly string[]
  parentPath: readonly string[]
}>()

const groupChildren = computed(() => props.field.fields.map(child => ({
  field: child,
  path: fieldPath(props.parentPath, child),
  renderer: getGroupedRenderer(child),
})))

function getGroupedRenderer(field: FormField): Component | null {
  if (field.type === 'text') return TextField
  if (field.type === 'password') return PasswordField
  if (field.type === 'number') return NumberField
  if (field.type === 'select') return SelectField
  return null
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UFieldGroup class="w-full">
      <template
        v-for="child in groupChildren"
        :key="child.field.key"
      >
        <component
          :is="child.renderer"
          v-if="child.renderer"
          :field="child.field"
          :path="child.path"
          bare
        />
        <FormFieldRenderer
          v-else
          :field="child.field"
          :parent-path="parentPath"
        />
      </template>
    </UFieldGroup>
  </FormFieldShell>
</template>
