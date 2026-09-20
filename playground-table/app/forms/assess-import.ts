import { defineFormSchema } from '#ui-tools/form'

const TEST_CENTERS = [
  { label: 'Lyon Part-Dieu', value: 'lyon-part-dieu' },
  { label: 'Paris Bastille', value: 'paris-bastille' },
  { label: 'Grenoble Europole', value: 'grenoble-europole' },
]

const EXPECTED_COLUMNS = [
  'Test center ID',
  'Secure code',
  'Exam name',
  'Last name',
  'First name',
  'Email',
  'Status',
  'Proctoring type',
  'Proctoring status',
  'Completed at',
  'Duration',
  'Batch',
  'Country',
  'Listening',
  'Reading',
  'Writing',
  'Speaking',
  'Overall',
  'Affiliation · Groupe',
  'Affiliation · Site',
]

export function assessImportFormSchema() {
  return defineFormSchema({
    actions: [
      { key: 'cancel', label: 'Annuler' },
      { icon: 'i-lucide-arrow-right', key: 'submit', label: 'Analyser le fichier' },
    ],
    fields: [
      { key: 'fileSection', label: 'Fichier d’import', type: 'section' },
      {
        help: 'Préremplit la colonne Test center ID si elle manque',
        key: 'testCenter',
        label: 'Centre de test',
        options: TEST_CENTERS,
        required: true,
        type: 'select',
      },
      {
        help: 'Masque nom et e-mail dans les listes',
        key: 'anonymize',
        label: 'Anonymiser les candidats',
        type: 'checkbox',
      },
      {
        key: 'file',
        label: 'Fichier .xlsx',
        layout: { span: 'full' },
        props: {
          accept:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
          dropzoneDescription: 'Une feuille, en-têtes en première ligne · 5 000 lignes max',
          dropzoneLabel: 'Déposer le fichier .xlsx',
        },
        required: true,
        type: 'file',
      },
      { key: 'columnsSection', label: 'Colonnes attendues', type: 'section' },
      {
        content: EXPECTED_COLUMNS.join(' · '),
        key: 'expectedColumns',
        layout: { span: 'full' },
        props: { icon: false },
        type: 'info',
      },
    ],
    header: {
      description: 'Fichier Excel d’un centre de test → passages, scores CECRL, certificats.',
      eyebrow: 'Assessments',
      title: 'Importer des assessments',
    },
    modal: { size: 'lg' },
  })
}
