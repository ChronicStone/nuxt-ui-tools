import { defineComponent } from 'vue'
import type { VNodeChild } from 'vue'

/**
 * Renders what a `renderOption` or `renderValue` function returned. The function is called inside
 * this component's render, so the reactive state it reads re-renders only this option.
 */
export default defineComponent((props: { content: () => VNodeChild }) => () => props.content(), {
  name: 'FormOptionRender',
  props: ['content'],
})
