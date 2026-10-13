<script setup lang="ts">
import UInputMenu from '@nuxt/ui/components/InputMenu.vue'
import { computed, ref, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import FormOptionItemLabel from '../../components/utils/form-option-item-label.vue'
import FormOptionLeading from '../../components/utils/form-option-leading.vue'
import FormOptionMenuFooter from '../../components/utils/form-option-menu-footer.vue'
import FormOptionSuffix from '../../components/utils/form-option-suffix.vue'
import FormOptionValueOverlay from '../../components/utils/form-option-value-overlay.vue'
import { useFieldControl } from '../../composables/use-field-control'
import { useOptionMenu } from '../../composables/use-option-menu'
import type {
  FormValue,
  FormAutoCompleteField,
  FormOptionValue,
  FormSelectCreateItem,
} from '../../types'
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
const open = ref<boolean>(false)
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
const menu = useOptionMenu({
  field: () => props.field,
  loadMoreLabel: () => t('form.fields.options.loadingMore'),
  model: () => model.value,
  multiple: () => fieldProps.value.multiple === true,
  options,
})
// A rich value (renderValue, or a suffix after the label) is drawn over the text of the input
// while the field rests: not open, nothing typed. The input keeps the text, transparent.
const overlayActive = computed<boolean>(
  () => menu.customValueOption.value !== undefined && !open.value && searchTerm.value === '',
)
const controlUi = computed(() => ({
  ...controlProps.value.ui,
  base: mergeFormUiClass(
    controlProps.value.ui?.base,
    overlayActive.value ? 'text-transparent' : undefined,
  ),
  content: mergeFormUiClass(controlProps.value.ui?.content, interactionOwnerClass.value),
  itemDescription: mergeFormUiClass(
    menu.renderOption.value ? 'hidden' : 'text-[12.5px]',
    controlProps.value.ui?.itemDescription,
  ),
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

function handleOpen(next: boolean) {
  open.value = next
  if (next) options.activate()
}

async function handleCreate(label: string) {
  await options.create(label)
}

async function handleCreateAction() {
  await options.create(searchTerm.value.trim() || undefined)
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
    <FormOptionValueOverlay
      :option="menu.customValueOption.value"
      :render="menu.renderValue.value"
      :active="overlayActive"
    >
      <UInputMenu
        v-model="model"
        v-model:search-term="searchTerm"
        v-bind="controlProps"
        class="w-full"
        value-key="value"
        label-key="label"
        :items="menu.items.value"
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

        <template v-if="menu.leadingOption.value" #leading="{ ui }">
          <FormOptionLeading
            :option="menu.leadingOption.value"
            :icon-class="ui.leadingIcon()"
            :avatar-size="ui.itemLeadingAvatarSize()"
            chip-class="size-5"
          />
        </template>

        <template #item-leading="{ item }">
          <FormOptionLeading :option="menu.renderOption.value ? undefined : item" />
        </template>

        <template #item-label="{ item }">
          <FormOptionItemLabel
            :option="item"
            :selected="menu.isSelected(item)"
            :render="menu.renderOption.value"
          />
        </template>

        <template #item-trailing="{ item }">
          <FormOptionSuffix v-if="!menu.renderOption.value" :option="item" />
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
    </FormOptionValueOverlay>
  </FormFieldShell>
</template>
