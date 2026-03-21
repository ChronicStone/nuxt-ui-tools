<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'

type TreeEntry = {
  id: string
  label: string
  value?: string | number | boolean
  count?: number
  icon?: string
  depth: number
  expandable: boolean
  expanded: boolean
  selectable: boolean
  branchSelectable?: boolean
  selected?: boolean
  indeterminate?: boolean
  truncate?: boolean
}

defineProps<{
  entries: TreeEntry[]
  items: Array<{
    id: string
    label: string
    value: string
    count?: number
    icon?: string
    truncate?: boolean
    depth: number
    expandable: boolean
    expanded: boolean
    selectable: boolean
    disabled?: boolean
  }>
  multiple: boolean
  countLoading: boolean
  selectedIcon?: string
}>()

const emit = defineEmits<{
  toggleEntry: [entryId: string]
  toggleExpanded: [entryId: string]
}>()

const modelValue = defineModel<string | undefined>({
  default: undefined,
})

function getTreeIndentStyle(depth: number) {
  return {
    paddingInlineStart: `${depth * 10}px`,
  }
}
</script>

<template>
  <div v-if="multiple" class="grid gap-0.5">
    <button
      v-for="entry in entries"
      :key="entry.id"
      type="button"
      class="block w-full"
      @click="emit('toggleEntry', entry.id)"
    >
      <div
        class="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-elevated"
        :class="entry.selected ? 'bg-elevated text-highlighted' : 'text-default'"
      >
        <div class="flex min-w-0 flex-1 items-center gap-3" :style="getTreeIndentStyle(entry.depth)">
          <button
            v-if="entry.expandable"
            type="button"
            class="flex size-4 shrink-0 items-center justify-center text-muted transition-transform"
            :class="entry.expanded ? 'rotate-90' : ''"
            @click.stop="emit('toggleExpanded', entry.id)"
          >
            <UIcon name="i-lucide-chevron-right" class="size-4" />
          </button>
          <span v-else class="size-4 shrink-0" />

          <UCheckbox
            v-if="entry.selectable || entry.branchSelectable"
            :model-value="entry.indeterminate ? 'indeterminate' : entry.selected"
            color="neutral"
            size="md"
            tabindex="-1"
            :icon="selectedIcon"
            :ui="{ base: '!rounded-md', indicator: '!rounded-none' }"
          />
          <span v-else class="size-5 shrink-0" />

          <UIcon
            v-if="entry.icon"
            :name="entry.icon"
            class="size-4 shrink-0 text-muted"
          />

          <span class="min-w-0 flex-1" :class="entry.truncate ? 'truncate' : ''">
            {{ entry.label }}
          </span>
        </div>

        <USkeleton v-if="countLoading" class="ml-3 h-3.5 w-6 shrink-0" />
        <span v-else-if="entry.count != null" class="ml-3 shrink-0 text-muted">
          {{ entry.count }}
        </span>
      </div>
    </button>
  </div>

  <URadioGroup
    v-else-if="items.length"
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
      <div class="flex min-w-0 items-center gap-3" :style="getTreeIndentStyle(item.depth)">
        <button
          v-if="item.expandable"
          type="button"
          class="flex size-4 shrink-0 items-center justify-center text-muted transition-transform"
          :class="item.expanded ? 'rotate-90' : ''"
          @click.stop.prevent="emit('toggleExpanded', item.id)"
        >
          <UIcon name="i-lucide-chevron-right" class="size-4" />
        </button>
        <span v-else class="size-4 shrink-0" />

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
