<script setup lang="ts">
import { computed } from 'vue'

import UCard from '@nuxt/ui/components/Card.vue'

import type { FormObjectField } from '../../types'
import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import { getSchemaLayout } from '../../utils/state'
import { resolveFormText } from '../../utils/text'
import FormFieldRenderer from '../../components/renderer/FormFieldRenderer.vue'

const props = defineProps<{
  field: FormObjectField
  path: readonly string[]
  parentPath: readonly string[]
}>()

const form = useFormRuntimeContext()
const title = computed(() => resolveFormText(props.field.label))
const description = computed(() => resolveFormText(props.field.description))
const variant = computed(() => props.field.layout?.variant ?? 'plain')
const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${normalizeColumns()}, minmax(0, 1fr))`,
  gap: '16px',
}))

function normalizeColumns() {
  const value = props.field.layout?.columns ?? getSchemaLayout(form.schema.value)?.columns ?? 1
  if (typeof value === 'number') return Math.max(1, value)

  const parsed = Number(value)
  if (Number.isFinite(parsed)) return Math.max(1, parsed)
  return 1
}
</script>

<template>
  <section v-if="variant === 'plain'" class="grid gap-3">
    <header v-if="title || description" class="grid gap-1">
      <h3 v-if="title" class="text-sm font-medium text-highlighted">
        {{ title }}
      </h3>
      <p v-if="description" class="text-sm text-muted">
        {{ description }}
      </p>
    </header>

    <div :style="gridStyle">
      <FormFieldRenderer
        v-for="child in field.fields"
        :key="child.key"
        :field="child"
        :parent-path="path"
      />
    </div>
  </section>

  <UCard v-else :variant="variant === 'card' ? 'outline' : 'soft'">
    <template v-if="title || description" #header>
      <div class="grid gap-1">
        <h3 v-if="title" class="text-sm font-medium text-highlighted">
          {{ title }}
        </h3>
        <p v-if="description" class="text-sm text-muted">
          {{ description }}
        </p>
      </div>
    </template>

    <div :style="gridStyle">
      <FormFieldRenderer
        v-for="child in field.fields"
        :key="child.key"
        :field="child"
        :parent-path="path"
      />
    </div>
  </UCard>
</template>
