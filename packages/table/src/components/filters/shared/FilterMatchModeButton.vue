<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'

withDefaults(
  defineProps<{
    label: string
    items: Array<{ label: string; value: string }>
  }>(),
  {
    items: () => [],
  },
)

const emit = defineEmits<{
  select: [value: string]
}>()
</script>

<template>
  <UDropdownMenu
    :items="[
      items.map((item) => ({
        label: item.label,
        onSelect: () => emit('select', item.value),
      })),
    ]"
    :content="{ side: 'bottom', align: 'start', sideOffset: 6 }"
    :ui="{ content: 'rounded-xl p-1 shadow-xl' }"
  >
    <UButton
      color="neutral"
      variant="outline"
      size="md"
      :label="label"
      trailing-icon="i-lucide-chevron-down"
      :ui="{ base: 'h-10 px-3 capitalize', trailingIcon: 'size-4 text-muted' }"
      @pointerdown.stop
      @click.stop
    />
  </UDropdownMenu>
</template>
