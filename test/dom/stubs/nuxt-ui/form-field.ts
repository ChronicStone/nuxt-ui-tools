import { defineComponent, h } from 'vue'
import type { VNodeChild } from 'vue'

import { asRecord, dataValue, optional, scalarText } from './props'

export default defineComponent({
  inheritAttrs: false,
  name: 'UFormField',
  props: {
    description: optional,
    error: optional,
    help: optional,
    hint: optional,
    label: optional,
    name: optional,
    orientation: optional,
    required: optional,
    size: optional,
    ui: optional,
  },
  setup(props, { attrs, slots }) {
    function uiClass(slot: string) {
      return dataValue(asRecord(props.ui)?.[slot])
    }
    function renderHint() {
      if (slots.hint) {
        return h('span', { class: uiClass('hint'), 'data-ui-hint': '' }, slots.hint())
      }
      if (props.hint === undefined) {
        return null
      }
      return h('span', { class: uiClass('hint'), 'data-ui-hint': '' }, scalarText(props.hint))
    }
    function renderFooter() {
      if (props.error && props.error !== true) {
        return h('p', { class: uiClass('error'), 'data-ui-error': '' }, scalarText(props.error))
      }
      if (props.help !== undefined) {
        return h('p', { class: uiClass('help'), 'data-ui-help': '' }, scalarText(props.help))
      }
      return null
    }
    return () => {
      const children: VNodeChild[] = []
      if (props.label !== undefined || slots.hint) {
        children.push(
          h('div', { class: uiClass('labelWrapper'), 'data-ui-label-wrapper': '' }, [
            props.label === undefined
              ? null
              : h(
                  'label',
                  {
                    class: uiClass('label'),
                    'data-required': props.required ? 'true' : undefined,
                    'data-ui-label': '',
                  },
                  slots.label ? slots.label({ label: props.label }) : scalarText(props.label),
                ),
            renderHint(),
          ]),
        )
      }
      if (props.description !== undefined) {
        children.push(
          h(
            'p',
            { class: uiClass('description'), 'data-ui-description': '' },
            scalarText(props.description),
          ),
        )
      }
      children.push(
        h('div', { class: uiClass('container'), 'data-ui-container': '' }, slots.default?.()),
        renderFooter(),
      )
      return h(
        'div',
        {
          ...attrs,
          class: [attrs.class, uiClass('root')],
          'data-error': props.error ? 'true' : undefined,
          'data-name': dataValue(props.name),
          'data-orientation': dataValue(props.orientation) ?? 'vertical',
          'data-size': dataValue(props.size),
          'data-ui': 'UFormField',
        },
        children,
      )
    }
  },
})
