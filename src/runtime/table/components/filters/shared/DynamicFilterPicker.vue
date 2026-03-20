<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, ref } from 'vue'

import type { TableUiFilterDefinition } from '../../../types'

const props = defineProps<{
  definitions: TableUiFilterDefinition[]
  getLabel: (definition: TableUiFilterDefinition) => string
}>()

const emit = defineEmits<{
  select: [key: string]
}>()

const isOpen = ref<boolean>(false)
const searchQuery = ref<string>('')

const filteredDefinitions = computed(() => {
  const search = searchQuery.value.trim().toLowerCase()
  if (!search) return props.definitions

  return props.definitions.filter((definition) =>
    props.getLabel(definition).toLowerCase().includes(search),
  )
})

function handleSelect(key: string) {
  emit('select', key)
  isOpen.value = false
  searchQuery.value = ''
}
</script>

<template>
  <UPopover
    :open="isOpen"
    mode="click"
    :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{ content: 'w-fit overflow-hidden p-0 shadow-none' }"
    @update:open="isOpen = $event"
  >
    <UButton
      color="neutral"
      variant="outline"
      size="md"
      icon="i-lucide-plus"
      label="Add filter"
      class="shrink-0 border-dashed"
    />

    <template #content>
      <div class="w-[min(26rem,calc(100vw-1rem))] bg-default">
        <div class="border-b border-default p-2">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search filters..."
            color="neutral"
            variant="ghost"
            autofocus
          />
        </div>

        <div class="grid max-h-80 gap-1 overflow-y-auto p-2">
          <button
            v-for="definition in filteredDefinitions"
            :key="definition.key"
            type="button"
            class="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-elevated/70"
            @click="handleSelect(definition.key)"
          >
            <span class="min-w-0 flex-1 truncate text-sm text-default">
              {{ getLabel(definition) }}
            </span>
            <span class="text-muted">
              <UIcon name="i-lucide-arrow-right" class="size-4" />
            </span>
          </button>

          <div
            v-if="!filteredDefinitions.length"
            class="px-3 py-6 text-center text-sm text-muted"
          >
            No matching filters.
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>
