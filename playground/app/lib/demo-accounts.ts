export type DemoAccountStatus = 'active' | 'pending' | 'inactive'
export type DemoAccountKind = 'partner' | 'client' | 'testCenter'

export interface DemoAccount {
  id: string
  name: string
  kind: DemoAccountKind
  city: string
  status: DemoAccountStatus
}

/** Names and places are proper nouns, so the demo keeps them out of the locale files. */
const ACCOUNTS: readonly Omit<DemoAccount, 'id'>[] = [
  { city: 'Berlin', kind: 'partner', name: 'Deerberg, Gombert und Partner', status: 'pending' },
  { city: 'Köln', kind: 'client', name: 'Sachse GmbH', status: 'pending' },
  { city: 'Nantes', kind: 'client', name: 'Fleury SCS', status: 'active' },
  { city: 'Lyon', kind: 'testCenter', name: 'Centre QA Lyon', status: 'active' },
  { city: 'Bordeaux', kind: 'client', name: 'Moreau Conseil', status: 'active' },
  { city: 'Lille', kind: 'partner', name: 'Groupe Lemoine Formation', status: 'active' },
  { city: 'Strasbourg', kind: 'client', name: 'Müller Training GmbH', status: 'inactive' },
  { city: 'Toulouse', kind: 'testCenter', name: 'Centre QA Toulouse', status: 'active' },
  { city: 'Rennes', kind: 'client', name: 'Atelier Duval', status: 'pending' },
  { city: 'Marseille', kind: 'partner', name: 'Institut Rousseau', status: 'active' },
  { city: 'Paris', kind: 'client', name: 'Garnier Industrie', status: 'active' },
  { city: 'Dijon', kind: 'client', name: 'Cabinet Laurent & Associés', status: 'inactive' },
  { city: 'Hamburg', kind: 'partner', name: 'Weber Consulting', status: 'active' },
  { city: 'Montpellier', kind: 'testCenter', name: 'Centre QA Montpellier', status: 'pending' },
  { city: 'Nice', kind: 'client', name: 'Vidal Énergie', status: 'active' },
  { city: 'Reims', kind: 'client', name: 'SARL Petit Frères', status: 'active' },
  { city: 'Grenoble', kind: 'partner', name: 'Académie Nouvelle', status: 'pending' },
  { city: 'München', kind: 'client', name: 'Klein Bildung GmbH', status: 'active' },
  { city: 'Tours', kind: 'client', name: 'Lefèvre Logistique', status: 'inactive' },
  { city: 'Rouen', kind: 'testCenter', name: 'Centre QA Rouen', status: 'active' },
  { city: 'Metz', kind: 'client', name: 'Dupont Santé', status: 'active' },
  { city: 'Angers', kind: 'partner', name: 'Roux Formation', status: 'active' },
  { city: 'Clermont-Ferrand', kind: 'client', name: 'Charpentier & Fils', status: 'pending' },
  { city: 'Brest', kind: 'client', name: 'Éditions du Ponant', status: 'active' },
  { city: 'Limoges', kind: 'testCenter', name: 'Centre QA Limoges', status: 'inactive' },
  { city: 'Amiens', kind: 'client', name: 'Faure Mécanique', status: 'active' },
  { city: 'Dortmund', kind: 'partner', name: 'Schneider Akademie', status: 'active' },
  { city: 'Nancy', kind: 'client', name: 'Institut Mercier', status: 'active' },
  { city: 'Caen', kind: 'client', name: 'Association Horizon', status: 'pending' },
  { city: 'Perpignan', kind: 'testCenter', name: 'Centre QA Perpignan', status: 'active' },
  { city: 'Orléans', kind: 'client', name: 'Bernard Transports', status: 'active' },
  { city: 'Le Mans', kind: 'partner', name: 'Cabinet Gauthier', status: 'inactive' },
  { city: 'Poitiers', kind: 'client', name: 'Maison Perrin', status: 'active' },
  { city: 'Besançon', kind: 'client', name: 'Colin Maintenance', status: 'active' },
  { city: 'Pau', kind: 'testCenter', name: 'Centre QA Pau', status: 'pending' },
  { city: 'Saint-Étienne', kind: 'client', name: 'Roche & Cie', status: 'active' },
]

/** The first `count` demo accounts, in a fixed order so a screenshot reads the same every time. */
export function createDemoAccounts(count = ACCOUNTS.length): DemoAccount[] {
  return ACCOUNTS.slice(0, count).map((account, index) => ({
    ...account,
    id: `acc-${String(index + 1).padStart(3, '0')}`,
  }))
}

/** The two letters of an account's tile: the initials of its first two words. */
export function accountInitials(name: string) {
  return (
    name
      .split(/[\s,]+/u)
      .filter((word) => /^\p{L}/u.test(word))
      .slice(0, 2)
      .map((word) => word.charAt(0).toLocaleUpperCase())
      .join('') || name.slice(0, 2).toLocaleUpperCase()
  )
}
