<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import UProgress from '@nuxt/ui/components/Progress.vue'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { ResolvedFieldProps } from '../../composables/use-field-control'
import type { FormPasswordField, FormPasswordRequirement } from '../../types'
import { isObject, isString } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'

const props = defineProps<{
  field: FormPasswordField
  path: readonly string[]
  bare?: boolean
}>()

const { t } = useUiToolsLocale()
const { fieldProps, form, controlProps, controlSize, disabled, handleBlur, placeholder } =
  useFieldControl(
    () => props.field,
    () => props.path,
    { omit: ['requirements', 'visibilityToggle'] },
  )
type PasswordVisibilityConfig = Exclude<
  NonNullable<ResolvedFieldProps<FormPasswordField>['visibilityToggle']>,
  boolean
>

const visible = ref(false)
const requirementsOpen = ref(false)
const visibilityToggleEnabled = computed(() => fieldProps.value.visibilityToggle !== false)
const visibilityToggleConfig = computed(() =>
  isPasswordVisibilityConfig(fieldProps.value.visibilityToggle)
    ? fieldProps.value.visibilityToggle
    : undefined,
)
const inputType = computed(() => (visible.value ? 'text' : 'password'))
const requirements = computed<readonly FormPasswordRequirement[]>(() =>
  Array.isArray(fieldProps.value.requirements) ? fieldProps.value.requirements : [],
)
const requirementResults = computed(() => {
  const value = model.value ?? ''

  return requirements.value.map((requirement) => ({
    key: requirement.key,
    label: resolveFormText(requirement.label) ?? requirement.key,
    passed: requirement.validate(value),
  }))
})
const passedRequirementCount = computed(
  () => requirementResults.value.filter((requirement) => requirement.passed).length,
)
const visibilityLabel = computed(() => {
  const configured = visible.value
    ? visibilityToggleConfig.value?.hideLabel
    : visibilityToggleConfig.value?.showLabel
  return (
    resolveFormText(configured) ??
    t(visible.value ? 'form.fields.password.hide' : 'form.fields.password.show')
  )
})
const visibilityIcon = computed(() =>
  visible.value
    ? (visibilityToggleConfig.value?.hideIcon ?? 'i-lucide-eye-off')
    : (visibilityToggleConfig.value?.showIcon ?? 'i-lucide-eye'),
)
function isPasswordVisibilityConfig(
  value: ResolvedFieldProps<FormPasswordField>['visibilityToggle'],
): value is PasswordVisibilityConfig {
  return isObject(value)
}

function handleInputBlur(event: FocusEvent) {
  requirementsOpen.value = false
  handleBlur(event)
}

const model = computed<string | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    return isString(value) ? value : undefined
  },
  set: (value) => form.setValue(props.path, value ?? null),
})
</script>

<template>
  <UPopover
    v-if="bare"
    :open="requirementsOpen && requirements.length > 0"
    :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
    :ui="{ content: 'w-[min(22rem,calc(100vw-2rem))] p-3.5' }"
  >
    <UInput
      v-model="model"
      v-bind="controlProps"
      class="w-full"
      :type="inputType"
      :placeholder="placeholder"
      :disabled="disabled"
      @focus="requirementsOpen = true"
      @blur="handleInputBlur"
    >
      <template v-if="visibilityToggleEnabled" #trailing>
        <UButton
          type="button"
          color="neutral"
          variant="link"
          :size="controlSize"
          :icon="visibilityIcon"
          :aria-label="visibilityLabel"
          :title="visibilityLabel"
          :aria-pressed="visible"
          :disabled="disabled"
          :ui="{ base: 'p-0' }"
          @mousedown.prevent
          @click="visible = !visible"
        />
      </template>
    </UInput>

    <template #content>
      <div class="space-y-3" data-form-password-requirements="">
        <div class="flex items-center justify-between gap-3 text-xs font-medium text-toned">
          <span>{{ t('form.fields.password.requirements') }}</span>
          <span class="tabular-nums">
            {{ passedRequirementCount }}/{{ requirementResults.length }}
          </span>
        </div>
        <UProgress
          :model-value="passedRequirementCount"
          :max="requirementResults.length"
          size="sm"
          color="success"
          data-form-password-progress=""
          :data-value="passedRequirementCount"
          :data-max="requirementResults.length"
        />
        <ul class="space-y-1.5">
          <li
            v-for="requirement in requirementResults"
            :key="requirement.key"
            class="flex items-start gap-2 text-xs"
            :class="requirement.passed ? 'text-success' : 'text-muted'"
          >
            <UIcon
              :name="requirement.passed ? 'i-lucide-check' : 'i-lucide-x'"
              class="mt-0.5 size-3.5 shrink-0"
            />
            <span>{{ requirement.label }}</span>
          </li>
        </ul>
      </div>
    </template>
  </UPopover>
  <FormFieldShell v-else :field="field" :path="path">
    <UPopover
      :open="requirementsOpen && requirements.length > 0"
      :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
      :ui="{ content: 'w-[min(22rem,calc(100vw-2rem))] p-3.5' }"
    >
      <UInput
        v-model="model"
        v-bind="controlProps"
        class="w-full"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        @focus="requirementsOpen = true"
        @blur="handleInputBlur"
      >
        <template v-if="visibilityToggleEnabled" #trailing>
          <UButton
            type="button"
            color="neutral"
            variant="link"
            :size="controlSize"
            :icon="visibilityIcon"
            :aria-label="visibilityLabel"
            :title="visibilityLabel"
            :aria-pressed="visible"
            :disabled="disabled"
            :ui="{ base: 'p-0' }"
            @mousedown.prevent
            @click="visible = !visible"
          />
        </template>
      </UInput>

      <template #content>
        <div class="space-y-3" data-form-password-requirements="">
          <div class="flex items-center justify-between gap-3 text-xs font-medium text-toned">
            <span>{{ t('form.fields.password.requirements') }}</span>
            <span class="tabular-nums">
              {{ passedRequirementCount }}/{{ requirementResults.length }}
            </span>
          </div>
          <UProgress
            :model-value="passedRequirementCount"
            :max="requirementResults.length"
            size="sm"
            color="success"
            data-form-password-progress=""
            :data-value="passedRequirementCount"
            :data-max="requirementResults.length"
          />
          <ul class="space-y-1.5">
            <li
              v-for="requirement in requirementResults"
              :key="requirement.key"
              class="flex items-start gap-2 text-xs"
              :class="requirement.passed ? 'text-success' : 'text-muted'"
            >
              <UIcon
                :name="requirement.passed ? 'i-lucide-check' : 'i-lucide-x'"
                class="mt-0.5 size-3.5 shrink-0"
              />
              <span>{{ requirement.label }}</span>
            </li>
          </ul>
        </div>
      </template>
    </UPopover>
  </FormFieldShell>
</template>
