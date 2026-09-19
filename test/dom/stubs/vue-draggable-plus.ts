import { defineComponent, h } from 'vue'

import { dataValue, optional } from './nuxt-ui/props'

export const VueDraggable = defineComponent({
  emits: ['update:modelValue', 'end'],
  inheritAttrs: false,
  name: 'VueDraggable',
  props: { modelValue: { default: () => [], type: Array }, tag: optional },
  setup(props, { slots, attrs }) {
    return () =>
      h(dataValue(props.tag) ?? 'div', { ...attrs, 'data-ui': 'VueDraggable' }, slots.default?.())
  },
})
