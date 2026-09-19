import { faker } from '@faker-js/faker/locale/fr'

export const AUDIT_ACTIONS = {
  'account.created': 'Compte créé',
  'account.updated': 'Compte modifié',
  'account.status.changed': 'Statut du compte modifié',
  'user.invited': 'Utilisateur invité',
  'user.suspended': 'Utilisateur suspendu',
  'contact.updated': 'Contact modifié',
  'contract.created': 'Contrat créé',
  'contract.status.changed': 'Statut du contrat modifié',
  'invoice.overdue': 'Facture en retard',
  'note.message.created': 'Message de mémo',
  'export.completed': 'Export terminé',
  'sync.evoliz': 'Synchronisation Evoliz',
  'sync.vtest': 'Synchronisation VTest',
  'sync.edof': 'Synchronisation EDOF',
} as const

export type AuditAction = keyof typeof AUDIT_ACTIONS
export type ActorType = 'user' | 'system' | 'external'
export type Outcome = 'succeeded' | 'failed' | 'skipped'

export type AuditEvent = {
  id: string
  at: string
  action: AuditAction
  actorType: ActorType
  actor: string
  target: string
  targetType: 'account' | 'user' | 'contact' | 'contract' | 'invoice' | 'note' | 'export'
  outcome: Outcome
  ip: string | null
  duration: number | null
  details: string
}

const pick = <T>(arr: readonly T[], i: number) => arr[i % arr.length] as T

export function makeAuditEvents(count: number, seed = 99): AuditEvent[] {
  faker.seed(seed)
  const actions = Object.keys(AUDIT_ACTIONS) as AuditAction[]
  const people = Array.from({ length: 12 }, () => faker.person.fullName())
  const accounts = Array.from({ length: 40 }, () => faker.company.name())
  let t = new Date('2026-09-18T18:00:00Z').getTime()
  return Array.from({ length: count }, (_, i) => {
    t -= faker.number.int({ min: 2 * 60_000, max: 6 * 3_600_000 })
    const action = pick(actions, i * 5)
    const system = action.startsWith('sync') || action === 'invoice.overdue' || action === 'export.completed'
    const external = !system && i % 7 === 0
    const outcome: Outcome = system && i % 11 === 0 ? 'failed' : system && i % 17 === 0 ? 'skipped' : 'succeeded'
    return {
      id: `ev${count - i}`,
      at: new Date(t).toISOString(),
      action,
      actorType: system ? 'system' : external ? 'external' : 'user',
      actor: system ? 'Système' : pick(people, i),
      target: pick(accounts, i * 3),
      targetType: action.startsWith('contract')
        ? 'contract'
        : action.startsWith('user')
          ? 'user'
          : action.startsWith('contact')
            ? 'contact'
            : action.startsWith('invoice')
              ? 'invoice'
              : action.startsWith('note')
                ? 'note'
                : action.startsWith('export')
                  ? 'export'
                  : 'account',
      outcome,
      ip: system ? null : faker.internet.ipv4(),
      duration: system ? faker.number.int({ min: 120, max: 42_000 }) : null,
      details: faker.lorem.sentence({ min: 4, max: 10 }),
    }
  })
}
