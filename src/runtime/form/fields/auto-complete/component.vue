<script setup lang="ts">
import UInputMenu from '@nuxt/ui/components/InputMenu.vue'
import { computed, ref, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import FormOptionItemLabel from '../../components/utils/form-option-item-label.vue'
import FormOptionMenuFooter from '../../components/utils/form-option-menu-footer.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type {
  FormValue,
  FormAutoCompleteField,
  FormOptionValue,
  FormSelectCreateItem,
} from '../../types'
import { appendLoadMoreOption } from '../../utils/options'
import { isBoolean, isNumber, isString } from '../../utils/predicate'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<{
  field: FormAutoCompleteField
  path: readonly string[]
}>()
const { t } = useUiToolsLocale()

const {
  fieldProps,
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
  { omit: ['createItem', 'clearable'] },
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
  options.creatable.value && fieldProps.value.createItem ? fieldProps.value.createItem : false,
)
const showExplicitCreate = computed<boolean>(
  () => options.creatable.value && !fieldProps.value.createItem,
)
const createActionLabel = computed(
  () => options.createLabel.value ?? t('form.fields.options.create'),
)

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

function isOptionValue(value: FormValue): value is FormOptionValue {
  return isString(value) || isNumber(value) || isBoolean(value)
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
      :multiple="fieldProps.multiple"
      :placeholder="placeholder"
      :disabled="disabled"
      :loading="
        validationPending ||
        options.loading.value ||
        options.fetching.value ||
        options.creating.value
      "
      :clear="fieldProps.clearable === true"
      :ignore-filter="options.remote.value"
      :create-item="createItem"
      :ui="controlUi"
      @update:open="handleOpen"
      @create="handleNativeCreate"
      @blur="handleBlur"
    >
      <template #create-item-label="{ item }">
        {{
          options.creating.value
            ? t('form.fields.options.creating')
            : t('form.fields.options.createNamed', { label: item })
        }}
      </template>

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
    </UInputMenu>
  </FormFieldShell>
</template>
