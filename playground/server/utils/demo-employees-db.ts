import Database from 'better-sqlite3'
import { defineRelationsPart } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createQueryEngine } from 'drizzle-resource'

export const companies = sqliteTable('companies', {
  country: text('country').notNull(),
  createdAt: text('created_at').notNull(),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
})

export const departments = sqliteTable('departments', {
  budget: integer('budget'),
  companyId: text('company_id')
    .notNull()
    .references(() => companies.id),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
})

export const employees = sqliteTable('employees', {
  departmentId: text('department_id')
    .notNull()
    .references(() => departments.id),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  hiredAt: text('hired_at'),
  id: text('id').primaryKey(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull(),
  salary: integer('salary'),
})

export const skills = sqliteTable('skills', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
})

export const employeeSkills = sqliteTable('employee_skills', {
  employeeId: text('employee_id')
    .notNull()
    .references(() => employees.id),
  skillId: text('skill_id')
    .notNull()
    .references(() => skills.id),
})

export const schema = {
  companies,
  departments,
  employeeSkills,
  employees,
  skills,
}

export const relations = defineRelationsPart(
  schema,
  ({
    companies: companiesTable,
    departments: departmentsTable,
    employees: employeesTable,
    employeeSkills: employeeSkillsTable,
    skills: skillsTable,
    many,
    one,
  }) => ({
    companies: {
      departments: many.departments({
        from: companiesTable.id,
        to: departmentsTable.companyId,
      }),
    },
    departments: {
      company: one.companies({
        from: departmentsTable.companyId,
        optional: false,
        to: companiesTable.id,
      }),
      employees: many.employees({
        from: departmentsTable.id,
        to: employeesTable.departmentId,
      }),
    },
    employeeSkills: {
      employee: one.employees({
        from: employeeSkillsTable.employeeId,
        optional: false,
        to: employeesTable.id,
      }),
      skill: one.skills({
        from: employeeSkillsTable.skillId,
        optional: false,
        to: skillsTable.id,
      }),
    },
    employees: {
      department: one.departments({
        from: employeesTable.departmentId,
        optional: false,
        to: departmentsTable.id,
      }),
      employeeSkills: many.employeeSkills({
        from: employeesTable.id,
        to: employeeSkillsTable.employeeId,
      }),
    },
    skills: {
      employeeSkills: many.employeeSkills({
        from: skillsTable.id,
        to: employeeSkillsTable.skillId,
      }),
    },
  }),
)

const sqlite = new Database(':memory:')
sqlite.pragma('foreign_keys = ON')
sqlite.exec(`
  CREATE TABLE companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE departments (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    budget INTEGER
  );
  CREATE TABLE employees (
    id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL REFERENCES departments(id),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    salary INTEGER,
    is_active INTEGER NOT NULL,
    hired_at TEXT
  );
  CREATE TABLE skills (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL
  );
  CREATE TABLE employee_skills (
    employee_id TEXT NOT NULL REFERENCES employees(id),
    skill_id TEXT NOT NULL REFERENCES skills(id),
    PRIMARY KEY (employee_id, skill_id)
  );
`)

seedDemoEmployees(sqlite)

export const db = drizzle({ client: sqlite, relations })
const engine = createQueryEngine({ db, relations, schema })

export const employeesResource = engine.defineResource('employees', {
  query: {
    defaults: {
      pagination: { mode: 'offset', pageIndex: 0, pageSize: 20 },
    },
    facets: {
      allowed: [
        'department.company.country',
        'department.company.name',
        'department.name',
        'employeeSkills.skill.label',
        'isActive',
      ],
    },
    pagination: { modes: ['offset', 'cursor'] },
    search: {
      allowed: ['fullName', 'email', 'department.company.name', 'employeeSkills.skill.label'],
      defaults: ['fullName', 'email'],
    },
    sort: {
      defaults: [{ dir: 'desc', key: 'hiredAt' }],
    },
  },
  relations: {
    department: {
      with: {
        company: true,
      },
    },
    employeeSkills: {
      with: {
        skill: true,
      },
    },
  },
})

function seedDemoEmployees(client: Database.Database) {
  const companySeed = [
    ['company-01', 'Acme Systems', 'France'],
    ['company-02', 'Northstar Labs', 'Germany'],
    ['company-03', 'Kumo Works', 'Japan'],
    ['company-04', 'Rivet Cloud', 'United Kingdom'],
    ['company-05', 'Vela Commerce', 'United States'],
    ['company-06', 'Atlas Studio', 'France'],
    ['company-07', 'Helio Security', 'Germany'],
    ['company-08', 'Monarch Data', 'United States'],
  ]
  const departmentNames = [
    'Engineering',
    'Platform',
    'Operations',
    'Finance',
    'Product',
    'Design',
    'Security',
    'Data',
  ]
  const skillLabels = [
    'TypeScript',
    'Go',
    'Kubernetes',
    'Security',
    'Distributed Systems',
    'Rust',
    'Python',
    'GraphQL',
    'PostgreSQL',
    'Machine Learning',
    'Design Systems',
    'Observability',
    'Terraform',
    'Incident Response',
    'Product Strategy',
    'UX Research',
  ]
  const firstNames = [
    'Amélie',
    'Jon',
    'Mina',
    'Taro',
    'Léa',
    'Samira',
    'Noah',
    'Aya',
    'Theo',
    'Nora',
    'Elias',
    'Sofia',
    'Hugo',
    'Maya',
    'Kenji',
    'Iris',
  ]
  const lastNames = [
    'Martin',
    'Bell',
    'Okafor',
    'Sato',
    'Bernard',
    'Khan',
    'Tremblay',
    'Mori',
    'Dubois',
    'Fischer',
    'Wilson',
    'Costa',
    'Leroy',
    'Patel',
    'Ito',
    'Morgan',
  ]

  const insertCompany = client.prepare(
    'INSERT INTO companies (id, name, country, created_at) VALUES (?, ?, ?, ?)',
  )
  const insertDepartment = client.prepare(
    'INSERT INTO departments (id, company_id, name, budget) VALUES (?, ?, ?, ?)',
  )
  const insertSkill = client.prepare('INSERT INTO skills (id, label) VALUES (?, ?)')
  const insertEmployee = client.prepare(
    'INSERT INTO employees (id, department_id, full_name, email, salary, is_active, hired_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
  const insertEmployeeSkill = client.prepare(
    'INSERT INTO employee_skills (employee_id, skill_id) VALUES (?, ?)',
  )

  for (const [index, company] of companySeed.entries()) {
    const id = company[0]
    const name = company[1]
    const country = company[2]
    if (!id || !name || !country) {
      continue
    }

    insertCompany.run(id, name, country, `2024-${String((index % 9) + 1).padStart(2, '0')}-01`)
    insertDepartment.run(
      `department-${String(index + 1).padStart(2, '0')}`,
      id,
      departmentNames[index] ?? 'Engineering',
      700_000 + index * 125_000,
    )
  }

  for (const [index, label] of skillLabels.entries()) {
    insertSkill.run(`skill-${String(index + 1).padStart(2, '0')}`, label)
  }

  for (let index = 0; index < 128; index++) {
    const firstName = firstNames[index % firstNames.length] ?? 'Alex'
    const lastName = lastNames[(index * 5) % lastNames.length] ?? 'Taylor'
    const employeeId = `employee-${String(index + 1).padStart(3, '0')}`
    const departmentIndex = index % departmentNames.length
    const hiredYear = 2019 + (index % 7)
    const hiredMonth = ((index * 3) % 12) + 1
    const hiredDay = ((index * 7) % 27) + 1
    const fullName = `${firstName} ${lastName}`
    const emailName = `${firstName}.${lastName}`
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036F]/gu, '')
      .replaceAll(/[^a-zA-Z.]/gu, '')
      .toLowerCase()

    insertEmployee.run(
      employeeId,
      `department-${String(departmentIndex + 1).padStart(2, '0')}`,
      fullName,
      `${emailName}.${index + 1}@example.com`,
      62_000 + ((index * 7300) % 148_000),
      index % 5 === 0 ? 0 : 1,
      `${hiredYear}-${String(hiredMonth).padStart(2, '0')}-${String(hiredDay).padStart(2, '0')}`,
    )

    const skillIndexes = [index % skillLabels.length, (index * 3 + 5) % skillLabels.length]
    if (index % 3 === 0) {
      skillIndexes.push((index * 7 + 2) % skillLabels.length)
    }

    for (const skillIndex of new Set(skillIndexes)) {
      insertEmployeeSkill.run(employeeId, `skill-${String(skillIndex + 1).padStart(2, '0')}`)
    }
  }
}
