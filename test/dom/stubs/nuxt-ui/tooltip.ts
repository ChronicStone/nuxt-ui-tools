import { defineComponent, h } from 'vue'

import { optional } from './props'

export default defineComponent({
  inheritAttrs: false,
  name: 'UTooltip',
  props: {
    arrow: optional,
    content: optional,
    disabled: optional,
    open: optional,
    text: optional,
    ui: optional,
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'div',
        { ...attrs, 'data-ui': 'UTooltip', 'data-open': props.open === true ? '' : undefined },
        [
          ...(slots.default?.() ?? []),
          props.disabled === true || !slots.content
            ? null
            : h('div', { 'data-ui-tooltip-content': '' }, slots.content()),
        ],
      )
  },
})
