import type { FormRemoteOptionConfig } from '#ui-tools/form'

import type { Account, Contact } from '../data/accounts'
import { wait } from '../utils/wait'

interface PickerOption {
  label: string
  description?: string
  value: string
}

interface Named {
  id: string
  label: string
  description?: string
}

function remoteSource(items: readonly Named[]): FormRemoteOptionConfig<PickerOption> {
  return {
    mode: 'remote',
    pagination: { size: 8, type: 'page' },
    resolveSelected: async ({ values }) => {
      await wait(150)
      return items
        .filter((item) => values.includes(item.id))
        .map((item) => ({ description: item.description, label: item.label, value: item.id }))
    },
    search: { debounce: 200, minLength: 0 },
    source: async ({ search, page }) => {
      await wait(300)
      const term = search.toLowerCase()
      const filtered = items.filter((item) => item.label.toLowerCase().includes(term))
      const start = (page.index - 1) * page.size
      return {
        hasMore: start + page.size < filtered.length,
        options: filtered
          .slice(start, start + page.size)
          .map((item) => ({ description: item.description, label: item.label, value: item.id })),
      }
    },
  }
}

export function accountOptions(accounts: readonly Account[]) {
  return remoteSource(
    accounts.map((account) => ({
      description: account.legalEntity,
      id: account.id,
      label: account.name,
    })),
  )
}

export function contactOptions(contacts: readonly Contact[]) {
  return remoteSource(
    contacts.map((contact) => ({
      description: contact.email,
      id: contact.id,
      label: contact.label,
    })),
  )
}
