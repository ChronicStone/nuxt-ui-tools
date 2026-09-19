import { defineFormSchema } from '#ui-tools/form'
import { isNumber } from '#ui-tools/shared/utils/predicate'

const LEVELS = [
  { label: 'A1 · Découverte', value: 'A1' },
  { label: 'A2 · Intermédiaire', value: 'A2' },
  { label: 'B1 · Seuil', value: 'B1' },
  { label: 'B2 · Avancé', value: 'B2' },
  { label: 'C1 · Autonome', value: 'C1' },
  { label: 'C2 · Maîtrise', value: 'C2' },
]

const CURRENCIES = [
  { label: 'EUR', value: 'EUR' },
  { label: 'USD', value: 'USD' },
  { label: 'CHF', value: 'CHF' },
]

export function arraysFormSchema() {
  return defineFormSchema({
    actions: [
      { key: 'cancel', label: 'Annuler' },
      { key: 'submit', label: 'Enregistrer' },
    ],
    fields: [
      { key: 'listsSection', label: 'Listes de valeurs', type: 'section' },
      {
        addItemLabel: 'Ajouter un niveau',
        field: { options: LEVELS, placeholder: 'Choisir un niveau', type: 'select' },
        help: 'Chaque niveau ne peut apparaître qu’une fois.',
        key: 'levels',
        label: 'Niveaux évalués',
        preview: ({ option, value }) => String(option?.label ?? value),
        type: 'array-primitive',
        unique: true,
      },
      {
        addItemLabel: 'Ajouter une adresse',
        field: { inputType: 'email', placeholder: 'prenom.nom@exassess.com', type: 'text' },
        key: 'recipients',
        label: 'Destinataires des rapports',
        required: true,
        type: 'array-primitive',
        unique: true,
      },
      { key: 'targetsSection', label: 'Objectifs annuels', type: 'section' },
      {
        accordion: true,
        addItemLabel: 'Ajouter un objectif',
        confirmDelete: false,
        defaultExpanded: 'first',
        fields: [
          { key: 'label', label: 'Libellé', required: true, type: 'text' },
          { key: 'volume', label: 'Volume', layout: { span: 6 }, min: 0, type: 'number' },
          {
            key: 'currency',
            label: 'Devise',
            layout: { span: 6 },
            options: CURRENCIES,
            type: 'select',
          },
          { key: 'start', label: 'Début', layout: { span: 6 }, type: 'date' },
          { key: 'end', label: 'Fin', layout: { span: 6 }, type: 'date' },
        ],
        headerTemplate: (item, index) => String(item.label ?? '') || `Objectif ${index + 1}`,
        key: 'targets',
        label: 'Objectifs',
        layout: { columns: 12 },
        summaryTemplate: (item) =>
          isNumber(item.volume) ? `${item.volume} ${String(item.currency ?? '')}` : '',
        type: 'array-collapse',
      },
      { key: 'translationsSection', label: 'Traductions', type: 'section' },
      {
        addItemLabel: 'Ajouter une langue',
        confirmDelete: false,
        fields: [
          { key: 'locale', label: 'Langue', layout: { span: 4 }, type: 'text' },
          { key: 'title', label: 'Titre', layout: { span: 8 }, type: 'text' },
          {
            key: 'description',
            label: 'Description',
            layout: { span: 'full' },
            type: 'textarea',
          },
        ],
        headerTemplate: (item, index) =>
          String(item.locale ?? '').toUpperCase() || `Langue ${index + 1}`,
        key: 'translations',
        label: 'Contenus',
        layout: { columns: 12 },
        type: 'array-tabs',
      },
    ],
    header: {
      description: 'Listes primitives, blocs repliables et onglets sur le même moteur.',
      eyebrow: 'Démo',
      title: 'Tableaux et listes',
    },
    modal: { maxWidth: 760 },
  })
}

export const arraysFormInput = {
  levels: ['A2', 'B1'],
  recipients: ['direction@exassess.com'],
  targets: [
    {
      currency: 'EUR',
      end: '2026-12-31',
      label: 'Volume France',
      start: '2026-01-01',
      volume: 1200,
    },
    {
      currency: 'CHF',
      end: '2026-12-31',
      label: 'Volume Suisse',
      start: '2026-01-01',
      volume: 300,
    },
  ],
  translations: [
    { description: 'Certification linguistique.', locale: 'fr', title: 'Certification' },
    { description: 'Language certification.', locale: 'en', title: 'Certification' },
  ],
}
