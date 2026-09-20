import { defineFormSchema } from '#ui-tools/form'
import type { FormValue } from '#ui-tools/form'
import { isString } from '#ui-tools/shared/utils/predicate'

import type { Contact } from '../data/accounts'
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

export function accountFormSchema(contacts: readonly Contact[], mode: 'new' | 'edit' = 'edit') {
  const isNew = mode === 'new'
  return defineFormSchema({
    actions: [
      { key: 'cancel', label: 'Annuler' },
      {
        icon: 'i-lucide-check',
        key: 'submit',
        label: isNew ? 'Créer le compte' : 'Enregistrer',
      },
    ],
    fields: [
      { key: 'typeSection', label: 'Type de compte', type: 'section' },
      {
        default: 'customer',
        key: 'accountType',
        label: 'Type de compte',
        layout: { span: 'full' },
        options: TYPE_OPTIONS,
        props: { orientation: 'horizontal' },
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
      { key: 'identitySection', label: 'Identité', type: 'section' },
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
      { key: 'contactsSection', label: 'Contacts', type: 'section' },
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
      { key: 'addressSection', label: 'Adresse', type: 'section' },
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
      {
        key: 'billingSection',
        label: 'Facturation & synchronisation',
        type: 'section',
      },
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
        help: 'Requis dès qu’un contrat est actif',
        key: 'vtestId',
        label: 'VTEST ID',
        props: { icon: 'i-lucide-target', mono: true },
        type: 'text',
      },
      { key: 'docsSection', label: 'Documents', type: 'section' },
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
    header: {
      description: isNew
        ? 'Le type conditionne les champs, colonnes et synchronisations.'
        : 'Identité, contacts, adresse, facturation et documents légaux.',
      eyebrow: 'Comptes',
      title: isNew ? 'Nouveau compte' : 'Modifier le compte',
    },
    modal: { size: 'lg' },
  })
}
