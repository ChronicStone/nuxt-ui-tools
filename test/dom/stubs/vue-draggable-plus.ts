import { defineComponent, h } from 'vue'

export const VueDraggable = defineComponent({
  emits: ['update:modelValue'],
  inheritAttrs: false,
  name: 'VueDraggable',
  props: { modelValue: { default: () => [], type: Array } },
  setup(_, { slots, attrs }) {
    return () => h('div', { ...attrs, 'data-ui': 'VueDraggable' }, slots.default?.())
  },
})
