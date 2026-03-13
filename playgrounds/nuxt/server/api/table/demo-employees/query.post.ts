export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  console.log('Received request with body:', body)
  return $fetch('http://localhost:3333/api/table/demo-employees/query', {
    method: 'POST',
    body,
  }).then((res) => {
    console.log('Response from API:', res)
    return res
  })
})
