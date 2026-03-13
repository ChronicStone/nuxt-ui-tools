<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
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
  clear: []
}>()

const showMatchMode = computed(() => props.operatorItems.length > 1)
</script>

<template>
  <div class="inline-flex min-w-0 max-w-full align-top">
    <UButton
      v-if="!props.active"
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
      <UButton
        color="neutral"
        variant="outline"
        size="md"
        class="shrink-0"
        :ui="{ base: 'h-10 px-3 text-sm font-medium' }"
      >
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
        :ui="{ base: 'h-10 px-3 text-sm font-medium' }"
        :class="props.active ? 'bg-elevated text-highlighted' : ''"
      >
        <span class="flex min-w-0 items-center gap-2">
          <span
            v-for="tag in props.previewTags ?? []"
            :key="tag"
            class="inline-flex h-7 max-w-[9rem] items-center truncate rounded-md border border-default bg-muted px-2.5 text-[13px] text-toned"
          >
            {{ tag }}
          </span>

          <span
            v-if="props.previewSummary"
            class="inline-flex h-7 items-center rounded-md border border-default bg-muted px-2.5 text-[13px] text-toned"
          >
            {{ props.previewSummary }}
          </span>

          <span v-if="!(props.previewTags?.length ?? 0) && !props.previewSummary" class="text-muted">
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
