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
        placeholder: 'FR00 000 000 000',
        props: { mask: 'AA## ### ### ###', mono: true },
        type: 'text',
      },
      {
        key: 'siren',
        label: 'N° d’enregistrement (SIREN)',
        placeholder: '000 000 000',
        props: { mask: '### ### ###', maskOutput: 'raw', mono: true },
        type: 'text',
      },
      {
        description: {
          display: 'modal',
          text: 'Identifiant du compte dans Evoliz. Il est rempli par la synchronisation et reste modifiable à la main si besoin.',
          title: 'ERP ID',
        },
        key: 'erpId',
        label: 'ERP ID (Evoliz)',
        placeholder: 'Rempli par la synchronisation',
        props: { clearable: true, icon: 'i-lucide-arrow-left-right', mono: true },
        type: 'text',
      },
      { key: 'pricing', label: 'Tarification', type: 'section' },
      {
        key: 'unitPrice',
        label: 'Prix unitaire',
        props: {
          format: { maximumFractionDigits: 2, minimumFractionDigits: 2 },
          min: 0,
          suffix: '€',
        },
        type: 'number',
      },
      {
        key: 'volume',
        label: 'Volume',
        props: { controls: false, min: 0, suffix: 'tests' },
        type: 'number',
      },
      {
        key: 'rate',
        label: 'Taux de change',
        props: {
          controls: false,
          format: { maximumFractionDigits: 4 },
          prefix: '1 USD =',
          suffix: 'EUR',
        },
        type: 'number',
      },
      { key: 'notesSection', label: 'Notes', type: 'section' },
      {
        key: 'notes',
        label: 'Note interne',
        placeholder: 'Visible uniquement par l’équipe',
        props: { autoresize: true, maxlength: 500, maxrows: 8, rows: 2 },
        type: 'textarea',
      },
      { key: 'productSection', label: 'Produit', type: 'section' },
      {
        key: 'product',
        tabs: [
          {
            fields: [
              { key: 'productName', label: 'Nom du produit', required: true, type: 'text' },
              {
                key: 'productLine',
                label: 'Gamme',
                options: [
                  { label: 'TOEIC', value: 'toeic' },
                  { label: 'Bright', value: 'bright' },
                ],
                type: 'select',
              },
              {
                key: 'productDescription',
                label: 'Description',
                layout: { span: 'full' },
                props: { rows: 2 },
                type: 'textarea',
              },
            ],
            key: 'general',
            label: 'Général',
          },
          {
            fields: [
              {
                key: 'listPrice',
                label: 'Prix catalogue',
                props: { suffix: '€' },
                required: true,
                type: 'number',
              },
              { key: 'validity', label: 'Validité (mois)', type: 'number' },
            ],
            key: 'pricing',
            label: 'Versions & tarifs',
          },
          {
            fields: [
              { key: 'scoreMax', label: 'Score maximal', type: 'number' },
              { key: 'certificate', label: 'Certificat délivré', type: 'checkbox' },
            ],
            key: 'results',
            label: 'Résultats',
          },
        ],
        type: 'tabs',
      },
      { key: 'choicesSection', label: 'Choix', type: 'section' },
      {
        key: 'accountType',
        label: 'Type de compte',
        layout: { span: 'full' },
        options: [
          {
            description: 'Achète des tests pour ses candidats',
            icon: 'i-lucide-building-2',
            label: 'Client',
            value: 'customer',
          },
          {
            description: 'Revend ou prescrit des tests',
            icon: 'i-lucide-handshake',
            label: 'Partenaire',
            value: 'partner',
          },
          {
            description: 'Fait passer les tests sur site',
            icon: 'i-lucide-school',
            label: 'Centre de test',
            value: 'testCenter',
          },
        ],
        props: { orientation: 'horizontal' },
        type: 'radio-card',
      },
      {
        key: 'scope',
        label: 'Périmètre de l’export',
        options: [
          { description: '154 comptes', label: 'Filtres courants', value: 'filters' },
          { description: '3 comptes', label: 'Sélection', value: 'selection' },
        ],
        props: { variant: 'card' },
        type: 'radio',
      },
      {
        key: 'levels',
        label: 'Niveaux (2 max)',
        options: [
          { label: 'A1', value: 'A1' },
          { label: 'A2', value: 'A2' },
          { label: 'B1', value: 'B1' },
          { label: 'B2', value: 'B2' },
        ],
        props: { max: 2, multiple: true },
        type: 'select',
      },
      { key: 'documentsSection', label: 'Documents', type: 'section' },
      {
        key: 'logo',
        label: 'Logo',
        props: {
          accept: 'image/png,image/svg+xml',
          dropzoneDescription: 'PNG ou SVG, fond transparent recommandé',
          dropzoneLabel: 'Déposer une image ou parcourir',
          icon: 'i-lucide-image',
          variant: 'area',
        },
        type: 'file',
      },
      {
        key: 'kbis',
        label: 'Fichier d’enregistrement officiel (KBIS)',
        props: {
          accept: 'application/pdf',
          dropzoneDescription: 'PDF uniquement, 20 Mo maximum',
          dropzoneLabel: 'Déposer un PDF ou parcourir',
          variant: 'area',
        },
        type: 'file',
      },
      {
        content: 'Dernière synchronisation Evoliz il y a 3 jours, VTest il y a 12 jours.',
        key: 'syncNote',
        props: { color: 'primary', icon: 'i-lucide-bell' },
        type: 'info',
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
    modal: { size: 'lg' },
  })
}

export const parityFormInput = {
  accountType: 'customer',
  erpId: 'EVZ-48213',
  language: 'fr',
  levels: ['A2', 'B1'],
  listPrice: 129,
  productName: 'TOEIC Listening & Reading',
  rate: 0.9214,
  scope: 'filters',
  siren: '812345678',
  unitPrice: 129,
  vat: 'FR12345678901',
  volume: 1200,
}
