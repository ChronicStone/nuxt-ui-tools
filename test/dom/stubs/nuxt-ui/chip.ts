import { defineComponent, h } from 'vue'

import { dataValue, optional } from './props'

export default defineComponent({
  inheritAttrs: false,
  name: 'UChip',
  props: { color: optional, inset: optional, size: optional, standalone: optional },
  setup(props, { attrs }) {
    return () =>
      h('span', {
        ...attrs,
        'data-color': dataValue(props.color),
        'data-inset': props.inset === undefined ? undefined : 'true',
        'data-size': dataValue(props.size),
        'data-standalone': props.standalone === undefined ? undefined : 'true',
        'data-ui': 'UChip',
      })
  },
})
