<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'
import { computed, onMounted, ref, useId, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormValue } from '../../types'
import { isFunction, isString } from '../../utils/predicate'
import { mergeFormUiClass } from '../../utils/ui'
import type { FormPhoneCountryOption, FormPhoneNumberField } from './types'

const props = defineProps<{
  field: FormPhoneNumberField
  path: readonly string[]
}>()

const { locale, t } = useUiToolsLocale()
const { form, controlProps, disabled, handleBlur, interactionOwnerClass, placeholder } =
  useFieldControl(
    () => props.field,
    () => props.path,
  )
const formUi = useFormUi()
const countryCode = ref<CountryCode | undefined>(undefined)
const phoneValue = ref<string>('')
const syncingFromExternal = ref<boolean>(false)
const syncingToForm = ref<boolean>(false)
const mounted = ref<boolean>(false)
const controlId = useId()

const countryOptions = computed<readonly FormPhoneCountryOption[]>(() =>
  getCountries()
    .map((code) => createCountryOption(code))
    .filter((option) => isCountryAllowed(option))
    .sort((left, right) => left.label.localeCompare(right.label)),
)
const selectedCountry = computed(() =>
  countryOptions.value.find((option) => option.value === countryCode.value),
)
const processedValue = computed(() => {
  if (!phoneValue.value || !countryCode.value) return { valid: false, value: null }

  const parsed = parsePhoneNumberFromString(phoneValue.value, countryCode.value)
  if (!parsed?.isValid() || !parsed.country || parsed.country !== countryCode.value)
    return { valid: false, value: null }
  if (props.field.numberType?.length && !props.field.numberType.includes(parsed.getType()))
    return { valid: false, value: null }

  return { valid: true, value: formatPhoneNumber(parsed) }
})

onMounted(() => {
  syncFromExternalValue(form.getValue(props.path))
  if (!countryCode.value) countryCode.value = resolveDefaultCountryCode()
  mounted.value = true
})

watch(
  () => form.getValue(props.path),
  (value) => {
    if (syncingToForm.value) return
    syncFromExternalValue(value)
  },
)

watch([phoneValue, countryCode], () => {
  if (!mounted.value || syncingFromExternal.value) return
  syncToFormValue()
})

watch(countryCode, (current, previous) => {
  if (!mounted.value || !previous || !current || current === previous) return
  if (props.field.resetOnCountryChange ?? true) phoneValue.value = ''
})

function createCountryOption(code: CountryCode): FormPhoneCountryOption {
  const dialCode = `+${getCountryCallingCode(code)}`

  return {
    code,
    value: code,
    label: `${toFlagEmoji(code)} ${dialCode}`,
    dialCode,
    flag: toFlagEmoji(code),
  }
}

function isCountryAllowed(option: FormPhoneCountryOption) {
  const allowed = props.field.countryCodes
  if (!allowed) return true
  return isFunction(allowed) ? allowed(option) : allowed.includes(option.code)
}

function resolveDefaultCountryCode() {
  const stored = props.field.storedCountryCode
  if (stored && isCountryCodeAvailable(stored)) return stored

  const configured = props.field.defaultCountryCode
  if (configured && configured !== 'detect' && isCountryCodeAvailable(configured)) return configured

  const localeRegion = resolveLocaleRegionCode()
  if (localeRegion && isCountryCodeAvailable(localeRegion)) return localeRegion

  return countryOptions.value[0]?.value
}

function resolveLocaleRegionCode() {
  const segments = locale.value.code.split('-')
  const region = segments.length > 1 ? segments[segments.length - 1]?.toUpperCase() : undefined
  if (!region) return undefined

  return getCountries().find((code) => code === region)
}

function isCountryCodeAvailable(code: CountryCode) {
  return countryOptions.value.some((option) => option.value === code)
}

function syncFromExternalValue(value: FormValue) {
  syncingFromExternal.value = true

  if (!isString(value) || !value) {
    phoneValue.value = ''
    countryCode.value = resolveDefaultCountryCode()
    syncingFromExternal.value = false
    return
  }

  const parsed = parsePhoneNumberFromString(value)
  if (parsed?.country && isCountryCodeAvailable(parsed.country)) {
    countryCode.value = parsed.country
    phoneValue.value = parsed.formatNational()
    syncingFromExternal.value = false
    return
  }

  countryCode.value = resolveDefaultCountryCode()
  phoneValue.value = value
  syncingFromExternal.value = false
}

function syncToFormValue() {
  syncingToForm.value = true
  form.setValue(props.path, phoneValue.value ? (processedValue.value.value ?? '') : null)

  if (processedValue.value.valid && props.field.displayFormat !== 'raw' && countryCode.value) {
    const parsed = parsePhoneNumberFromString(phoneValue.value, countryCode.value)
    if (parsed?.isValid()) phoneValue.value = parsed.formatNational()
  }

  queueMicrotask(() => {
    syncingToForm.value = false
  })
}

function clearPhone() {
  phoneValue.value = ''
  form.setValue(props.path, null)
}

function formatPhoneNumber(parsed: NonNullable<ReturnType<typeof parsePhoneNumberFromString>>) {
  if (props.field.format === 'national') return parsed.formatNational()
  if (props.field.format === 'uri') return parsed.getURI()
  if (props.field.format === 'e164') return parsed.number
  return parsed.formatInternational()
}

function toFlagEmoji(code: CountryCode) {
  return [...code]
    .map((character) => String.fromCodePoint(127397 + character.charCodeAt(0)))
    .join('')
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UFieldGroup
      :size="formUi.controlSize.value"
      :class="
        mergeFormUiClass('w-full', formUi.ui.value.group?.ui?.root, formUi.ui.value.group?.ui?.base)
      "
    >
      <USelectMenu
        v-model="countryCode"
        :id="`${controlId}-country`"
        :aria-label="t('form.fields.phone.country')"
        class="w-auto min-w-[5.75rem] shrink-0"
        value-key="value"
        label-key="label"
        :items="[...countryOptions]"
        :size="formUi.controlSize.value"
        :disabled="disabled"
        :search-input="true"
        :ui="{
          base: 'w-auto min-w-[5.75rem]',
          content: interactionOwnerClass,
        }"
      />
      <UInput
        v-model="phoneValue"
        v-bind="controlProps"
        :id="`${controlId}-number`"
        :aria-label="t('form.fields.phone.number')"
        class="min-w-0 flex-1"
        type="tel"
        :placeholder="placeholder"
        :disabled="disabled || !selectedCountry"
        @blur="handleBlur"
      >
        <template v-if="phoneValue && countryCode" #trailing>
          <div class="flex items-center gap-1">
            <UIcon
              v-if="field.validityIndicator !== false"
              :name="processedValue.valid ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
              class="size-4"
              :class="processedValue.valid ? 'text-success' : 'text-error'"
            />
            <UButton
              v-if="field.clearable === true"
              type="button"
              color="neutral"
              variant="link"
              size="xs"
              icon="i-lucide-x"
              :aria-label="t('form.fields.phone.clear')"
              :disabled="disabled"
              :ui="{ base: 'p-0' }"
              @mousedown.prevent
              @click.stop="clearPhone"
            />
          </div>
        </template>
      </UInput>
    </UFieldGroup>
  </FormFieldShell>
</template>
