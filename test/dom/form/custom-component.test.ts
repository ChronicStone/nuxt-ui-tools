import { describe, expect, it } from 'vitest'
import { defineComponent, h, onMounted, ref } from 'vue'

import { defineFormSchema } from '#ui-tools/form'

import { mountForm } from './harness'

describe('custom component fields', () => {
  it('keeps the rendered component mounted when its render output changes', async () => {
    let mounts = 0
    const Counter = defineComponent({
      props: { label: { type: String, required: true } },
      setup(props) {
        const clicks = ref(0)

        onMounted(() => {
          mounts += 1
        })

        return () =>
          h(
            'button',
            {
              type: 'button',
              'data-testid': 'counter',
              onClick: () => {
                clicks.value += 1
              },
            },
            `${props.label}:${clicks.value}`,
          )
      },
    })
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          { key: 'name', type: 'text', label: 'Name' },
          {
            key: 'probe',
            type: 'custom-component',
            dependencies: ['name'],
            render: ({ deps }) => h(Counter, { label: String(deps.get('name') ?? '') }),
          },
        ],
      }),
    })

    await harness.wrapper.find('[data-testid="counter"]').trigger('click')
    await harness.setInput('name', 'Ada')
    await harness.flush()

    expect(harness.wrapper.find('[data-testid="counter"]').text()).toBe('Ada:1')
    expect(mounts).toBe(1)
    harness.unmount()
  })
})
