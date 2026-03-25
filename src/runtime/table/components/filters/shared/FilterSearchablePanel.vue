<script setup lang="ts">
import UInput from '@nuxt/ui/components/Input.vue'
import UScrollArea from '@nuxt/ui/components/ScrollArea.vue'

const {
  searchable = false,
  autofocus = false,
  searchPlaceholder = 'Search...',
  searchLoading = false,
  showEmpty = false,
  emptyLabel = 'No matching options.',
  maxHeightClass = 'max-h-80',
} = defineProps<{
  searchable?: boolean
  autofocus?: boolean
  searchPlaceholder?: string
  searchLoading?: boolean
  showEmpty?: boolean
  emptyLabel?: string
  maxHeightClass?: string
}>()

const searchQuery = defineModel<string>('searchQuery', {
  default: '',
})
</script>

<template>
  <div class="bg-default">
    <div v-if="searchable" class="w-full border-b border-default p-2">
      <UInput
        v-model="searchQuery"
        icon="i-lucide-search"
        :placeholder="searchPlaceholder"
        class="w-full"
        :loading="searchLoading"
        variant="ghost"
        :autofocus="autofocus"
      />
    </div>

    <UScrollArea
      style="max-height: 320px"
      type="hover"
      class="p-2"
      :class="maxHeightClass"
      :ui="{ root: maxHeightClass, viewport: maxHeightClass }"
    >
      <slot />

      <div
        v-if="showEmpty"
        class="px-3 py-8 text-center text-sm text-muted"
      >
        <slot name="empty">
          {{ emptyLabel }}
        </slot>
      </div>
    </UScrollArea>
  </div>
</template>
