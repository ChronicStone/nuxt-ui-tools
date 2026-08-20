<script setup lang="ts">
import UCard from '@nuxt/ui/components/Card.vue'
import { computed } from 'vue'

import FormFieldRenderer from '../../components/renderer/FormFieldRenderer.vue'
import { useFieldControl } from '../../composables/use-field-control'
import { useFormContainerLayout } from '../../composables/use-form-layout'
import type { FormCardField } from '../../types'
import { invokeFormFunction, isNumber, isString } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'

const props = defineProps<{
  field: FormCardField
  path: readonly string[]
  parentPath: readonly string[]
}>()

const { form, params } = useFieldControl(
  () => props.field,
  () => props.path,
)
const grid = useFormContainerLayout({
  layout: () => props.field.layout,
  formLayout: form.currentLayout,
})
const title = computed(
  () => resolveRenderable(props.field.header) ?? resolveFormText(props.field.label),
)
const description = computed(() => resolveFormText(props.field.description))
const headerExtra = computed(() => resolveRenderable(props.field.headerExtra))
const footer = computed(() => resolveRenderable(props.field.footer))
const action = computed(() => resolveRenderable(props.field.action))

function resolveRenderable(value: FormCardField['header']) {
  const resolved = invokeFormFunction(value, [params.value]) ?? value
  return isString(resolved) || isNumber(resolved) ? String(resolved) : undefined
}
</script>

<template>
  <UCard>
    <template v-if="title || description || headerExtra" #header>
      <div class="flex items-start justify-between gap-4">
        <div class="grid gap-1">
          <h3 v-if="title" class="text-sm font-medium text-highlighted">
            {{ title }}
          </h3>
          <p v-if="description" class="text-sm text-muted">
            {{ description }}
          </p>
        </div>

        <div v-if="headerExtra" class="text-sm text-muted">
          {{ headerExtra }}
        </div>
      </div>
    </template>

    <div :style="grid.style.value">
      <FormFieldRenderer
        v-for="child in field.fields"
        :key="child.key"
        :field="child"
        :parent-path="parentPath"
      />
    </div>

    <template v-if="footer || action" #footer>
      <div class="flex items-center justify-between gap-4 text-sm text-muted">
        <span v-if="footer">{{ footer }}</span>
        <span v-if="action" class="ml-auto">{{ action }}</span>
      </div>
    </template>
  </UCard>
</template>
