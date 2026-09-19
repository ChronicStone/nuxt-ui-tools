import { faker } from '@faker-js/faker/locale/fr'

import {
  ACCOUNT_STATUS,
  ACCOUNT_TYPE,
  COUNTRY,
  CURRENCY,
  GROUPS,
  MANAGER_LOCATIONS,
  type AccountStatus,
  type AccountType,
  type CountryCode,
  type Currency,
} from './enums'

export type Contact = {
  id: string
  label: string
  email: string
  roles: readonly ('businessManager' | 'legalRepresentative' | 'billing' | 'agent' | 'projectManager')[]
}

export type Account = {
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

const pick = <T>(arr: readonly T[], i: number) => arr[i % arr.length] as T
const keys = <T extends object>(o: T) => Object.keys(o) as (keyof T)[]

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
      id: `c${i + 1}`,
      label: `${first} ${last}`,
      email: faker.internet.email({ firstName: first, lastName: last }).toLowerCase(),
      roles: pick(roleSets, i),
    }
  })
}

export function makeAccounts(count: number, contacts: Contact[], seed = 42): Account[] {
  faker.seed(seed)
  const statuses = keys(ACCOUNT_STATUS)
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
      id: faker.string.alphanumeric({ length: 8, casing: 'lower' }),
      name: company,
      legalEntity: `${company} ${pick(['SAS', 'SARL', 'Ltd', 'SL', 'GmbH', 'AB'] as const, i)}`,
      status: status as AccountStatus,
      accountType: type,
      country,
      city: faker.location.city(),
      group: i % 3 === 0 ? null : pick(GROUPS, i),
      evoliz: !pending && i % 4 !== 1,
      vtest: !pending && i % 3 !== 2,
      edofSync: country === 'FR' && i % 2 === 0,
      businessManagerId: pending && i % 2 ? null : pick(bms, i).id,
      updatedAt: updated.toISOString(),
      invitationSent: !pending,
      debit: i % 5 === 0,
      metadata: i % 6 === 0 ? 'formulaire-inscription' : null,
      testCenter: isTc ? `${faker.location.city()} Center` : null,
      canPerformOnSite: isTc || i % 4 === 0,
      erpId: pending ? null : `EVZ-${10000 + i * 7}`,
      vtestId: pending || i % 3 === 2 ? null : `VT-${country}-${String(i * 13).padStart(4, '0')}`,
      managerLocation: pending ? null : pick(MANAGER_LOCATIONS, i),
      legalRepresentativeId: pick(legals, i + 2).id,
      billingContactId: pending && i % 3 ? null : pick(billings, i + 1).id,
      generalContacts: Array.from({ length: i % 4 }, (_, k) => pick(contacts, i * 7 + k).id),
      preferredCurrency: pick(CURRENCY, country === 'FR' || country === 'ES' ? 0 : i),
      contracts: pending ? 0 : (i * 7) % 5,
      consumption: pending ? 0 : (i * 137) % 900,
      createdAt: created.toISOString(),
    }
  })
}
