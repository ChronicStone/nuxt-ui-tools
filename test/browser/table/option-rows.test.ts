import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import FilterOptionMultipleList from '#ui-tools/table/components/filters/shared/filter-option-multiple-list.vue'

import { createAccountsSchema } from '../../dom/fixtures/accounts'
import { mountLoaded } from '../../dom/harness'
import type { Harness } from '../../dom/harness'
import { must } from '../../helpers/must'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

const LONG = 'SUPP - CLOSE UP Conseil et Formation (THERMAL SCIENCE ACADEMY OF THE NORTH)'

describe('filter option rows', () => {
  it('keeps long labels inside the editor width and ends them with an ellipsis', async () => {
    harness = await mountLoaded({
      render: () =>
        h('div', { 'data-editor': '', style: { width: '260px' } }, [
          h(FilterOptionMultipleList, {
            countLoading: false,
            sections: [
              {
                entries: [
                  {
                    children: [],
                    count: 3,
                    id: 'long',
                    label: LONG,
                    selected: false,
                    value: 'long',
                  },
                  {
                    children: [],
                    count: 1,
                    id: 'short',
                    label: 'Actif',
                    selected: true,
                    value: 'a',
                  },
                ],
                key: 'all',
              },
            ],
            showCounts: true,
          }),
        ]),
      schema: createAccountsSchema(),
    })
    const editor = must(harness.wrapper.find('[data-editor]').element).getBoundingClientRect()
    const row = must(harness.wrapper.findAll('.nut-dl-option')[0]).element
    const label = must(row.querySelector<HTMLElement>('button span:last-child'))

    expect([
      Math.round(row.getBoundingClientRect().right) <= Math.round(editor.right),
      label.scrollWidth > label.clientWidth,
      label.title,
    ]).toStrictEqual([true, true, LONG])
  })
})
