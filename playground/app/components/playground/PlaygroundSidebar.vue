<script setup lang="ts">
import { computed } from 'vue'

import { usePlaygroundNavigation } from '../../composables/usePlaygroundNavigation'

const { abstractions, currentAbstraction, route } = usePlaygroundNavigation()
const currentId = computed(() => currentAbstraction.value?.id)
</script>

<template>
  <nav class="grid content-start gap-1 p-2" aria-label="Playground navigation">
    <section v-for="abstraction in abstractions" :key="abstraction.id" class="grid gap-0.5">
      <NuxtLink
        :to="abstraction.path"
        class="flex min-h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        :class="
          route.path === abstraction.path
            ? 'bg-elevated font-medium text-highlighted'
            : abstraction.id === currentId
              ? 'font-medium text-highlighted hover:bg-elevated/60'
              : 'text-muted hover:bg-elevated/60 hover:text-default'
        "
      >
        <UIcon :name="abstraction.icon" class="size-4 shrink-0" />
        <span class="min-w-0 flex-1 truncate">{{ abstraction.label }}</span>
      </NuxtLink>

      <div
        v-if="abstraction.id === currentId"
        class="mb-2 grid gap-0.5 border-l border-default/80 pl-1.5 ml-[1.1rem]"
      >
        <PlaygroundTreeNode
          v-for="node in abstraction.navigation"
          :key="node.id"
          :node="node"
          :route-path="route.path"
        />
      </div>
    </section>
  </nav>
</template>
