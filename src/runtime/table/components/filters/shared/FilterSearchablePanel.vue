<script setup lang="ts">
import UInput from '@nuxt/ui/components/Input.vue'
import UScrollArea from '@nuxt/ui/components/ScrollArea.vue'

const props = withDefaults(defineProps<{
  searchable?: boolean
  autofocus?: boolean
  searchPlaceholder?: string
  searchLoading?: boolean
  showEmpty?: boolean
  emptyLabel?: string
  maxHeightClass?: string
}>(), {
  searchable: false,
  autofocus: false,
  searchPlaceholder: 'Search...',
  searchLoading: false,
  showEmpty: false,
  emptyLabel: 'No matching options.',
  maxHeightClass: 'max-h-80',
})

const searchQuery = defineModel<string>('searchQuery', {
  default: '',
})
</script>

<template>
  <div class="bg-default">
    <div v-if="props.searchable" class="w-full border-b border-default p-2">
      <UInput
        v-model="searchQuery"
        icon="i-lucide-search"
        :placeholder="props.searchPlaceholder"
        class="w-full"
        :loading="props.searchLoading"
        variant="ghost"
        :autofocus="props.autofocus"
      />
    </div>

    <UScrollArea
      style="max-height: 320px"
      type="hover"
      class="p-2"
      :class="props.maxHeightClass"
      :ui="{ root: props.maxHeightClass, viewport: props.maxHeightClass }"
    >
      <slot />

      <div
        v-if="props.showEmpty"
        class="px-3 py-8 text-center text-sm text-muted"
      >
        <slot name="empty">
          {{ props.emptyLabel }}
        </slot>
      </div>
    </UScrollArea>
  </div>
</template>
