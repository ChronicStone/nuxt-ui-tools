import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'

import { must } from '../../helpers/must'

// oxlint-disable-next-line import/no-unassigned-import -- the stylesheet the module ships is the subject
import '#ui-tools/shared/styles/scrollbars.css'

afterEach(() => {
  document.body.replaceChildren()
})

function scrollArea() {
  const area = document.createElement('div')
  area.style.cssText = 'height: 40px; width: 120px; overflow: auto'
  area.innerHTML = '<div style="height: 200px">content</div>'
  document.body.append(area)
  return area
}

describe('scrollbar stylesheet', () => {
  it('leaves elements without a transition, so a drawer opening starts none', () => {
    const area = scrollArea()
    for (const element of [area, must(area.firstElementChild), document.body]) {
      const style = getComputedStyle(element)
      expect(style.transitionDuration).toBe('0s')
      expect(style.transitionProperty).not.toContain('scrollbar-color')
    }
  })

  it('reveals the thumb while a scroll area is hovered', async () => {
    const area = scrollArea()
    const idle = getComputedStyle(area).scrollbarColor
    await userEvent.hover(area)
    const hovered = getComputedStyle(area).scrollbarColor
    expect(hovered).not.toBe(idle)
  })
})
