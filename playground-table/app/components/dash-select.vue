<script setup lang="ts" generic="TValue extends string | number | boolean">
/** Single-choice filter pill of the dashboard filter bar ("Année  2026 ⌄"). */
const model = defineModel<TValue>({ required: true })
const {
  items,
  name,
  format = String,
  defaultValue,
} = defineProps<{
  items: readonly TValue[]
  /** Filter name shown before the value, and the popover heading. */
  name: string
  /** Text of a value. Defaults to the value itself. */
  format?: (value: TValue) => string
  /** Value of the unfiltered view: any other value stands out and can be cleared back to it. */
  defaultValue?: TValue
}>()

const open = ref(false)
const active = computed(() => defaultValue !== undefined && model.value !== defaultValue)

function pick(value: TValue) {
  model.value = value
  open.value = false
}
function reset() {
  if (defaultValue !== undefined) model.value = defaultValue
}
</script>

<template>
  <DashPicker v-model:open="open" :name :label="format(model)" :active @clear="reset">
    <button
      v-for="item in items"
      :key="String(item)"
      type="button"
      class="dash-it"
      :class="{ on: model === item }"
      :aria-current="model === item || undefined"
      @click="pick(item)"
    >
      <span>{{ format(item) }}</span>
      <UIcon v-if="model === item" name="i-lucide-check" class="dash-it-check" />
    </button>
  </DashPicker>
</template>
