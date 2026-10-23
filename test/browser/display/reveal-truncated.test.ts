import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import type { Component } from 'vue'

import DisplayFacts from '#ui-tools/display/components/blocks/display-facts.vue'
import DisplayRecord from '#ui-tools/display/components/blocks/display-record.vue'

import { must } from '../../helpers/must'
import { settle } from '../dashboard/layout'

const mounted: { unmount: () => void }[] = []

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
})

function inBox<TProps extends object>(width: number, component: Component, props: TProps) {
  const wrapper = mount(() => h('div', { style: `width: ${width}px` }, [h(component, props)]), {
    attachTo: document.body,
  })
  mounted.push(wrapper)
}

function hover(element: Element) {
  element.dispatchEvent(new PointerEvent('pointerenter'))
}

const LONG = 'TOEIC Listening & Reading · Lyon Part-Dieu · Thursday morning session, room 3'

describe('truncated display text', () => {
  it('titles a record title cut by its box with the full text', async () => {
    inBox(220, DisplayRecord, { meta: LONG, title: LONG })
    await settle()
    const title = must(document.querySelector<HTMLElement>('.font-semibold.truncate'))
    expect(title.scrollWidth).toBeGreaterThan(title.clientWidth)
    hover(title)
    expect(title.getAttribute('title')).toBe(LONG)
  })

  it('leaves text that fits without a title', async () => {
    inBox(900, DisplayRecord, { title: 'Short title' })
    await settle()
    const title = must(document.querySelector<HTMLElement>('.font-semibold.truncate'))
    hover(title)
    expect(title.hasAttribute('title')).toBe(false)
  })

  it('titles a facts value an app truncates through ui', async () => {
    inBox(200, DisplayFacts, {
      items: [{ label: 'Address', value: LONG }],
      layout: 'grid',
      ui: { value: 'truncate block' },
    })
    await settle()
    const value = must(document.querySelector<HTMLElement>('[data-display-value]'))
    hover(value)
    expect(value.getAttribute('title')).toBe(LONG)
  })
})
