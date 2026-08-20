<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UColorPicker from '@nuxt/ui/components/ColorPicker.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormColorPickerField } from '../../types'
import { isString } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'

const props = defineProps<{
  field: FormColorPickerField
  path: readonly string[]
}>()
const { t } = useUiToolsLocale()

const { form, controlProps, controlSize, disabled, interactionOwnerClass } = useFieldControl(
  () => props.field,
  () => props.path,
)
const open = ref<boolean>(false)
const display = computed(() => props.field.display ?? 'popover')
const placeholder = computed(() => resolveFormText(props.field.placeholder) ?? '#000000')
const model = computed<string | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    return isString(value) ? value : undefined
  },
  set: (value) => form.setValue(props.path, value ?? null),
})

function clearColor() {
  model.value = undefined
}

function preventPopoverAutoFocus(event: Event) {
  event.preventDefault()
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UColorPicker
      v-if="display === 'inline'"
      v-model="model"
      v-bind="controlProps"
      :disabled="disabled"
      :format="field.format ?? 'hex'"
      :throttle="field.throttle"
    />
    <UPopover
      v-else
      v-model:open="open"
      :content="{
        side: 'bottom',
        align: 'start',
        sideOffset: 8,
        collisionPadding: 12,
        avoidCollisions: true,
        onOpenAutoFocus: preventPopoverAutoFocus,
      }"
      :ui="{ content: interactionOwnerClass }"
      :class="display === 'swatch' ? 'w-fit' : 'w-full'"
    >
      <template #anchor>
        <UButton
          v-if="display === 'swatch'"
          type="button"
          color="neutral"
          variant="outline"
          :size="controlSize"
          :disabled="disabled"
          :aria-label="t('form.fields.color.open')"
          @click="open = true"
        >
          <span
            class="size-5 rounded-sm border border-default"
            :style="{ backgroundColor: model ?? 'transparent' }"
          />
        </UButton>
        <UInput
          v-else
          v-model="model"
          v-bind="controlProps"
          class="w-full"
          :disabled="disabled"
          :placeholder="placeholder"
          @focus="open = true"
          @click="open = true"
        >
          <template #leading>
            <span
              class="size-4 rounded-sm border border-default"
              :style="{ backgroundColor: model ?? 'transparent' }"
            />
          </template>
          <template #trailing>
            <div class="flex items-center gap-0.5">
              <UButton
                v-if="field.clearable === true && model"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                :disabled="disabled"
                :aria-label="t('form.fields.color.clear')"
                @mousedown.prevent
                @click.stop="clearColor"
              />
            </div>
          </template>
        </UInput>
      </template>

      <template #content>
        <div class="p-2">
          <UColorPicker
            v-model="model"
            :size="controlSize"
            :disabled="disabled"
            :format="field.format ?? 'hex'"
            :throttle="field.throttle"
          />
        </div>
      </template>
    </UPopover>
  </FormFieldShell>
</template>
