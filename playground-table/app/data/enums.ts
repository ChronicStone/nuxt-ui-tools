export const ACCOUNT_STATUS = {
  active: 'Actif',
  inactive: 'Inactif',
  pending: 'En attente',
} as const

export const ACCOUNT_TYPE = {
  authorizedTestCenter: 'Centre de test autorisé',
  authorizedTestCenterFrEducation: 'Centre autorisé éducation FR',
  customer: 'Client',
  education: 'Éducation',
  partner: 'Partenaire',
  pendingCenter: 'Pending center',
  strategicPartner: 'Partenaire stratégique',
  testCenter: 'Centre de test',
} as const

export const COUNTRY = {
  BE: 'Belgique',
  CH: 'Suisse',
  DE: 'Allemagne',
  DK: 'Danemark',
  ES: 'Espagne',
  FR: 'France',
  GB: 'Royaume-Uni',
  IT: 'Italie',
  MA: 'Maroc',
  NL: 'Pays-Bas',
  PT: 'Portugal',
  SA: 'Arabie saoudite',
  SE: 'Suède',
  TN: 'Tunisie',
} as const

export const CURRENCY = ['EUR', 'USD', 'CHF', 'GBP'] as const

export const GROUPS = [
  'UI Research · Formation',
  'Nordic Alliance',
  'Réseau Alliance Sud',
  'Campus Grand Est',
  'Partenaires Ibériques',
] as const

export const MANAGER_LOCATIONS = [
  'Paris — Île-de-France',
  'Lyon — Auvergne-Rhône-Alpes',
  'Rennes — Bretagne',
  'Madrid',
  'Stockholm',
  'Berlin',
  'Milano',
  'Zürich',
] as const

export type AccountStatus = keyof typeof ACCOUNT_STATUS
export type AccountType = keyof typeof ACCOUNT_TYPE
export type CountryCode = keyof typeof COUNTRY
export type Currency = (typeof CURRENCY)[number]
