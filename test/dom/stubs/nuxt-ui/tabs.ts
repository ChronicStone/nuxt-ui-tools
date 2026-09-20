import { defineComponent, h } from 'vue'

import { asRecords, optional, scalarText } from './props'

export default defineComponent({
  emits: ['update:modelValue'],
  inheritAttrs: false,
  name: 'UTabs',
  props: {
    color: optional,
    content: optional,
    items: optional,
    modelValue: optional,
    size: optional,
    ui: optional,
    variant: optional,
  },
  setup(props, { slots, attrs, emit }) {
    return () => {
      const items = asRecords(props.items)
      const active = scalarText(props.modelValue, scalarText(items[0]?.value))
      return h('div', { ...attrs, 'data-ui': 'UTabs' }, [
        h(
          'div',
          { role: 'tablist' },
          items.map((item) =>
            h(
              'button',
              {
                'aria-selected': scalarText(item.value) === active ? 'true' : 'false',
                'data-ui-tab': scalarText(item.value),
                onClick: () => emit('update:modelValue', item.value),
                role: 'tab',
                type: 'button',
              },
              slots.default ? slots.default({ index: 0, item }) : scalarText(item.label),
            ),
          ),
        ),
      ])
    }
  },
})
