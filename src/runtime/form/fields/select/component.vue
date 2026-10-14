<script setup lang="ts">
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'
import { createReusableTemplate } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import FormOptionDisplayValue from '../../components/utils/form-option-display-value.vue'
import FormOptionItemLabel from '../../components/utils/form-option-item-label.vue'
import FormOptionLeading from '../../components/utils/form-option-leading.vue'
import FormOptionMenuFooter from '../../components/utils/form-option-menu-footer.vue'
import FormOptionSuffix from '../../components/utils/form-option-suffix.vue'
import FormOptionTokens from '../../components/utils/form-option-tokens.vue'
import { useFieldControl } from '../../composables/use-field-control'
import { useOptionMenu } from '../../composables/use-option-menu'
import type { FormValue, FormOptionValue, FormSelectCreateItem, FormSelectField } from '../../types'
import { formOptionKey, leadingVisualPadding } from '../../utils/options'
import type { ResolvedFormOption } from '../../utils/options'
import { isBoolean, isNumber, isString } from '../../utils/predicate'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<{
  field: FormSelectField
  path: readonly string[]
  bare?: boolean
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
  { omit: ['createItem', 'max', 'searchable', 'clearable'] },
)
const [DefineControl, ReuseControl] = createReusableTemplate()
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
  set: (value) => {
    const exceedsMax =
      fieldProps.value.multiple &&
      isNumber(fieldProps.value.max) &&
      Array.isArray(value) &&
      value.length > fieldProps.value.max
    if (exceedsMax) {
      return
    }
    form.setValue(props.path, value)
  },
})
const menu = useOptionMenu({
  field: () => props.field,
  loadMoreLabel: () => t('form.fields.options.loadingMore'),
  model: () => model.value,
  multiple: () => fieldProps.value.multiple === true,
  options,
})
const controlUi = computed(() => ({
  ...controlProps.value.ui,
  base: mergeFormUiClass(
    controlProps.value.ui?.base,
    menu.leadingOption.value ? leadingVisualPadding(controlProps.value.size) : undefined,
  ),
  content: mergeFormUiClass(controlProps.value.ui?.content, interactionOwnerClass.value),
  itemDescription: mergeFormUiClass(
    menu.renderOption.value ? 'hidden' : 'text-[12.5px]',
    controlProps.value.ui?.itemDescription,
  ),
}))
/**
 * The chosen options of a multiple select, drawn as tokens with their visual in the control.
 * `renderValue` stays a single-selection display: the tokens keep the labels.
 */
const tokenOptions = computed<readonly ResolvedFormOption[]>(() => {
  if (!fieldProps.value.multiple || !Array.isArray(model.value)) {
    return []
  }
  const chosen = new Map(
    options.selectedItems.value.map((option) => [formOptionKey(option.value), option]),
  )
  // A value whose option is still loading keeps its place, under its raw value.
  return model.value.map(
    (value) => chosen.get(formOptionKey(value)) ?? { label: String(value), value },
  )
})
const createItem = computed<FormSelectCreateItem>(() =>
  options.creatable.value && fieldProps.value.createItem ? fieldProps.value.createItem : false,
)
const showExplicitCreate = computed<boolean>(
  () => options.creatable.value && !fieldProps.value.createItem,
)
const createActionLabel = computed(
  () => options.createLabel.value ?? t('form.fields.options.create'),
)
const searchable = computed<boolean>(() => fieldProps.value.searchable ?? options.remote.value)

watch(searchTerm, (term) => {
  if (options.remote.value) {
    options.setSearch(term)
  }
})

function handleOpen(next: boolean) {
  open.value = next
  if (next) {
    options.activate()
  }
}

async function handleCreate(label: string) {
  await options.create(label)
}

async function handleCreateAction() {
  const label = searchTerm.value.trim() || undefined
  if (!fieldProps.value.multiple) {
    open.value = false
  }
  await options.create(label)
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
  <DefineControl>
    <USelectMenu
      v-model="model"
      v-model:search-term="searchTerm"
      :open="open"
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
      :trailing="true"
      :search-input="searchable"
      :ignore-filter="options.remote.value"
      :clear="fieldProps.clearable === true"
      :create-item="createItem"
      :ui="controlUi"
      @update:open="handleOpen"
      @create="handleNativeCreate"
      @blur="handleBlur"
    >
      <template v-if="menu.leadingOption.value" #leading="{ ui }">
        <FormOptionLeading
          :option="menu.leadingOption.value"
          :icon-class="ui.leadingIcon()"
          :avatar-size="ui.itemLeadingAvatarSize()"
          chip-class="size-5"
        />
      </template>

      <template v-if="menu.customValueOption.value" #default="{ ui }">
        <span :class="ui.value({ class: controlProps.ui?.value })" data-slot="value">
          <FormOptionDisplayValue
            :option="menu.customValueOption.value"
            :render="menu.renderValue.value"
          />
        </span>
      </template>
      <template v-else-if="tokenOptions.length" #default>
        <FormOptionTokens :options="tokenOptions" />
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

      <template #create-item-label="{ item }">
        {{
          options.creating.value
            ? t('form.fields.options.creating')
            : t('form.fields.options.createNamed', { label: item })
        }}
      </template>
    </USelectMenu>
  </DefineControl>

  <ReuseControl v-if="bare" />
  <FormFieldShell v-else :field="field" :path="path">
    <ReuseControl />
  </FormFieldShell>
</template>
