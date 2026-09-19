import { defineFormSchema } from '#ui-tools/form'
import { isString } from '#ui-tools/shared/utils/predicate'

import type { Account } from '../data/accounts'
import { CURRENCY } from '../data/enums'
import { accountOptions } from './pickers'

const ACTIONS = [
  { key: 'cancel', label: 'Annuler' },
  { key: 'submit', label: 'Enregistrer' },
] as const

const CURRENCIES = CURRENCY.map((code) => ({ label: code, value: code }))

const PRODUCT_LINES = [
  { label: 'English General', value: 'english-general' },
  { label: 'English Professional', value: 'english-pro' },
  { label: 'Français Langue Étrangère', value: 'fle' },
]

const VERSION_TYPES = [
  { label: 'Standard', value: 'standard' },
  { label: 'Premium', value: 'premium' },
  { label: 'Éducation', value: 'education' },
]

const METADATA = [
  { label: 'Niveau CECRL', value: 'cefr' },
  { label: 'Compétences', value: 'skills' },
  { label: 'Score TOEIC', value: 'toeic-score' },
]

const CONTRACTS: Record<
  string,
  readonly { label: string; value: string; products: readonly string[] }[]
> = {}

function contractsOf(accountId: string) {
  if (!CONTRACTS[accountId]) {
    CONTRACTS[accountId] = [
      {
        label: 'CTR-2024-0142',
        products: ['english-general', 'english-pro'],
        value: `${accountId}-1`,
      },
      { label: 'CTR-2025-0031', products: ['fle'], value: `${accountId}-2` },
    ]
  }
  return CONTRACTS[accountId]
}

export function productFormSchema() {
  return defineFormSchema({
    actions: ACTIONS,
    fields: [
      {
        key: 'product',
        tabs: [
          {
            fields: [
              { key: 'productSection', label: 'Produit', type: 'section' },
              { key: 'name', label: 'Nom', required: true, type: 'text' },
              {
                key: 'line',
                label: 'Ligne de produits',
                options: PRODUCT_LINES,
                required: true,
                type: 'select',
              },
              {
                default: 'certification',
                key: 'kind',
                label: 'Type',
                options: [
                  { label: 'Certification', value: 'certification' },
                  { label: 'Évaluation', value: 'assessment' },
                  { label: 'Formation', value: 'training' },
                ],
                required: true,
                type: 'select',
              },
              { key: 'code', label: 'Code interne', props: { mono: true }, type: 'text' },
              { key: 'metadataSection', label: 'Métadonnées', type: 'section' },
              {
                key: 'metadata',
                label: 'Métadonnées associées',
                layout: { span: 'full' },
                options: METADATA,
                placeholder: 'Ajouter une métadonnée',
                props: { multiple: true },
                type: 'select',
              },
            ],
            key: 'general',
            label: 'Général',
          },
          {
            fields: [
              {
                addItemLabel: 'Nouvelle version',
                confirmDelete: false,
                fields: [
                  {
                    key: 'version',
                    label: 'Version',
                    layout: { width: 110 },
                    props: { mono: true },
                    required: true,
                    type: 'text',
                  },
                  { key: 'type', label: 'Type', options: VERSION_TYPES, type: 'select' },
                  {
                    key: 'cost',
                    label: 'Coût',
                    layout: { width: 120 },
                    props: { controls: false, min: 0, suffix: '€' },
                    type: 'number',
                  },
                  {
                    key: 'priceEur',
                    label: 'Prix EUR',
                    layout: { width: 120 },
                    props: { controls: false, min: 0, suffix: '€' },
                    type: 'number',
                  },
                  {
                    key: 'priceUsd',
                    label: 'Prix USD',
                    layout: { width: 120 },
                    props: { controls: false, min: 0, suffix: '$' },
                    type: 'number',
                  },
                ],
                help: 'Une version utilisée par un contrat ne peut pas être supprimée, seulement désactivée.',
                key: 'versions',
                layout: { span: 'full' },
                type: 'array-table',
              },
            ],
            key: 'versions',
            label: 'Versions & tarifs',
          },
          {
            fields: [
              { key: 'resultsSection', label: 'Page de résultats', type: 'section' },
              {
                default: true,
                description: 'Le candidat consulte son score et son niveau CECRL',
                key: 'resultsPage',
                label: 'Activer la page de résultats candidat',
                layout: { span: 'full' },
                type: 'checkbox',
              },
              {
                default: true,
                key: 'resultsEmail',
                label: 'Envoyer les résultats par e-mail',
                layout: { span: 'full' },
                type: 'checkbox',
              },
              {
                default: 'fr',
                key: 'resultsLanguage',
                label: 'Langue des résultats',
                options: [
                  { label: 'Français', value: 'fr' },
                  { label: 'English', value: 'en' },
                ],
                type: 'select',
              },
              {
                default: 'fc',
                key: 'reportTemplate',
                label: 'Modèles de rapport',
                options: [
                  { label: 'France Compétences', value: 'fc' },
                  { label: 'Standard', value: 'standard' },
                ],
                type: 'select',
              },
            ],
            key: 'results',
            label: 'Résultats',
          },
        ],
        type: 'tabs',
      },
    ],
    header: {
      description:
        'Un produit regroupe des versions tarifées. Les contrats référencent une version.',
      eyebrow: 'Catalogue',
      title: 'Nouveau produit',
    },
    modal: { size: 'lg' },
  })
}

export const productFormInput = {
  metadata: ['cefr', 'skills'],
  versions: [
    { cost: 24, priceEur: 58, priceUsd: 64, type: 'standard', version: 'v1.0' },
    { cost: 27, priceEur: 62, priceUsd: 68, type: 'premium', version: 'v4.2' },
  ],
}

export function productLineFormSchema() {
  return defineFormSchema({
    actions: ACTIONS,
    fields: [
      { key: 'labelSection', label: 'Libellé', type: 'section' },
      { key: 'nameFr', label: 'Français', required: true, type: 'text' },
      { key: 'nameEn', label: 'English', type: 'text' },
      { key: 'idSection', label: 'Identifiant', type: 'section' },
      {
        help: 'Utilisé dans les exports',
        key: 'code',
        label: 'Code',
        props: { mono: true },
        type: 'text',
      },
    ],
    header: { eyebrow: 'Catalogue', title: 'Nouvelle ligne de produits' },
  })
}

export function versionTypeFormSchema() {
  return defineFormSchema({
    actions: ACTIONS,
    fields: [
      { key: 'labelSection', label: 'Libellé', type: 'section' },
      { key: 'nameFr', label: 'Français', required: true, type: 'text' },
      { key: 'nameEn', label: 'English', type: 'text' },
      { key: 'pricingSection', label: 'Tarification', type: 'section' },
      {
        default: 'EUR',
        key: 'feeCurrency',
        label: 'Devise des coûts',
        options: CURRENCIES,
        type: 'select',
      },
    ],
    header: { eyebrow: 'Catalogue', title: 'Nouveau type de version' },
  })
}

export function metadataFormSchema() {
  return defineFormSchema({
    actions: ACTIONS,
    fields: [
      { key: 'metadataSection', label: 'Métadonnée', type: 'section' },
      { key: 'label', label: 'Libellé', layout: { span: 'full' }, required: true, type: 'text' },
      { key: 'levelsSection', label: 'Niveaux', type: 'section' },
      {
        addItemLabel: 'Ajouter',
        field: { placeholder: 'B1', type: 'text' },
        help: 'Glissez pour ordonner du plus bas au plus haut.',
        key: 'levels',
        preview: ({ value }) => String(value),
        props: { draggable: true, variant: 'chips' },
        type: 'array-primitive',
        unique: true,
      },
    ],
    header: {
      description: 'Une échelle de niveaux attachée aux résultats.',
      eyebrow: 'Catalogue',
      title: 'Métadonnée produit',
    },
  })
}

export const metadataFormInput = {
  label: 'Niveau CECRL',
  levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
}

export function presetFormSchema() {
  return defineFormSchema({
    actions: ACTIONS,
    fields: [
      { key: 'presetSection', label: 'Préréglage', type: 'section' },
      { key: 'label', label: 'Libellé', required: true, type: 'text' },
      {
        default: 'EUR',
        key: 'currency',
        label: 'Devise',
        options: CURRENCIES,
        required: true,
        type: 'select',
      },
      {
        key: 'lines',
        label: 'Lignes de produits',
        layout: { span: 'full' },
        options: PRODUCT_LINES,
        props: { multiple: true },
        type: 'select',
      },
      { key: 'productsSection', label: 'Produits', type: 'section' },
      {
        addItemLabel: 'Ajouter un produit',
        confirmDelete: false,
        fields: [
          {
            key: 'product',
            label: 'Produit',
            options: PRODUCT_LINES,
            required: true,
            type: 'select',
          },
          {
            key: 'version',
            label: 'Version',
            layout: { width: 130 },
            options: [
              { label: 'v4.2', value: 'v4.2' },
              { label: 'v4.1', value: 'v4.1' },
            ],
            props: { mono: true },
            type: 'select',
          },
          {
            key: 'cost',
            label: 'Coût',
            layout: { width: 130 },
            props: { controls: false, min: 0, suffix: '€' },
            type: 'number',
          },
          {
            key: 'price',
            label: 'Prix',
            layout: { width: 130 },
            props: { controls: false, min: 0, suffix: '€' },
            type: 'number',
          },
        ],
        key: 'products',
        type: 'array-table',
      },
    ],
    header: {
      description: 'Un jeu de produits et de tarifs importable dans un contrat en un clic.',
      eyebrow: 'Catalogue',
      title: 'Nouveau préréglage',
    },
    modal: { size: 'xl' },
  })
}

export const presetFormInput = {
  lines: ['english-general'],
  products: [
    { cost: 26, price: 60, product: 'english-general', version: 'v4.2' },
    { cost: 28, price: 63, product: 'english-pro', version: 'v4.2' },
  ],
}

export function consumptionFormSchema(accounts: readonly Account[]) {
  return defineFormSchema({
    actions: ACTIONS,
    fields: [
      { key: 'linkSection', label: 'Rattachement', type: 'section' },
      {
        key: 'account',
        label: 'Compte',
        options: accountOptions(accounts),
        placeholder: 'Rechercher un compte',
        required: true,
        type: 'select',
      },
      {
        dependencies: ['account'],
        help: 'Contrats actifs du compte',
        key: 'contract',
        label: 'Contrat',
        onDependencyChange: ({ api }) => api.value.set(null),
        options: ({ deps }) => (isString(deps.account) ? contractsOf(deps.account) : []),
        props: { mono: true },
        required: true,
        type: 'select',
      },
      {
        dependencies: ['account', 'contract'],
        help: 'Produits actifs du contrat',
        key: 'product',
        label: 'Produit',
        layout: { span: 'full' },
        onDependencyChange: ({ api }) => api.value.set(null),
        options: ({ deps }) => {
          if (!isString(deps.account) || !isString(deps.contract)) {
            return []
          }
          const contract = contractsOf(deps.account).find((item) => item.value === deps.contract)
          return PRODUCT_LINES.filter((line) => contract?.products.includes(line.value))
        },
        required: true,
        type: 'select',
      },
      { key: 'periodSection', label: 'Période et volume', type: 'section' },
      {
        default: '2026',
        key: 'year',
        label: 'Année',
        options: [
          { label: '2025', value: '2025' },
          { label: '2026', value: '2026' },
        ],
        required: true,
        type: 'select',
      },
      {
        default: '09',
        key: 'month',
        label: 'Mois',
        options: [
          { label: 'Juillet', value: '07' },
          { label: 'Août', value: '08' },
          { label: 'Septembre', value: '09' },
          { label: 'Octobre', value: '10' },
        ],
        required: true,
        type: 'select',
      },
      {
        key: 'units',
        label: 'Unités',
        placeholder: '0',
        props: { controls: false, min: 0 },
        required: true,
        type: 'number',
      },
      {
        help: 'Créez le taux du mois s’il manque',
        key: 'rate',
        label: 'Taux de change',
        options: [{ label: 'Sept. 2026 · 0,9180', value: '2026-09' }],
        type: 'select',
      },
      { key: 'billingSection', label: 'Facturation', type: 'section' },
      {
        description: 'À cocher si la période est couverte par une facture émise',
        key: 'billed',
        label: 'Déjà facturée',
        layout: { span: 'full' },
        type: 'checkbox',
      },
    ],
    header: {
      description:
        'Le contrat puis le produit se filtrent en cascade. Le taux de change du mois est appliqué automatiquement.',
      eyebrow: 'Consommation',
      title: 'Saisir une consommation',
    },
  })
}

export function invoiceFormSchema(accounts: readonly Account[]) {
  return defineFormSchema({
    actions: ACTIONS,
    fields: [
      { key: 'linkSection', label: 'Rattachement', type: 'section' },
      {
        key: 'account',
        label: 'Compte',
        options: accountOptions(accounts),
        placeholder: 'Rechercher un compte',
        required: true,
        type: 'select',
      },
      {
        dependencies: ['account'],
        key: 'contract',
        label: 'Contrat',
        onDependencyChange: ({ api }) => api.value.set(null),
        options: ({ deps }) => (isString(deps.account) ? contractsOf(deps.account) : []),
        props: { mono: true },
        required: true,
        type: 'select',
      },
      { key: 'periodSection', label: 'Période facturée', type: 'section' },
      { key: 'from', label: 'Du', required: true, type: 'month' },
      { key: 'to', label: 'Au', required: true, type: 'month' },
      {
        content: '3 mois · 1 240 unités non facturées seront rattachées à cette facture.',
        key: 'periodNote',
        props: { color: 'primary', icon: 'i-lucide-bell' },
        type: 'info',
      },
      { key: 'invoiceSection', label: 'Facture', type: 'section' },
      {
        key: 'number',
        label: 'Numéro',
        placeholder: 'F-2026-09-0148',
        props: { mono: true },
        required: true,
        type: 'text',
      },
      {
        default: 'sent',
        key: 'status',
        label: 'Statut',
        options: [
          { label: 'Brouillon', value: 'draft' },
          { label: 'Envoyée', value: 'sent' },
          { label: 'Payée', value: 'paid' },
          { label: 'En retard', value: 'late' },
        ],
        required: true,
        type: 'select',
      },
      { key: 'issuedAt', label: 'Émise le', required: true, type: 'date' },
      { key: 'dueAt', label: 'Échéance', type: 'date' },
      {
        key: 'amount',
        label: 'Montant HT',
        props: {
          controls: false,
          format: { maximumFractionDigits: 2, minimumFractionDigits: 2 },
          min: 0,
          suffix: '€',
        },
        required: true,
        type: 'number',
      },
      {
        key: 'rate',
        label: 'Taux de change',
        options: [{ label: 'Sept. 2026 · 0,9180', value: '2026-09' }],
        type: 'select',
      },
      { key: 'documentSection', label: 'Document', type: 'section' },
      {
        key: 'pdf',
        label: 'PDF de la facture',
        layout: { span: 'full' },
        props: { accept: 'application/pdf', dropzoneLabel: 'Déposer le PDF ou parcourir' },
        type: 'file',
      },
    ],
    header: {
      description:
        'Le numéro, les dates et le montant viennent d’Evoliz quand la synchronisation est active. Le statut et le PDF restent modifiables ici.',
      eyebrow: 'Facture',
      title: 'Nouvelle facture',
    },
    modal: { size: 'lg' },
  })
}

export function billedBulkFormSchema() {
  return defineFormSchema({
    actions: [
      { key: 'cancel', label: 'Annuler' },
      { key: 'submit', label: 'Appliquer' },
    ],
    fields: [
      {
        default: 'billed',
        key: 'status',
        layout: { span: 'full' },
        options: [
          { label: 'Facturées', value: 'billed' },
          { label: 'Non facturées', value: 'unbilled' },
        ],
        props: { orientation: 'horizontal', variant: 'card' },
        type: 'radio',
      },
      {
        content:
          'Les lignes déjà rattachées à une facture émise ne peuvent pas repasser en « non facturée ».',
        key: 'note',
        props: { color: 'primary', icon: 'i-lucide-bell' },
        type: 'info',
      },
    ],
    header: {
      description: '3 lignes sélectionnées seront mises à jour. Les montants ne changent pas.',
      title: 'Marquer la facturation',
    },
  })
}

export function confirmFormSchema() {
  return defineFormSchema({
    actions: [
      { key: 'cancel', label: 'Annuler' },
      { color: 'error', key: 'submit', label: 'Résilier le contrat' },
    ],
    fields: [
      {
        content: 'Les consommations déjà saisies restent facturables.',
        key: 'note',
        props: { color: 'primary', icon: 'i-lucide-bell' },
        type: 'info',
      },
    ],
    header: {
      description: 'Le contrat CTR-2024-0142 passera en résilié à la date choisie.',
      title: 'Résilier le contrat',
    },
  })
}
