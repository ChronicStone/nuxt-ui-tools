<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed, ref, watch } from 'vue'

import FormFieldRenderer from '../../components/renderer/FormFieldRenderer.vue'
import { useFormContainerLayout } from '../../composables/use-form-layout'
import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import type { FormArrayListField, FormArrayTabsField, FormArrayVariantField } from '../../types'
import type { FormObject } from '../../types/utils'
import { resolveFormText } from '../../utils/text'

const props = defineProps<{
  field: FormArrayListField | FormArrayTabsField | FormArrayVariantField
  path: readonly string[]
}>()

const form = useFormRuntimeContext()
const activeIndex = ref<number>(0)
const items = computed<readonly FormObject[]>(() => {
  const value = form.getValue(props.path)
  return Array.isArray(value) ? value.filter(isFormObject) : []
})
const containerLayout = useFormContainerLayout({
  layout: () => props.field.layout,
  formLayout: form.currentLayout,
})
const title = computed(() => resolveFormText(props.field.label))
const description = computed(() => resolveFormText(props.field.description))
const addItemLabel = computed(() => resolveFormText(props.field.addItemLabel) ?? 'Add item')
const emptyLabel = computed(() => resolveFormText(props.field.emptyLabel) ?? 'No items yet')
const itemLabel = computed(() => resolveFormText(props.field.itemLabel) ?? 'Item')
const canAdd = computed(() => props.field.actions?.addItem !== false)
const canDelete = computed(() => props.field.actions?.deleteItem !== false)
const canMoveUp = computed(() => props.field.actions?.moveUp !== false)
const canMoveDown = computed(() => props.field.actions?.moveDown !== false)
const isTabsMode = computed(() => props.field.type === 'array-tabs')

watch(items, (value) => {
  if (activeIndex.value >= value.length) activeIndex.value = Math.max(0, value.length - 1)
})

function addItem() {
  form.setValue(props.path, [...items.value, {}])
  activeIndex.value = items.value.length
}

function removeItem(index: number) {
  form.setValue(
    props.path,
    items.value.filter((_, itemIndex) => itemIndex !== index),
  )
  if (activeIndex.value >= index) activeIndex.value = Math.max(0, activeIndex.value - 1)
}

function moveItem(index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.value.length) return

  const nextItems = [...items.value]
  const current = nextItems[index]
  const next = nextItems[nextIndex]
  if (!current || !next) return

  nextItems[index] = next
  nextItems[nextIndex] = current
  form.setValue(props.path, nextItems)
}

function itemPath(index: number) {
  return [...props.path, String(index)]
}

function isFormObject(value: unknown): value is FormObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
</script>

<template>
  <section class="grid gap-3">
    <div v-if="title || description" class="grid gap-1">
      <h3 v-if="title" class="text-sm font-medium text-highlighted">
        {{ title }}
      </h3>
      <p v-if="description" class="text-sm text-muted">
        {{ description }}
      </p>
    </div>

    <div
      v-if="items.length === 0"
      class="rounded-md border border-dashed border-default bg-muted/30 p-4 text-sm text-muted"
    >
      {{ emptyLabel }}
    </div>

    <div v-else-if="isTabsMode" class="grid gap-3">
      <div class="flex gap-1 overflow-x-auto rounded-md bg-muted p-1">
        <UButton
          v-for="(_, index) in items"
          :key="index"
          size="xs"
          :color="activeIndex === index ? 'primary' : 'neutral'"
          :variant="activeIndex === index ? 'solid' : 'ghost'"
          class="shrink-0"
          @click="activeIndex = index"
        >
          {{ itemLabel }} {{ index + 1 }}
        </UButton>
      </div>

      <div
        class="grid rounded-md border border-default bg-default"
        :class="field.compact ? 'gap-3 p-3' : 'gap-4 p-4'"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-highlighted">
            {{ itemLabel }} {{ activeIndex + 1 }}
          </span>
          <div class="flex items-center gap-1">
            <UButton
              v-if="canMoveUp"
              icon="i-lucide-arrow-up"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="activeIndex === 0"
              aria-label="Move item up"
              @click="moveItem(activeIndex, -1)"
            />
            <UButton
              v-if="canMoveDown"
              icon="i-lucide-arrow-down"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="activeIndex === items.length - 1"
              aria-label="Move item down"
              @click="moveItem(activeIndex, 1)"
            />
            <UButton
              v-if="canDelete"
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Remove item"
              @click="removeItem(activeIndex)"
            />
          </div>
        </div>

        <div class="grid" :style="containerLayout.style.value">
          <FormFieldRenderer
            v-for="child in field.fields"
            :key="child.key"
            :field="child"
            :parent-path="itemPath(activeIndex)"
          />
        </div>
      </div>
    </div>

    <div v-else class="grid gap-3">
      <div
        v-for="(_, index) in items"
        :key="index"
        class="grid rounded-md border border-default bg-default"
        :class="field.compact ? 'gap-3 p-3' : 'gap-4 p-4'"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-highlighted">
            {{ itemLabel }} {{ index + 1 }}
          </span>
          <div class="flex items-center gap-1">
            <UButton
              v-if="canMoveUp"
              icon="i-lucide-arrow-up"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="index === 0"
              aria-label="Move item up"
              @click="moveItem(index, -1)"
            />
            <UButton
              v-if="canMoveDown"
              icon="i-lucide-arrow-down"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="index === items.length - 1"
              aria-label="Move item down"
              @click="moveItem(index, 1)"
            />
            <UButton
              v-if="canDelete"
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Remove item"
              @click="removeItem(index)"
            />
          </div>
        </div>

        <div class="grid" :style="containerLayout.style.value">
          <FormFieldRenderer
            v-for="child in field.fields"
            :key="child.key"
            :field="child"
            :parent-path="itemPath(index)"
          />
        </div>
      </div>
    </div>

    <UButton
      v-if="canAdd"
      icon="i-lucide-plus"
      variant="soft"
      class="justify-self-start"
      @click="addItem"
    >
      {{ addItemLabel }}
    </UButton>
  </section>
</template>
