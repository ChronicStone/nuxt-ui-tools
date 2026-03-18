export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return $fetch('http://localhost:3333/api/table/demo-employees/query', {
    method: 'POST',
    body,
  }).then((res) => {
    return res
  })
})
