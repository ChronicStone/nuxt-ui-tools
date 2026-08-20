<script setup lang="ts">
import { computed } from 'vue'

import type { PlaygroundNavigationNode } from '../../composables/usePlaygroundNavigation'
import { navigationNodeContainsPath } from '../../composables/usePlaygroundNavigation'

const props = defineProps<{
  node: PlaygroundNavigationNode
  routePath: string
  depth?: number
}>()

const resolvedDepth = computed(() => props.depth ?? 0)
const hasChildren = computed(() => Boolean(props.node.children?.length))
const containsCurrentPath = computed(() => navigationNodeContainsPath(props.node, props.routePath))
const isActive = computed(() => props.node.path === props.routePath)
const linkInset = computed(() => `${Math.min(resolvedDepth.value, 3) * 0.75}rem`)
</script>

<template>
  <details
    v-if="hasChildren"
    class="group/tree"
    :open="containsCurrentPath"
  >
    <summary
      class="flex min-h-8 cursor-pointer list-none items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted transition-colors hover:bg-elevated/65 hover:text-default [&::-webkit-details-marker]:hidden"
      :style="{ paddingLeft: `calc(0.5rem + ${linkInset})` }"
    >
      <UIcon
        name="i-lucide-chevron-right"
        class="size-3.5 shrink-0 transition-transform duration-150 group-open/tree:rotate-90"
      />
      <NuxtLink
        v-if="node.path"
        :to="node.path"
        class="min-w-0 flex-1 truncate focus-visible:outline-none"
        :class="isActive ? 'text-highlighted' : undefined"
        @click.stop
      >
        {{ node.label }}
      </NuxtLink>
      <span v-else class="min-w-0 flex-1 truncate">{{ node.label }}</span>
    </summary>

    <div class="relative mt-0.5 grid gap-0.5 before:absolute before:bottom-1 before:left-[calc(1rem+var(--tree-inset))] before:top-1 before:w-px before:bg-border/80" :style="{ '--tree-inset': linkInset }">
      <PlaygroundTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :route-path="routePath"
        :depth="resolvedDepth + 1"
      />
    </div>
  </details>

  <NuxtLink
    v-else-if="node.path"
    :to="node.path"
    :aria-current="isActive ? 'page' : undefined"
    class="flex min-h-8 items-center gap-2 rounded-md px-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    :class="
      isActive
        ? 'bg-elevated font-medium text-highlighted'
        : 'text-muted hover:bg-elevated/65 hover:text-default'
    "
    :style="{ paddingLeft: `calc(1.25rem + ${linkInset})` }"
  >
    <span
      class="size-1.5 shrink-0 rounded-full"
      :class="isActive ? 'bg-primary' : 'bg-border'"
      aria-hidden="true"
    />
    <span class="min-w-0 flex-1 truncate">{{ node.label }}</span>
  </NuxtLink>
</template>
