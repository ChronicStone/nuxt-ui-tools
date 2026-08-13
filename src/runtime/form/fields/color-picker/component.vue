<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UColorPicker from '@nuxt/ui/components/ColorPicker.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, ref } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormColorPickerField } from '../../types'
import { resolveFormText } from '../../utils/text'

const props = defineProps<{
  field: FormColorPickerField
  path: readonly string[]
}>()

const { form, controlProps, disabled } = useFieldControl(
  () => props.field,
  () => props.path,
)
const open = ref<boolean>(false)
const display = computed(() => props.field.display ?? 'popover')
const placeholder = computed(() => resolveFormText(props.field.placeholder) ?? '#000000')
const model = computed<string | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    return typeof value === 'string' ? value : undefined
  },
  set: (value) => form.setValue(props.path, value ?? null),
})

function clearColor() {
  model.value = undefined
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
      :content="{ side: 'bottom', sideOffset: 8, collisionPadding: 12, avoidCollisions: true }"
      :class="display === 'swatch' ? 'w-fit' : 'w-full'"
    >
      <template #anchor>
        <UButton
          v-if="display === 'swatch'"
          type="button"
          color="neutral"
          variant="outline"
          :disabled="disabled"
          aria-label="Open color picker"
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
                aria-label="Clear color"
                @mousedown.prevent
                @click="clearColor"
              />
            </div>
          </template>
        </UInput>
      </template>

      <template #content>
        <div class="p-1">
          <UColorPicker
            v-model="model"
            :disabled="disabled"
            :format="field.format ?? 'hex'"
            :throttle="field.throttle"
          />
        </div>
      </template>
    </UPopover>
  </FormFieldShell>
</template>
