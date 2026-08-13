import { describe, expect, it } from 'vitest'

import {
  parseResponsiveValue,
  resolveResponsiveValueAtBreakpoint,
} from '#ui-tools/shared/utils/responsive'

describe('responsive value helpers', () => {
  const breakpointKeys = ['sm', 'md', 'lg', 'xl']

  it('parses responsive strings with backward fallback per breakpoint', () => {
    expect(parseResponsiveValue('1 md:2 xl:4', breakpointKeys)).toEqual({
      sm: '1',
      md: '2',
      lg: '2',
      xl: '4',
    })
  })

  it('returns null before the first declared breakpoint value exists', () => {
    expect(
      resolveResponsiveValueAtBreakpoint('lg:3', {
        breakpoint: 'md',
        breakpointKeys,
      }),
    ).toBeNull()
  })

  it('resolves the value for a specific breakpoint without a reactive context', () => {
    expect(
      resolveResponsiveValueAtBreakpoint('1 md:2 xl:4', {
        breakpoint: 'lg',
        breakpointKeys,
      }),
    ).toBe('2')
  })

  it('applies built-in transforms', () => {
    expect(
      resolveResponsiveValueAtBreakpoint(
        '1 md:2 xl:4',
        {
          breakpoint: 'xl',
          breakpointKeys,
        },
        'integer',
      ),
    ).toBe(4)

    expect(
      resolveResponsiveValueAtBreakpoint(
        'false lg:true',
        {
          breakpoint: 'lg',
          breakpointKeys,
        },
        'boolean',
      ),
    ).toBe(true)

    expect(
      resolveResponsiveValueAtBreakpoint(
        '1 md:2',
        {
          breakpoint: 'md',
          breakpointKeys,
        },
        'grid-cols',
      ),
    ).toBe('grid-template-columns: repeat(2, minmax(0, 1fr))')
  })

  it('passes through non-string values', () => {
    expect(resolveResponsiveValueAtBreakpoint(3, { breakpoint: 'lg', breakpointKeys })).toBe(3)
    expect(resolveResponsiveValueAtBreakpoint(true, { breakpoint: 'lg', breakpointKeys })).toBe(
      true,
    )
  })
})
