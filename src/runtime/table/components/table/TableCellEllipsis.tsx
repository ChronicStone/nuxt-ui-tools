/** @jsxImportSource vue */
/// <reference types="vue/jsx" />

import UTooltip from '@nuxt/ui/components/Tooltip.vue'
import { computed, defineComponent, onBeforeUnmount, ref } from 'vue'

export default defineComponent({
  name: 'TableCellEllipsis',
  props: {
    disabled: {
      default: false,
      type: Boolean,
    },
    title: {
      default: null,
      type: String,
    },
    wrapperClass: {
      default: '',
      type: String,
    },
  },
  setup(props, { slots }) {
    const contentRef = ref<HTMLElement | null>(null)
    const isOverflowing = ref(false)
    let resizeObserver: ResizeObserver | null = null

    const tooltipEnabled = computed(
      () => !props.disabled && Boolean(props.title) && isOverflowing.value,
    )

    function measureOverflow() {
      const element = contentRef.value

      if (!element) {
        isOverflowing.value = false
        return
      }

      isOverflowing.value =
        element.scrollWidth > element.clientWidth + 1 ||
        element.scrollHeight > element.clientHeight + 1
    }

    function startObserver() {
      if (resizeObserver || !('ResizeObserver' in globalThis) || !contentRef.value) {
        return
      }

      resizeObserver = new globalThis.ResizeObserver(() => {
        measureOverflow()
      })

      resizeObserver.observe(contentRef.value)
    }

    function stopObserver() {
      resizeObserver?.disconnect()
      resizeObserver = null
    }

    function handlePointerEnter() {
      measureOverflow()
      startObserver()
    }

    function handlePointerLeave() {
      stopObserver()
    }

    onBeforeUnmount(() => {
      stopObserver()
    })

    return () => (
      <UTooltip
        text={props.title ?? undefined}
        disabled={!tooltipEnabled.value}
        delay-duration={120}
        content={{ align: 'start', side: 'top' }}
      >
        <div
          ref={contentRef}
          class={[
            'block min-w-0 max-w-full truncate overflow-hidden whitespace-nowrap',
            props.wrapperClass,
          ]}
          onMouseenter={handlePointerEnter}
          onMouseleave={handlePointerLeave}
          onFocusin={handlePointerEnter}
          onFocusout={handlePointerLeave}
        >
          {slots.default?.()}
        </div>
      </UTooltip>
    )
  },
})
