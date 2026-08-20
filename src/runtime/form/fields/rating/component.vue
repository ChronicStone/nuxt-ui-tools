<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormRatingField } from '../../types'
import { isNumber } from '../../utils/predicate'

const props = defineProps<{
  field: FormRatingField
  path: readonly string[]
}>()
const { t } = useUiToolsLocale()

const { form, controlProps, disabled, handleBlur } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<number | null>({
  get: () => {
    const value = form.getValue(props.path)
    return isNumber(value) ? value : null
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

function moveRating(event: KeyboardEvent) {
  if (disabled.value) return
  const current = model.value ?? 0
  if (event.key === 'Home') model.value = 1
  else if (event.key === 'End') model.value = max.value
  else if (event.key === 'ArrowRight' || event.key === 'ArrowUp')
    model.value = Math.min(max.value, current + 1)
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown')
    model.value = Math.max(1, current - 1)
  else return
  event.preventDefault()
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <div
      v-bind="controlProps"
      role="radiogroup"
      class="flex w-fit items-center gap-0.5 rounded-lg"
      @blur="handleBlur"
      @keydown="moveRating"
    >
      <button
        v-for="value in max"
        :key="value"
        type="button"
        :disabled="disabled"
        role="radio"
        :aria-checked="model === value"
        :aria-label="t('form.fields.rating.value', { value, max })"
        :tabindex="model === value || (!model && value === 1) ? 0 : -1"
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
