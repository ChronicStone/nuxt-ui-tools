<script setup lang="ts">
import { computed } from 'vue'

import UButton from '@nuxt/ui/components/Button.vue'
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'

import type { FormOptionValue, FormSelectCreateItem, FormSelectField } from '../../types'
import { useFieldControl } from '../../composables/use-field-control'
import { isRecord } from '../../utils/path'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'

const props = defineProps<{
  field: FormSelectField
  path: readonly string[]
  bare?: boolean
}>()

const { form, controlProps, disabled, handleBlur, options, placeholder } = useFieldControl(() => props.field, () => props.path)
const model = computed<FormOptionValue | FormOptionValue[] | null | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    if (Array.isArray(value)) return value.filter(isOptionValue)
    if (isOptionValue(value)) return value
    return null
  },
  set: value => form.setValue(props.path, value),
})
const items = computed(() => [...options.items.value])
const createItem = computed<FormSelectCreateItem>(() => hasCreateOption() ? props.field.createItem ?? { position: 'bottom', when: 'empty' } : false)
const showRefreshAction = computed(() => items.value.length > 0 || options.pending.value || options.fetching.value || options.error.value !== null)

async function handleCreate(label: string) {
  const option = await options.create(label)
  if (!option) return

  if (props.field.multiple) {
    const current = Array.isArray(model.value) ? model.value.filter(isOptionValue) : []
    model.value = [...current, option.value]
    return
  }

  model.value = option.value
}

async function refreshOptions() {
  await options.refresh()
}

function hasCreateOption() {
  const rawOptions = Object.getOwnPropertyDescriptor(props.field, 'options')?.value
  if (!isRecord(rawOptions)) return false
  const create = Object.getOwnPropertyDescriptor(rawOptions, 'create')?.value
  return isRecord(create) && typeof Object.getOwnPropertyDescriptor(create, 'handler')?.value === 'function'
}

function isOptionValue(value: unknown): value is FormOptionValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}
</script>

<template>
  <USelectMenu
    v-if="bare"
    v-model="model"
    v-bind="controlProps"
    class="w-full"
    value-key="value"
    label-key="label"
    :items="items"
    :multiple="field.multiple"
    :placeholder="placeholder"
    :disabled="disabled"
    :loading="options.loading.value"
    :search-input="field.searchable ?? false"
    :clear="field.clearable ?? true"
    :create-item="createItem"
    @create="handleCreate"
    @blur="handleBlur"
  >
    <template #content-bottom>
      <div v-if="showRefreshAction" class="border-t border-default p-1">
        <UButton
          block
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-refresh-cw"
          :loading="options.pending.value || options.fetching.value"
          @click.stop="refreshOptions"
        >
          Refresh options
        </UButton>
      </div>
    </template>

    <template #create-item-label="{ item }">
      Create "{{ item }}"
    </template>
  </USelectMenu>
  <FormFieldShell v-else :field="field" :path="path">
    <USelectMenu
      v-model="model"
      v-bind="controlProps"
      class="w-full"
      value-key="value"
      label-key="label"
      :items="items"
      :multiple="field.multiple"
      :placeholder="placeholder"
      :disabled="disabled"
      :loading="options.loading.value"
      :search-input="field.searchable ?? false"
      :clear="field.clearable ?? true"
      :create-item="createItem"
      @create="handleCreate"
      @blur="handleBlur"
    >
      <template #content-bottom>
        <div v-if="showRefreshAction" class="border-t border-default p-1">
          <UButton
            block
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="options.pending.value || options.fetching.value"
            @click.stop="refreshOptions"
          >
            Refresh options
          </UButton>
        </div>
      </template>

      <template #create-item-label="{ item }">
        Create "{{ item }}"
      </template>
    </USelectMenu>
  </FormFieldShell>
</template>
