import { defineComponent, h } from 'vue'

import { dataValue, optional, scalarText, textareaElement } from './props'

export default defineComponent({
  emits: ['update:modelValue', 'blur'],
  inheritAttrs: false,
  name: 'UTextarea',
  props: {
    autoresize: optional,
    color: optional,
    disabled: optional,
    maxrows: optional,
    modelValue: optional,
    placeholder: optional,
    rows: optional,
    size: optional,
    ui: optional,
    variant: optional,
  },
  setup(props, { attrs, emit }) {
    return () =>
      h('textarea', {
        ...attrs,
        'data-rows': dataValue(props.rows),
        'data-size': dataValue(props.size),
        'data-ui': 'UTextarea',
        disabled: Boolean(props.disabled),
        onBlur: (event: Event) => emit('blur', event),
        onInput: (event: Event) => emit('update:modelValue', textareaElement(event)?.value ?? ''),
        placeholder: dataValue(props.placeholder),
        value: scalarText(props.modelValue),
      })
  },
})
