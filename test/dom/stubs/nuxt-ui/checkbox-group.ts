import { defineComponent, h } from 'vue'

import { asRecords, asScalar, dataValue, optional, scalarText } from './props'

export default defineComponent({
  emits: ['update:modelValue'],
  inheritAttrs: false,
  name: 'UCheckboxGroup',
  props: {
    disabled: optional,
    indicator: optional,
    items: optional,
    modelValue: optional,
    orientation: optional,
    size: optional,
    ui: optional,
    variant: optional,
  },
  setup(props, { attrs, emit }) {
    return () => {
      const selected = Array.isArray(props.modelValue) ? props.modelValue.map(asScalar) : []
      return h(
        'div',
        {
          ...attrs,
          'data-orientation': dataValue(props.orientation),
          'data-ui': 'UCheckboxGroup',
          'data-variant': dataValue(props.variant),
          role: 'group',
        },
        asRecords(props.items).map((item) => {
          const value = asScalar(item.value)
          const checked = selected.includes(value)
          return h('label', { 'data-ui-option': scalarText(value) }, [
            h('input', {
              checked,
              disabled: Boolean(props.disabled) || item.disabled === true,
              onChange: () =>
                emit(
                  'update:modelValue',
                  checked ? selected.filter((entry) => entry !== value) : [...selected, value],
                ),
              type: 'checkbox',
              value: scalarText(value),
            }),
            scalarText(item.label),
          ])
        }),
      )
    }
  },
})
