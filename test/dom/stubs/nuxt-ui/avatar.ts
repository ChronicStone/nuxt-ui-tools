import { defineComponent, h } from 'vue'

import { dataValue, optional } from './props'

export default defineComponent({
  inheritAttrs: false,
  name: 'UAvatar',
  props: { alt: optional, size: optional, src: optional, text: optional },
  setup(props, { attrs }) {
    return () =>
      h('span', {
        ...attrs,
        'data-alt': dataValue(props.alt),
        'data-size': dataValue(props.size),
        'data-src': dataValue(props.src),
        'data-text': dataValue(props.text),
        'data-ui': 'UAvatar',
      })
  },
})
