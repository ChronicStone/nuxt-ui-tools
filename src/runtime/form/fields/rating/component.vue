<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, ref } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormRatingField } from '../../types'

const props = defineProps<{
  field: FormRatingField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<number | null>({
  get: () => {
    const value = form.getValue(props.path)
    return typeof value === 'number' ? value : null
  },
  set: (value) => form.setValue(props.path, value),
})
const max = computed(() => Math.max(1, props.field.max ?? 5))
const icon = computed(() => props.field.icon ?? 'i-lucide-star')
const hoverValue = ref<number | null>(null)
const visualValue = computed(() => hoverValue.value ?? model.value ?? 0)

function setRating(value: number) {
  if (disabled.value) return
  if (props.field.clearable === true && model.value === value) {
    model.value = null
    return
  }

  model.value = value
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <div v-bind="controlProps" class="flex items-center gap-1" @blur="handleBlur">
      <button
        v-for="value in max"
        :key="value"
        type="button"
        :disabled="disabled"
        :aria-pressed="model === value"
        class="grid size-8 place-items-center rounded-md text-warning transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="value <= visualValue ? 'opacity-100' : 'opacity-40'"
        @mouseenter="hoverValue = value"
        @mouseleave="hoverValue = null"
        @click="setRating(value)"
      >
        <UIcon :name="icon" class="size-5" :class="value <= visualValue ? 'fill-current' : ''" />
      </button>
    </div>
  </FormFieldShell>
</template>
