<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import FilterMatchModeButton from './FilterMatchModeButton.vue'

const props = defineProps<{
  label: string
  leadingIcon: string
  operatorLabel: string
  operatorItems: Array<{ label: string; value: string }>
  previewTags?: string[]
  previewSummary?: string
  active?: boolean
}>()

const emit = defineEmits<{
  selectOperator: [value: string]
  activate: [operator: string]
  clear: []
}>()

const showMatchMode = computed(() => props.operatorItems.length > 1)
const showOperatorPickerFirst = computed(() => !props.active && showMatchMode.value)
</script>

<template>
  <div class="inline-flex min-w-0 max-w-full align-top">
    <UDropdownMenu
      v-if="showOperatorPickerFirst"
      :items="[
        operatorItems.map((item) => ({
          label: item.label,
          onSelect: () => {
            emit('activate', item.value)
          },
        })),
      ]"
      :content="{ side: 'bottom', align: 'start', sideOffset: 6 }"
      :ui="{ content: 'rounded-xl p-1 shadow-xl' }"
    >
      <UButton
        color="neutral"
        variant="outline"
        size="md"
        class="min-w-0 shrink-0"
        :ui="{ base: 'h-10 px-3 text-sm font-medium' }"
        @pointerdown.stop
        @click.stop
      >
        <span class="flex min-w-0 items-center gap-2">
          <UIcon :name="props.leadingIcon" class="size-4 shrink-0 text-muted" />
          <span class="truncate">{{ props.label }}</span>
        </span>
      </UButton>
    </UDropdownMenu>

    <UButton
      v-else-if="!props.active"
      color="neutral"
      variant="outline"
      size="md"
      class="min-w-0 shrink-0"
      :ui="{ base: 'h-10 px-3 text-sm font-medium' }"
    >
      <span class="flex min-w-0 items-center gap-2">
        <UIcon :name="props.leadingIcon" class="size-4 shrink-0 text-muted" />
        <span class="truncate">{{ props.label }}</span>
      </span>
    </UButton>

    <UFieldGroup v-else size="md" class="min-w-0 max-w-full">
      <UButton color="neutral" variant="outline" size="md" class="shrink-0">
        <span class="flex min-w-0 items-center gap-2">
          <UIcon :name="props.leadingIcon" class="size-4 shrink-0 text-muted" />
          <span class="truncate">{{ props.label }}</span>
        </span>
      </UButton>

      <FilterMatchModeButton
        v-if="showMatchMode"
        :label="props.operatorLabel"
        :items="props.operatorItems"
        @select="emit('selectOperator', $event)"
      />

      <UButton
        color="neutral"
        variant="outline"
        size="md"
        class="min-w-0 max-w-full"
        :class="props.active ? 'bg-elevated text-highlighted' : ''"
      >
        <span class="flex min-w-0 items-center gap-2">
          <UBadge
            color="neutral"
            size="sm"
            variant="subtle"
            v-for="tag in props.previewTags ?? []"
            :key="tag"
          >
            {{ tag }}
          </UBadge>

          <span v-if="props.previewSummary">
            {{ props.previewSummary }}
          </span>

          <span
            v-if="!(props.previewTags?.length ?? 0) && !props.previewSummary"
            class="text-muted"
          >
            Select…
          </span>
        </span>
      </UButton>

      <UButton
        color="neutral"
        variant="outline"
        size="md"
        icon="i-lucide-x"
        class="shrink-0"
        :ui="{ base: 'h-10 px-3', leadingIcon: 'size-4' }"
        @pointerdown.stop
        @click.stop="emit('clear')"
      />
    </UFieldGroup>
  </div>
</template>
