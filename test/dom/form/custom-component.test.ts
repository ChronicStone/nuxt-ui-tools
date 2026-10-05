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

  it('binds a component field to its value, props and disabled state like a control', async () => {
    const Picker = defineComponent({
      emits: ['update:modelValue'],
      props: {
        disabled: { type: Boolean, default: false },
        modelValue: { type: Array, default: () => [] },
        options: { type: Array, default: () => [] },
      },
      setup(props, { emit }) {
        return () =>
          h(
            'div',
            { 'data-testid': 'picker', 'data-disabled': String(props.disabled) },
            props.options.map((option) =>
              h(
                'button',
                {
                  type: 'button',
                  'data-option': String(option),
                  'aria-pressed': String(props.modelValue.includes(option)),
                  onClick: () => emit('update:modelValue', [...props.modelValue, option]),
                },
                String(option),
              ),
            ),
          )
      },
    })
    const harness = await mountForm({
      input: { spaces: ['admin'] },
      schema: defineFormSchema({
        fields: [
          { key: 'locked', type: 'checkbox', label: 'Locked', default: false },
          {
            key: 'spaces',
            type: 'custom-component',
            component: Picker,
            default: [],
            dependencies: ['locked'],
            disabled: ({ deps }) => deps.get('locked') === true,
            props: { options: ['admin', 'client'] },
          },
        ],
      }),
    })
    const option = (value: string) => harness.wrapper.find(`[data-option="${value}"]`)

    expect(option('admin').attributes('aria-pressed')).toBe('true')
    await option('client').trigger('click')
    await harness.flush()
    expect(harness.output().spaces).toStrictEqual(['admin', 'client'])
    expect(option('client').attributes('aria-pressed')).toBe('true')

    harness.form.state.set('locked', true)
    await harness.flush()
    expect(harness.wrapper.find('[data-testid="picker"]').attributes('data-disabled')).toBe('true')
    harness.unmount()
  })
})
