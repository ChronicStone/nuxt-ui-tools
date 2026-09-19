<script setup lang="ts">
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'
import { computed, ref, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import FormOptionItemLabel from '../../components/utils/form-option-item-label.vue'
import FormOptionMenuFooter from '../../components/utils/form-option-menu-footer.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormValue, FormOptionValue, FormSelectCreateItem, FormSelectField } from '../../types'
import { appendLoadMoreOption } from '../../utils/options'
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
    if (Array.isArray(value)) {
      return value.filter(isOptionValue)
    }
    if (isOptionValue(value)) {
      return value
    }
    return null
  },
  set: (value) => form.setValue(props.path, value),
})
const items = computed(() => [
  ...appendLoadMoreOption(
    options.items.value,
    options.remote.value && (options.hasMore.value || options.loadingMore.value),
    t('form.fields.options.loadingMore'),
  ),
])
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
const createActionLabel = computed(
  () => options.createLabel.value ?? t('form.fields.options.create'),
)
const searchable = computed<boolean>(() => props.field.searchable ?? options.remote.value)

watch(searchTerm, (term) => {
  if (options.remote.value) {
    options.setSearch(term)
  }
})

function handleOpen(open: boolean) {
  if (open) {
    options.activate()
  }
}

async function handleCreate(label: string) {
  await options.create(label)
}

async function handleCreateAction() {
  await handleCreate(searchTerm.value)
}

async function handleNativeCreate(label: string) {
  const normalizedLabel = label.trim()
  if (!normalizedLabel) {
    return
  }
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
    :search-input="searchable"
    :ignore-filter="options.remote.value"
    :clear="field.clearable === true"
    :create-item="createItem"
    :ui="controlUi"
    @update:open="handleOpen"
    @create="handleNativeCreate"
    @blur="handleBlur"
  >
    <template #item-label="{ item }">
      <FormOptionItemLabel :item="item" />
    </template>

    <template #content-bottom>
      <FormOptionMenuFooter
        :options="options"
        :disabled="disabled"
        :show-create="showExplicitCreate"
        :create-label="createActionLabel"
        @create="handleCreateAction"
      />
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
      :search-input="searchable"
      :ignore-filter="options.remote.value"
      :clear="field.clearable === true"
      :create-item="createItem"
      :ui="controlUi"
      @update:open="handleOpen"
      @create="handleNativeCreate"
      @blur="handleBlur"
    >
      <template #item-label="{ item }">
        <FormOptionItemLabel :item="item" />
      </template>

      <template #content-bottom>
        <FormOptionMenuFooter
          :options="options"
          :disabled="disabled"
          :show-create="showExplicitCreate"
          :create-label="createActionLabel"
          @create="handleCreateAction"
        />
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
