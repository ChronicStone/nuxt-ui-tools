<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'

defineProps<{
  items: Array<{
    label: string
    value: string
    count?: number
    icon?: string
    truncate?: boolean
  }>
  countLoading: boolean
}>()

const modelValue = defineModel<string | undefined>({
  default: undefined,
})
</script>

<template>
  <URadioGroup
    v-if="items.length"
    v-model="modelValue"
    :items="items"
    color="neutral"
    variant="list"
    :ui="{
      root: 'w-full',
      fieldset: 'grid gap-0.5',
      item: 'flex items-center rounded-md transition-colors hover:bg-elevated data-[state=checked]:bg-elevated',
      container: 'self-center pl-3',
      base: 'cursor-pointer',
      wrapper: 'min-w-0 flex-1 py-2 pr-3',
      label: 'w-full cursor-pointer text-sm text-default',
    }"
  >
    <template #label="{ item }">
      <div class="flex min-w-0 items-center gap-3">
        <UIcon
          v-if="typeof item.icon === 'string'"
          :name="item.icon"
          class="size-4 shrink-0 text-muted"
        />

        <span class="min-w-0 flex-1" :class="item.truncate ? 'truncate' : ''">
          {{ item.label }}
        </span>
        <USkeleton v-if="countLoading" class="ml-3 h-3.5 w-6 shrink-0" />
        <span v-else-if="item.count != null" class="ml-3 shrink-0 text-muted">
          {{ item.count }}
        </span>
      </div>
    </template>
  </URadioGroup>
</template>
