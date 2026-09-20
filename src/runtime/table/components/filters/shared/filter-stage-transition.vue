<script setup lang="ts">
withDefaults(
  defineProps<{
    stageKey: string
    direction?: 'forward' | 'backward'
  }>(),
  {
    direction: 'forward',
  },
)

const emit = defineEmits<{
  settled: []
}>()
</script>

<template>
  <div data-filter-stage class="grid w-full min-w-0 overflow-hidden">
    <Transition :name="`filter-stage-${direction}`" @after-leave="emit('settled')">
      <div
        :key="stageKey"
        data-filter-stage-content
        class="col-start-1 row-start-1 w-full min-w-0 max-w-full"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.filter-stage-forward-enter-active,
.filter-stage-backward-enter-active {
  transition:
    opacity 170ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 170ms cubic-bezier(0.22, 1, 0.36, 1);
}

.filter-stage-forward-leave-active,
.filter-stage-backward-leave-active {
  transition:
    opacity 110ms cubic-bezier(0.4, 0, 1, 1),
    transform 110ms cubic-bezier(0.4, 0, 1, 1);
}

.filter-stage-forward-enter-from,
.filter-stage-backward-leave-to {
  opacity: 0;
  transform: translateX(6px);
}

.filter-stage-forward-leave-to,
.filter-stage-backward-enter-from {
  opacity: 0;
  transform: translateX(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .filter-stage-forward-enter-active,
  .filter-stage-backward-enter-active,
  .filter-stage-forward-leave-active,
  .filter-stage-backward-leave-active {
    transition: opacity 80ms linear;
  }

  .filter-stage-forward-enter-from,
  .filter-stage-backward-leave-to,
  .filter-stage-forward-leave-to,
  .filter-stage-backward-enter-from {
    transform: none;
  }
}
</style>
