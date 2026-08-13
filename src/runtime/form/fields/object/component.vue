<script setup lang="ts">
import UCard from '@nuxt/ui/components/Card.vue'
import { computed } from 'vue'

import FormFieldRenderer from '../../components/renderer/FormFieldRenderer.vue'
import { useFormContainerLayout } from '../../composables/use-form-layout'
import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import type { FormObjectField } from '../../types'
import { resolveFormText } from '../../utils/text'

const props = defineProps<{
  field: FormObjectField
  path: readonly string[]
  parentPath: readonly string[]
}>()

const form = useFormRuntimeContext()
const title = computed(() => resolveFormText(props.field.label))
const description = computed(() => resolveFormText(props.field.description))
const variant = computed(() => props.field.layout?.variant ?? 'plain')
const grid = useFormContainerLayout({
  layout: () => props.field.layout,
  formLayout: form.currentLayout,
})
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

    <div :style="grid.style.value">
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

    <div :style="grid.style.value">
      <FormFieldRenderer
        v-for="child in field.fields"
        :key="child.key"
        :field="child"
        :parent-path="path"
      />
    </div>
  </UCard>
</template>
