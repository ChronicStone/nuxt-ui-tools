import { defineComponent, h } from 'vue'

import { dataValue, inputElement, optional } from './props'
import type { StubValue } from './props'

function currentFiles(value: StubValue): File[] {
  if (value instanceof File) {
    return [value]
  }
  return Array.isArray(value) ? value.filter((entry) => entry instanceof File) : []
}

export default defineComponent({
  emits: ['update:modelValue', 'change'],
  inheritAttrs: false,
  name: 'UFileUpload',
  props: {
    accept: optional,
    disabled: optional,
    modelValue: optional,
    multiple: optional,
    size: optional,
    ui: optional,
  },
  setup(props, { attrs, emit }) {
    return () =>
      h('div', { ...attrs, 'data-ui': 'UFileUpload' }, [
        h('input', {
          accept: dataValue(props.accept),
          disabled: Boolean(props.disabled),
          multiple: Boolean(props.multiple),
          onChange: (event: Event) => {
            const list = [...(inputElement(event)?.files ?? [])]
            emit('update:modelValue', props.multiple ? list : (list[0] ?? null))
            emit('change', event)
          },
          type: 'file',
        }),
        ...currentFiles(props.modelValue).map((file) =>
          h('span', { 'data-ui-file': file.name }, file.name),
        ),
      ])
  },
})
