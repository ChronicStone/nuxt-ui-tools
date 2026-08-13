<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInputMenu from '@nuxt/ui/components/InputMenu.vue'
import { computed, ref } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormAutoCompleteField, FormOptionValue, FormSelectCreateItem } from '../../types'

const props = defineProps<{
  field: FormAutoCompleteField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur, options, placeholder } = useFieldControl(
  () => props.field,
  () => props.path,
)
const searchTerm = ref<string>('')
const model = computed<FormOptionValue | FormOptionValue[] | null | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    if (Array.isArray(value)) return value.filter(isOptionValue)
    if (isOptionValue(value)) return value
    return null
  },
  set: (value) => form.setValue(props.path, value),
})
const items = computed(() => [...options.items.value])
const createItem = computed<FormSelectCreateItem>(() =>
  options.creatable.value
    ? (props.field.createItem ?? { position: 'bottom', when: 'empty' })
    : false,
)
const showFooterActions = computed(() => options.refreshable.value || options.creatable.value)
const footerActionsClass = computed(() =>
  options.refreshable.value && options.creatable.value ? 'sm:grid-cols-2' : 'grid-cols-1',
)
const createActionLabel = computed(() => options.createLabel.value ?? 'Create option')

async function handleCreate(label: string) {
  const option = await options.create(label)
  if (!option || !options.selectCreatedOption.value) return

  if (props.field.multiple) {
    const current = Array.isArray(model.value) ? model.value.filter(isOptionValue) : []
    model.value = [...current, option.value]
    return
  }

  model.value = option.value
}

async function handleCreateAction() {
  await handleCreate(searchTerm.value)
}

function isOptionValue(value: unknown): value is FormOptionValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UInputMenu
      v-model="model"
      v-model:search-term="searchTerm"
      v-bind="controlProps"
      class="w-full"
      value-key="value"
      label-key="label"
      :items="items"
      :multiple="field.multiple"
      :placeholder="placeholder"
      :disabled="disabled"
      :loading="options.loading.value || options.creating.value"
      :clear="field.clearable === true"
      :create-item="createItem"
      @create="handleCreate"
      @blur="handleBlur"
    >
      <template #create-item-label="{ item }">
        {{ options.creating.value ? 'Creating...' : `Create "${item}"` }}
      </template>

      <template #content-bottom>
        <div
          v-if="showFooterActions"
          class="grid gap-1 border-t border-default p-1"
          :class="footerActionsClass"
        >
          <UButton
            v-if="options.refreshable.value"
            block
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="options.pending.value || options.fetching.value"
            @click.stop="options.refresh"
          >
            Refresh
          </UButton>
          <UButton
            v-if="options.creatable.value"
            block
            size="xs"
            variant="ghost"
            color="primary"
            icon="i-lucide-plus"
            :loading="options.creating.value"
            :disabled="disabled || options.creating.value"
            @click.stop="handleCreateAction"
          >
            {{ createActionLabel }}
          </UButton>
        </div>
      </template>
    </UInputMenu>
  </FormFieldShell>
</template>
