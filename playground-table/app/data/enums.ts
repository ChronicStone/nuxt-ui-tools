export const ACCOUNT_STATUS = {
  active: 'Actif',
  inactive: 'Inactif',
  pending: 'En attente',
} as const

export const ACCOUNT_TYPE = {
  customer: 'Client',
  partner: 'Partenaire',
  strategicPartner: 'Partenaire stratégique',
  authorizedTestCenter: 'Centre de test autorisé',
  authorizedTestCenterFrEducation: 'Centre autorisé éducation FR',
  testCenter: 'Centre de test',
  education: 'Éducation',
  pendingCenter: 'Pending center',
} as const

export const COUNTRY = {
  FR: 'France',
  ES: 'Espagne',
  DE: 'Allemagne',
  GB: 'Royaume-Uni',
  CH: 'Suisse',
  BE: 'Belgique',
  IT: 'Italie',
  SE: 'Suède',
  DK: 'Danemark',
  NL: 'Pays-Bas',
  PT: 'Portugal',
  MA: 'Maroc',
  TN: 'Tunisie',
  SA: 'Arabie saoudite',
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
