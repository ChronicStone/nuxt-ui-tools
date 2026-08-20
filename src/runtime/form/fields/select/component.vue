<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormValue } from '../../types'
import type { FormOptionValue, FormSelectCreateItem, FormSelectField } from '../../types'
import { isBoolean, isNumber, isString } from '../../utils/predicate'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<{
  field: FormSelectField
  path: readonly string[]
  bare?: boolean
}>()
const { t } = useUiToolsLocale()

const {
  form,
  controlProps,
  disabled,
  handleBlur,
  interactionOwnerClass,
  options,
  placeholder,
  validationPending,
} = useFieldControl(
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
const controlUi = computed(() => ({
  ...controlProps.value.ui,
  content: mergeFormUiClass(controlProps.value.ui?.content, interactionOwnerClass.value),
}))
const createItem = computed<FormSelectCreateItem>(() =>
  options.creatable.value && props.field.createItem ? props.field.createItem : false,
)
const showExplicitCreate = computed<boolean>(
  () => options.creatable.value && !props.field.createItem,
)
const showFooterActions = computed(() => options.refreshable.value || showExplicitCreate.value)
const footerActionsClass = computed(() =>
  options.refreshable.value && showExplicitCreate.value ? 'sm:grid-cols-2' : 'grid-cols-1',
)
const createActionLabel = computed(
  () => options.createLabel.value ?? t('form.fields.options.create'),
)

async function handleCreate(label: string) {
  await options.create(label)
}

async function handleCreateAction() {
  await handleCreate(searchTerm.value)
}

async function handleNativeCreate(label: string) {
  const normalizedLabel = label.trim()
  if (!normalizedLabel) return
  await handleCreate(normalizedLabel)
}

async function refreshOptions() {
  await options.refresh()
}

function isOptionValue(value: FormValue): value is FormOptionValue {
  return isString(value) || isNumber(value) || isBoolean(value)
}
</script>

<template>
  <USelectMenu
    v-if="bare"
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
    :loading="
      validationPending || options.loading.value || options.fetching.value || options.creating.value
    "
    :trailing="true"
    :search-input="field.searchable ?? false"
    :clear="field.clearable === true"
    :create-item="createItem"
    :ui="controlUi"
    @create="handleNativeCreate"
    @blur="handleBlur"
  >
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
          @click.stop="refreshOptions"
        >
          {{ t('form.fields.options.refresh') }}
        </UButton>
        <UButton
          v-if="showExplicitCreate"
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

    <template #create-item-label="{ item }">
      {{
        options.creating.value
          ? t('form.fields.options.creating')
          : t('form.fields.options.createNamed', { label: item })
      }}
    </template>
  </USelectMenu>
  <FormFieldShell v-else :field="field" :path="path">
    <USelectMenu
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
      :loading="
        validationPending ||
        options.loading.value ||
        options.fetching.value ||
        options.creating.value
      "
      :trailing="true"
      :search-input="field.searchable ?? false"
      :clear="field.clearable === true"
      :create-item="createItem"
      :ui="controlUi"
      @create="handleNativeCreate"
      @blur="handleBlur"
    >
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
            @click.stop="refreshOptions"
          >
            {{ t('form.fields.options.refresh') }}
          </UButton>
          <UButton
            v-if="showExplicitCreate"
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

      <template #create-item-label="{ item }">
        {{
          options.creating.value
            ? t('form.fields.options.creating')
            : t('form.fields.options.createNamed', { label: item })
        }}
      </template>
    </USelectMenu>
  </FormFieldShell>
</template>
