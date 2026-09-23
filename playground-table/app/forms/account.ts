import { defineFormPageSchema, defineFormPageSection } from '#ui-tools/form'
import type { FormValue } from '#ui-tools/form'
import { isString } from '#ui-tools/shared/utils/predicate'

import type { Account, Contact } from '../data/accounts'
import { COUNTRY, CURRENCY, GROUPS, MANAGER_LOCATIONS } from '../data/enums'
import { contactOptions } from './pickers'

const COUNTRIES = Object.entries(COUNTRY).map(([value, label]) => ({ label, value }))
const CURRENCIES = CURRENCY.map((value) => ({ label: value, value }))
const GROUP_OPTIONS = GROUPS.map((value) => ({ label: value, value }))
const MANAGER_LOCATION_OPTIONS = MANAGER_LOCATIONS.map((value) => ({ label: value, value }))

const TYPE_OPTIONS = [
  {
    description: 'Organisme qui achète des tests pour ses candidats.',
    icon: 'i-lucide-building-2',
    label: 'Client',
    value: 'customer',
  },
  {
    description: 'Revend ou distribue les évaluations ExAssess.',
    icon: 'i-lucide-users',
    label: 'Partenaire',
    value: 'partner',
  },
  {
    description: 'Partenaire avec conditions et reporting dédiés.',
    icon: 'i-lucide-sparkles',
    label: 'Partenaire stratégique',
    value: 'strategicPartner',
  },
  {
    description: 'Fait passer les tests, synchronisé avec VTest.',
    icon: 'i-lucide-map-pin',
    label: 'Centre de test autorisé',
    value: 'authorizedTestCenter',
  },
  {
    description: 'Centre rattaché sans autorisation propre.',
    icon: 'i-lucide-target',
    label: 'Centre de test',
    value: 'testCenter',
  },
  {
    description: 'Établissement scolaire ou universitaire.',
    icon: 'i-lucide-badge-check',
    label: 'Éducation',
    value: 'education',
  },
] as const

const TEST_CENTER_TYPES = new Set(['authorizedTestCenter', 'testCenter'])

function isTestCenterType(value: FormValue) {
  return isString(value) && TEST_CENTER_TYPES.has(value)
}

/** Type of the account: it conditions the fields of the other sections. */
function accountTypeSection() {
  return defineFormPageSection({
    description: 'le type conditionne les champs, colonnes et synchronisations',
    fields: [
      {
        default: 'customer',
        key: 'accountType',
        layout: { span: 'full' },
        options: TYPE_OPTIONS,
        // The section title names the choice: the cards only need an accessible name.
        props: {
          'aria-label': 'Type de compte',
          columns: '2 xl:3',
          icon: 'tile',
          indicator: 'corner',
        },
        required: true,
        type: 'radio-card',
      },
      {
        help: 'Regroupe des comptes d’un même réseau pour le reporting',
        key: 'group',
        label: 'Groupe de comptes',
        options: GROUP_OPTIONS,
        placeholder: 'Aucun groupe',
        type: 'select',
      },
      {
        condition: ({ deps }) => isTestCenterType('accountType' in deps ? deps.accountType : null),
        dependencies: ['accountType'],
        help: 'Requis pour les types Centre de test',
        key: 'testCenter',
        label: 'Centre de test',
        placeholder: 'Nom du centre de test',
        required: true,
        type: 'text',
      },
      {
        condition: ({ deps }) => !isTestCenterType('accountType' in deps ? deps.accountType : null),
        dependencies: ['accountType'],
        disabled: () => true,
        help: 'Défini par la synchronisation VTest',
        key: 'managerLocation',
        label: 'VTEST Manager Location',
        options: MANAGER_LOCATION_OPTIONS,
        placeholder: '—',
        type: 'select',
      },
      {
        help: 'Active les passages surveillés dans les locaux du compte',
        key: 'canPerformOnSite',
        label: 'Peut faire passer des tests sur site',
        type: 'checkbox',
      },
      {
        help: 'Dossiers CPF suivis automatiquement',
        key: 'edofSync',
        label: 'Synchronisation EDOF',
        type: 'checkbox',
      },
    ],
    key: 'type',
    label: 'Type de compte',
  })
}

function identitySection() {
  return defineFormPageSection({
    description: 'nom affiché, entité légale et identifiants officiels',
    fields: [
      {
        key: 'name',
        label: 'Nom du compte',
        placeholder: 'Nom affiché dans l’application',
        required: true,
        type: 'text',
      },
      {
        key: 'legalEntity',
        label: 'Entité légale',
        placeholder: 'Raison sociale des contrats et factures',
        required: true,
        type: 'text',
      },
      {
        key: 'vat',
        label: 'Numéro de TVA',
        placeholder: 'FR00 000 000 000',
        props: { mono: true },
        type: 'text',
      },
      {
        key: 'siren',
        label: 'N° d’enregistrement (SIREN)',
        placeholder: '000 000 000',
        props: { mono: true },
        type: 'text',
      },
      {
        help: 'PNG ou SVG, fond transparent recommandé',
        key: 'logo',
        label: 'Logo',
        layout: { span: 'full' },
        props: { accept: 'image/png,image/svg+xml', dropzoneLabel: 'Déposer une image' },
        type: 'file',
      },
    ],
    key: 'identity',
    label: 'Identité',
  })
}

function contactsSection(contacts: readonly Contact[]) {
  return defineFormPageSection({
    description: 'référents obligatoires dès qu’un contrat est actif',
    fields: [
      {
        key: 'businessManagerId',
        label: 'Business Manager',
        options: contactOptions(contacts),
        placeholder: 'Rechercher un contact…',
        required: true,
        type: 'select',
      },
      {
        key: 'legalRepresentativeId',
        label: 'Représentant légal',
        options: contactOptions(contacts),
        placeholder: 'Rechercher un contact…',
        required: true,
        type: 'select',
      },
      {
        key: 'billingContactId',
        label: 'Contact de facturation',
        options: contactOptions(contacts),
        placeholder: 'Rechercher un contact…',
        required: true,
        type: 'select',
      },
      {
        help: 'Un contact sans compte utilisateur pourra être invité depuis l’onglet Accès & contacts.',
        key: 'generalContacts',
        label: 'Autres contacts',
        layout: { span: 'full' },
        options: contactOptions(contacts),
        placeholder: 'Ajouter un contact',
        props: { multiple: true },
        type: 'select',
      },
    ],
    key: 'contacts',
    label: 'Contacts',
    layout: { columns: 3, fieldSpan: '3 md:1' },
  })
}

function addressSection() {
  return defineFormPageSection({
    description: 'siège légal utilisé sur les contrats et factures',
    fields: [
      {
        key: 'address',
        label: 'Adresse',
        layout: { span: 'full' },
        placeholder: 'Numéro et voie',
        required: true,
        type: 'text',
      },
      {
        key: 'address2',
        label: 'Complément',
        layout: { span: 'full' },
        placeholder: 'Bâtiment, étage…',
        type: 'text',
      },
      { key: 'zipCode', label: 'Code postal', required: true, type: 'text' },
      { key: 'city', label: 'Ville', required: true, type: 'text' },
      {
        key: 'country',
        label: 'Pays',
        options: COUNTRIES,
        required: true,
        type: 'select',
      },
    ],
    key: 'address',
    label: 'Adresse',
  })
}

/** Nothing to do here at creation: the currency has a default and the rest comes later. */
function billingSection(params: { optional: boolean }) {
  return defineFormPageSection({
    description: 'devise, prélèvement et identifiants externes',
    fields: [
      {
        default: 'EUR',
        key: 'preferredCurrency',
        label: 'Devise préférée',
        options: CURRENCIES,
        required: true,
        type: 'select',
      },
      {
        help: 'Les factures sont prélevées à échéance',
        key: 'debit',
        label: 'Prélèvement automatique',
        type: 'checkbox',
      },
      {
        help: 'Modifiable à la main si besoin',
        key: 'erpId',
        label: 'ERP ID (Evoliz)',
        placeholder: 'Rempli par la synchronisation',
        props: { icon: 'i-lucide-repeat', mono: true },
        type: 'text',
      },
      {
        // The type is chosen in another section: a page is one form, so the rule reads it.
        dependencies: ['accountType'],
        help: 'Requis pour les centres de test, synchronisés avec VTest',
        key: 'vtestId',
        label: 'VTEST ID',
        props: { icon: 'i-lucide-target', mono: true },
        required: ({ deps }) => isTestCenterType('accountType' in deps ? deps.accountType : null),
        type: 'text',
      },
    ],
    key: 'billing',
    label: 'Facturation & synchronisation',
    optional: params.optional,
  })
}

function documentsSection() {
  return defineFormPageSection({
    description: 'pièces légales visibles par le client',
    fields: [
      {
        key: 'kbis',
        label: 'Fichier d’enregistrement officiel (KBIS)',
        props: { accept: 'application/pdf' },
        type: 'file',
      },
      {
        key: 'qualiopi',
        label: 'Certificat Qualiopi',
        props: { accept: 'application/pdf' },
        type: 'file',
      },
    ],
    key: 'documents',
    label: 'Documents',
  })
}

/**
 * The account form: a page of sections, created from scratch or edited from `account`. An edit
 * starts on the identity, rings what changed, and warns before leaving unsaved changes.
 */
export function accountFormSchema(params: { contacts: readonly Contact[]; account?: Account }) {
  const { account, contacts } = params
  const type = accountTypeSection()
  const identity = identitySection()
  const rest = [
    contactsSection(contacts),
    addressSection(),
    billingSection({ optional: !account }),
    documentsSection(),
  ] as const
  return defineFormPageSchema({
    actions: [
      { key: 'cancel', label: 'Annuler' },
      {
        icon: 'i-lucide-check',
        key: 'submit',
        label: account ? 'Enregistrer' : 'Créer le compte',
      },
    ],
    controls: {
      confirmNavOnDirty: { message: 'Quitter sans enregistrer les modifications ?' },
      dirtyCheck: Boolean(account),
    },
    header: {
      description: account
        ? account.name
        : 'Le type conditionne les champs, colonnes et synchronisations.',
      eyebrow: 'Comptes',
      title: account ? 'Modifier le compte' : 'Nouveau compte',
    },
    modal: { size: 'lg' },
    navigation: { title: account ? 'Sections' : 'Création' },
    sections: account ? [identity, type, ...rest] : [type, identity, ...rest],
  })
}
