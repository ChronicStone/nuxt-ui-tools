import { defineComponent, h } from 'vue'

/** Stand-in for every `@unovis/vue` component: renders its default slot, never measures SVG. */
export default defineComponent({
  inheritAttrs: false,
  name: 'UnovisStub',
  setup(_, { slots }) {
    return () => h('div', { 'data-unovis': '' }, slots.default?.())
  },
})
