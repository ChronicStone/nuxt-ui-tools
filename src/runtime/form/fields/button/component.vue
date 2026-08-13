<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useFieldControl } from '../../composables/use-field-control'
import type { FormButtonField } from '../../types'
import { resolveFormText } from '../../utils/text'

const props = defineProps<{
  field: FormButtonField
  path: readonly string[]
}>()

const { controlProps, disabled, params } = useFieldControl(
  () => props.field,
  () => props.path,
)
const label = computed(() => resolveFormText(props.field.label))

async function handleClick() {
  await props.field.onClick(params.value)
}
</script>

<template>
  <UButton
    v-bind="controlProps"
    :label="label"
    :icon="field.icon"
    :color="field.color ?? 'primary'"
    :variant="field.variant ?? 'solid'"
    :disabled="disabled"
    @click="handleClick"
  />
</template>
