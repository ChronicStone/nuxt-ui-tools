import { defineComponent, h } from 'vue'

import { asStrings, inputElement, optional } from './props'

export default defineComponent({
  emits: ['update:modelValue', 'complete', 'blur'],
  inheritAttrs: false,
  name: 'UPinInput',
  props: {
    disabled: optional,
    length: optional,
    mask: optional,
    modelValue: optional,
    otp: optional,
    size: optional,
    type: optional,
    ui: optional,
  },
  setup(props, { attrs, emit }) {
    return () => {
      const length = Number(props.length ?? 5)
      const value = asStrings(props.modelValue)
      return h(
        'div',
        { ...attrs, 'data-length': String(length), 'data-ui': 'UPinInput' },
        Array.from({ length }, (_, index) =>
          h('input', {
            'data-index': String(index),
            disabled: Boolean(props.disabled),
            maxlength: 1,
            onInput: (event: Event) => {
              const next = [...value]
              next[index] = inputElement(event)?.value ?? ''
              emit('update:modelValue', next)
              if (next.filter(Boolean).length === length) {
                emit('complete', next)
              }
            },
            type: props.type === 'number' ? 'number' : 'text',
            value: value[index] ?? '',
          }),
        ),
      )
    }
  },
})
