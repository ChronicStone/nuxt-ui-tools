export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return $fetch('http://localhost:3333/api/table/demo-employees/filter-options/departments', {
    method: 'POST',
    body,
  })
})
