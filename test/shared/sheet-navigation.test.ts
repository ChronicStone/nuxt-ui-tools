import { describe, expect, it } from 'vitest'

import { nextSheetInput } from '#ui-tools/shared'

/* Two columns, three rows, the second column skips a row. */
const inputs = ['a1', 'b1', 'a2', 'a3', 'b3']
const middle = { atEnd: false, atStart: false }
const whole = { atEnd: true, atStart: true }

function press(current: string, key: string, caret = whole, shiftKey = false) {
  return nextSheetInput({
    caret,
    columnOf: (input) => input.charAt(0),
    current,
    inputs,
    key,
    shiftKey,
  })
}

describe('nextSheetInput', () => {
  it('stays in the column going up and down, across a row the column skips', () => {
    expect(press('b1', 'ArrowDown')).toBe('b3')
    expect(press('b3', 'ArrowUp')).toBe('b1')
    expect(press('a1', 'ArrowDown')).toBe('a2')
  })

  it('moves down on Enter and up on Shift+Enter', () => {
    expect(press('a2', 'Enter')).toBe('a3')
    expect(press('a2', 'Enter', whole, true)).toBe('a1')
  })

  it('follows the reading order going left and right', () => {
    expect(press('b1', 'ArrowRight')).toBe('a2')
    expect(press('a2', 'ArrowLeft')).toBe('b1')
  })

  it('leaves left and right to the input while the caret has text to cross', () => {
    expect(press('b1', 'ArrowRight', middle)).toBeUndefined()
    expect(press('b1', 'ArrowLeft', middle)).toBeUndefined()
    expect(press('a2', 'ArrowDown', middle)).toBe('a3')
  })

  it('stops at the edges and ignores other keys', () => {
    expect(press('a1', 'ArrowUp')).toBeUndefined()
    expect(press('b3', 'ArrowDown')).toBeUndefined()
    expect(press('a1', 'x')).toBeUndefined()
  })
})
