import { defineAsyncComponent, defineComponent, h } from 'vue'

/** Reserves the chart box while the renderer chunk loads, so nothing shifts when it lands. */
const XyPlaceholder = defineComponent({
  inheritAttrs: false,
  props: { height: { default: 250, type: Number } },
  setup: (props) => () =>
    h('div', { 'aria-hidden': 'true', style: { height: `${props.height}px` } }),
})

/** Ghost ring with the final geometry while the renderer chunk loads. */
const DonutPlaceholder = defineComponent({
  inheritAttrs: false,
  props: {
    size: { default: 150, type: Number },
    thickness: { default: 14, type: Number },
  },
  setup: (props) => () =>
    h('div', {
      'aria-hidden': 'true',
      class: 'rounded-full border-[var(--nut-dash-ghost)]',
      style: {
        borderWidth: `${props.thickness}px`,
        height: `${props.size}px`,
        width: `${props.size}px`,
      },
    }),
})

/**
 * Chart renderer seam. Blocks never import a chart library: they render these async components,
 * which are the only modules allowed to import `@unovis/*`. A second backend only needs another
 * entry with the same props.
 */
export const dashboardChartRenderer = {
  donut: defineAsyncComponent({
    delay: 0,
    loader: () => import('./unovis/dashboard-donut-chart.vue'),
    loadingComponent: DonutPlaceholder,
  }),
  xy: defineAsyncComponent({
    delay: 0,
    loader: () => import('./unovis/dashboard-xy-chart.vue'),
    loadingComponent: XyPlaceholder,
  }),
}
