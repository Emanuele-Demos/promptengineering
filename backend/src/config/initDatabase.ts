import fs from 'fs'
import path from 'path'
import { getDatabase } from './database'
import { seedDatabase } from './seedDatabase'

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase()

  const schemaPath = path.join(__dirname, '../../database/schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf-8')
  await db.exec(schema)

  const row = await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM members')

  if ((row?.count ?? 0) === 0) {
    await seedDatabase(db)
  }

  console.log('✅ Database SQLite inizializzato')
}
