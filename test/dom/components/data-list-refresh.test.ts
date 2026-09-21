import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListRefresh from '#ui-tools/table/components/data-list/data-list-refresh.vue'

import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('DataListRefresh', () => {
  it('finishes the active rotation after loading completes', async () => {
    harness = await mountLoaded({
      render: () => h(DataListRefresh),
      schema: createAccountsSchema({ delay: 80 }),
    })
    const button = harness.wrapper.find('button')

    await button.trigger('click')
    await harness.until(() => button.attributes('data-refreshing') === 'true')
    await harness.until(() => !harness?.internals.queryContent.status.value.isFetching)

    expect(button.attributes('data-refreshing')).toBe('true')

    await button.trigger('animationiteration', { animationName: 'nut-dl-refresh-spin' })

    expect(button.attributes('data-refreshing')).toBe('false')
  })
})
