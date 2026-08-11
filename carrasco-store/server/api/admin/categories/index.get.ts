export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  return db.query.categories.findMany({
    orderBy: (table, { asc }) => [asc(table.name)],
    columns: { id: true, name: true, slug: true },
  })
})
