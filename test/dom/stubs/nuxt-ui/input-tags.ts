import { defineComponent, h } from 'vue'

import { asStrings, dataValue, inputElement, optional } from './props'

export default defineComponent({
  emits: ['update:modelValue', 'blur'],
  inheritAttrs: false,
  name: 'UInputTags',
  props: {
    disabled: optional,
    max: optional,
    modelValue: optional,
    placeholder: optional,
    size: optional,
    ui: optional,
  },
  setup(props, { attrs, emit }) {
    return () => {
      const tags = asStrings(props.modelValue)
      return h('div', { ...attrs, 'data-ui': 'UInputTags' }, [
        ...tags.map((tag) =>
          h('span', { 'data-ui-tag': tag }, [
            tag,
            h('button', {
              'data-ui-tag-remove': '',
              onClick: () =>
                emit(
                  'update:modelValue',
                  tags.filter((candidate) => candidate !== tag),
                ),
              type: 'button',
            }),
          ]),
        ),
        h('input', {
          disabled: Boolean(props.disabled),
          onBlur: (event: Event) => emit('blur', event),
          onKeydown: (event: KeyboardEvent) => {
            const target = inputElement(event)
            if (event.key !== 'Enter' || !target?.value) {
              return
            }
            emit('update:modelValue', [...tags, target.value])
            target.value = ''
          },
          placeholder: dataValue(props.placeholder),
          type: 'text',
        }),
      ])
    }
  },
})
