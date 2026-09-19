import { defineComponent, h } from 'vue'

export const VueDraggable = defineComponent({
  name: 'VueDraggable',
  inheritAttrs: false,
  props: { modelValue: { type: Array, default: () => [] } },
  emits: ['update:modelValue'],
  setup(_, { slots, attrs }) {
    return () => h('div', { ...attrs, 'data-ui': 'VueDraggable' }, slots.default?.())
  },
})
