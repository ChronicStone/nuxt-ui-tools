<script setup lang="ts">
defineProps<{
  direction: 'forward' | 'backward'
}>()

const emit = defineEmits<{
  beforeEnter: []
  afterEnter: []
}>()

const activeClass =
  'transition-[opacity,transform] duration-200 ease-out will-change-transform motion-reduce:transition-none motion-reduce:transform-none'
</script>

<template>
  <Transition
    :enter-active-class="activeClass"
    :leave-active-class="`absolute inset-0 w-full ${activeClass}`"
    :enter-from-class="direction === 'forward' ? 'translate-x-52 opacity-0' : '-translate-x-52 opacity-0'"
    enter-to-class="translate-x-0 opacity-100"
    leave-from-class="translate-x-0 opacity-100"
    :leave-to-class="direction === 'forward' ? '-translate-x-52 opacity-0' : 'translate-x-52 opacity-0'"
    @before-enter="emit('beforeEnter')"
    @after-enter="emit('afterEnter')"
  >
    <slot />
  </Transition>
</template>
