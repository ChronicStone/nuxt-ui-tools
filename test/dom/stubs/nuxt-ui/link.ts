import { defineComponent, h } from 'vue'

import { isString } from '#ui-tools/shared/utils/predicate'

import { dataValue, optional } from './props'

/** An anchor when `to` is a path, otherwise the element named by `as`. Classes and listeners pass through. */
export default defineComponent({
  inheritAttrs: false,
  name: 'ULink',
  props: { as: optional, disabled: optional, raw: optional, to: optional, type: optional },
  setup(props, { attrs, slots }) {
    return () => {
      const href = isString(props.to) ? props.to : undefined
      const tag = href ? 'a' : (dataValue(props.as) ?? 'button')
      return h(
        tag,
        {
          ...attrs,
          'data-ui': 'ULink',
          href,
          type: tag === 'button' ? (dataValue(props.type) ?? 'button') : undefined,
        },
        slots.default?.(),
      )
    }
  },
})
