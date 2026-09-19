import { makeAccounts, makeContacts } from '../data/accounts'
import type { Account, Contact } from '../data/accounts'

let cache: { contacts: Contact[]; accounts: Account[] } | null = null

export function useAccountsData(count = 154) {
  if (!cache || cache.accounts.length !== count) {
    const contacts = makeContacts(40)
    cache = { accounts: makeAccounts(count, contacts), contacts }
  }
  const byId = new Map(cache.contacts.map((c) => [c.id, c]))
  return {
    ...cache,
    contactName: (id: string | null) => (id ? (byId.get(id)?.label ?? null) : null),
  }
}
