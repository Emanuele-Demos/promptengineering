import fs from 'fs'
import path from 'path'
import { getDatabase } from './database'
import { seedDatabase } from './seedDatabase'
import { runMigrations } from './migrateDatabase'
import { seedCategories } from '../services/categoryService'
import { defaultCategories } from '../data/categories'

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase()

  const schemaPath = path.join(__dirname, '../../database/schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf-8')
  await db.exec(schema)
  await runMigrations(db)

  const categoryRow = await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM categories')
  if ((categoryRow?.count ?? 0) === 0) {
    await seedCategories(defaultCategories, db)
  }

  const row = await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM members')

  if ((row?.count ?? 0) === 0) {
    await seedDatabase(db)
  }

  console.log('✅ Database SQLite inizializzato')
}
