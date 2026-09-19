import { defineFormSchema } from '#ui-tools/form'

export function parityFormSchema() {
  return defineFormSchema({
    actions: [
      { key: 'cancel', label: 'Annuler' },
      { key: 'submit', label: 'Enregistrer' },
    ],
    fields: [
      { key: 'identifiers', label: 'Identifiants', type: 'section' },
      {
        description: { display: 'tooltip', text: 'Format contrôlé selon le pays' },
        key: 'vat',
        label: 'Numéro de TVA',
        mask: 'AA## ### ### ###',
        mono: true,
        placeholder: 'FR00 000 000 000',
        type: 'text',
      },
      {
        key: 'siren',
        label: 'N° d’enregistrement (SIREN)',
        mask: '### ### ###',
        maskOutput: 'raw',
        mono: true,
        placeholder: '000 000 000',
        type: 'text',
      },
      {
        clearable: true,
        description: {
          display: 'modal',
          text: 'Identifiant du compte dans Evoliz. Il est rempli par la synchronisation et reste modifiable à la main si besoin.',
          title: 'ERP ID',
        },
        icon: 'i-lucide-arrow-left-right',
        key: 'erpId',
        label: 'ERP ID (Evoliz)',
        mono: true,
        placeholder: 'Rempli par la synchronisation',
        type: 'text',
      },
      { key: 'pricing', label: 'Tarification', type: 'section' },
      {
        format: { maximumFractionDigits: 2, minimumFractionDigits: 2 },
        key: 'unitPrice',
        label: 'Prix unitaire',
        min: 0,
        suffix: '€',
        type: 'number',
      },
      {
        controls: false,
        key: 'volume',
        label: 'Volume',
        min: 0,
        suffix: 'tests',
        type: 'number',
      },
      {
        controls: false,
        format: { maximumFractionDigits: 4 },
        key: 'rate',
        label: 'Taux de change',
        prefix: '1 USD =',
        suffix: 'EUR',
        type: 'number',
      },
      { key: 'notesSection', label: 'Notes', type: 'section' },
      {
        autoresize: true,
        key: 'notes',
        label: 'Note interne',
        maxlength: 500,
        maxrows: 8,
        placeholder: 'Visible uniquement par l’équipe',
        rows: 2,
        type: 'textarea',
      },
      { key: 'preferences', label: 'Préférences', type: 'section' },
      {
        key: 'language',
        label: 'Langue',
        layout: { labelPosition: 'left', labelWidth: 160 },
        options: [
          { label: 'Français', value: 'fr' },
          { label: 'English', value: 'en' },
        ],
        type: 'select',
      },
      {
        key: 'timezone',
        label: 'Fuseau horaire',
        layout: { labelPosition: 'left', labelWidth: 160 },
        options: [
          { label: 'Europe/Paris', value: 'Europe/Paris' },
          { label: 'Europe/Madrid', value: 'Europe/Madrid' },
        ],
        type: 'select',
      },
    ],
    header: {
      description: 'Masques, préfixes, formats de nombre, labels à gauche et descriptions.',
      eyebrow: 'Démo',
      title: 'Propriétés de parité',
    },
    modal: { maxWidth: 720 },
  })
}

export const parityFormInput = {
  erpId: 'EVZ-48213',
  language: 'fr',
  rate: 0.9214,
  siren: '812345678',
  unitPrice: 129,
  vat: 'FR12345678901',
  volume: 1200,
}
