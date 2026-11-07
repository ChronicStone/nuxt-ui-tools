import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { mountForm } from './harness'

describe('switch icon', () => {
  it('draws the icon beside the label and the description, and keeps it off the Nuxt UI switch', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          {
            description: 'Overall level, at the top of the result',
            key: 'overall',
            label: 'Overall score',
            props: { icon: 'i-lucide-gauge', ui: { leadingIcon: 'text-info' } },
            type: 'switch',
          },
        ],
      }),
    })
    const control = harness.wrapper.findComponent({ name: 'USwitch' })
    const icon = harness.wrapper.find('[data-switch-icon]')

    expect(icon.exists()).toBe(true)
    expect(icon.classes()).toContain('row-span-2')
    expect(icon.classes()).toContain('text-info')
    expect(harness.wrapper.find('[data-ui-slot="label"]').text()).toContain('Overall score')
    expect(control.attributes('icon')).toBeUndefined()
    expect(control.props('ui')).toMatchObject({
      description: expect.stringContaining('col-start-2'),
      label: expect.stringContaining('contents'),
      wrapper: expect.stringContaining('grid'),
    })
    harness.unmount()
  })

  it('leaves a switch without an icon as it was', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [{ key: 'overall', label: 'Overall score', type: 'switch' }],
      }),
    })

    expect(harness.wrapper.find('[data-switch-icon]').exists()).toBe(false)
    expect(harness.wrapper.find('[data-ui-slot="label"]').exists()).toBe(false)
    harness.unmount()
  })
})
