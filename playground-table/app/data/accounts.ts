import { faker } from '@faker-js/faker/locale/fr'

import { ACCOUNT_TYPE, COUNTRY, CURRENCY, GROUPS, MANAGER_LOCATIONS } from './enums'
import type { AccountStatus, AccountType, CountryCode, Currency } from './enums'

export interface Contact {
  id: string
  label: string
  email: string
  roles: readonly (
    | 'businessManager'
    | 'legalRepresentative'
    | 'billing'
    | 'agent'
    | 'projectManager'
  )[]
}

export interface Account {
  id: string
  name: string
  legalEntity: string
  status: AccountStatus
  accountType: AccountType
  country: CountryCode
  city: string
  group: string | null
  evoliz: boolean
  vtest: boolean
  edofSync: boolean
  businessManagerId: string | null
  updatedAt: string
  invitationSent: boolean
  debit: boolean
  metadata: string | null
  testCenter: string | null
  canPerformOnSite: boolean
  erpId: string | null
  vtestId: string | null
  managerLocation: string | null
  legalRepresentativeId: string | null
  billingContactId: string | null
  generalContacts: string[]
  preferredCurrency: Currency
  contracts: number
  consumption: number
  createdAt: string
}

function pick<T>(arr: readonly T[], i: number) {
  return arr[i % arr.length] as T
}
function keys<T extends object>(o: T) {
  return Object.keys(o) as (keyof T)[]
}

export function makeContacts(count: number, seed = 7): Contact[] {
  faker.seed(seed)
  const roleSets: Contact['roles'][] = [
    ['businessManager'],
    ['legalRepresentative'],
    ['billing'],
    ['businessManager', 'legalRepresentative'],
    ['billing', 'projectManager'],
    ['agent'],
  ]
  return Array.from({ length: count }, (_, i) => {
    const first = faker.person.firstName()
    const last = faker.person.lastName()
    return {
      email: faker.internet.email({ firstName: first, lastName: last }).toLowerCase(),
      id: `c${i + 1}`,
      label: `${first} ${last}`,
      roles: pick(roleSets, i),
    }
  })
}

export function makeAccounts(count: number, contacts: Contact[], seed = 42): Account[] {
  faker.seed(seed)
  const types = keys(ACCOUNT_TYPE)
  const countries = keys(COUNTRY)
  const bms = contacts.filter((c) => c.roles.includes('businessManager'))
  const legals = contacts.filter((c) => c.roles.includes('legalRepresentative'))
  const billings = contacts.filter((c) => c.roles.includes('billing'))
  return Array.from({ length: count }, (_, i) => {
    const status = i % 9 === 0 ? 'pending' : i % 13 === 0 ? 'inactive' : 'active'
    const type = pick(types, i * 3)
    const isTc = type.includes('TestCenter') || type === 'testCenter'
    const company = faker.company.name()
    const country = pick(countries, i * 5)
    const created = faker.date.between({ from: '2023-01-01', to: '2026-09-01' })
    const updated = faker.date.between({ from: created, to: '2026-09-18' })
    const pending = status === 'pending'
    return {
      accountType: type,
      billingContactId: pending && i % 3 ? null : pick(billings, i + 1).id,
      businessManagerId: pending && i % 2 ? null : pick(bms, i).id,
      canPerformOnSite: isTc || i % 4 === 0,
      city: faker.location.city(),
      consumption: pending ? 0 : (i * 137) % 900,
      contracts: pending ? 0 : (i * 7) % 5,
      country,
      createdAt: created.toISOString(),
      debit: i % 5 === 0,
      edofSync: country === 'FR' && i % 2 === 0,
      erpId: pending ? null : `EVZ-${10_000 + i * 7}`,
      evoliz: !pending && i % 4 !== 1,
      generalContacts: Array.from({ length: i % 4 }, (_, k) => pick(contacts, i * 7 + k).id),
      group: i % 3 === 0 ? null : pick(GROUPS, i),
      id: faker.string.alphanumeric({ casing: 'lower', length: 8 }),
      invitationSent: !pending,
      legalEntity: `${company} ${pick(['SAS', 'SARL', 'Ltd', 'SL', 'GmbH', 'AB'] as const, i)}`,
      legalRepresentativeId: pick(legals, i + 2).id,
      managerLocation: pending ? null : pick(MANAGER_LOCATIONS, i),
      metadata: i % 6 === 0 ? 'formulaire-inscription' : null,
      name: company,
      preferredCurrency: pick(CURRENCY, country === 'FR' || country === 'ES' ? 0 : i),
      status: status as AccountStatus,
      testCenter: isTc ? `${faker.location.city()} Center` : null,
      updatedAt: updated.toISOString(),
      vtest: !pending && i % 3 !== 2,
      vtestId: pending || i % 3 === 2 ? null : `VT-${country}-${String(i * 13).padStart(4, '0')}`,
    }
  })
}
