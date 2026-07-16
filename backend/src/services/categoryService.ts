import { randomUUID } from 'crypto'
import type { Database } from 'sqlite'
import type { Category } from '../types'
import { getDatabase } from '../config/database'
import { sanitizeCategoryName, validateCategoryInput } from '../utils/categoryValidation'

interface CategoryRow {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

interface CategoryWithCountRow extends CategoryRow {
  taskCount: number
}

function mapCategory(row: CategoryRow, taskCount?: number): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(taskCount !== undefined ? { taskCount } : {}),
  }
}

export async function getAllCategories(db?: Database): Promise<Category[]> {
  const connection = db ?? (await getDatabase())
  const rows = (await connection.all(`
    SELECT c.id, c.name, c.color, c.createdAt, c.updatedAt,
           COUNT(t.id) AS taskCount
    FROM categories c
    LEFT JOIN tasks t ON t.categoryId = c.id
    GROUP BY c.id
    ORDER BY c.name COLLATE NOCASE ASC
  `)) as CategoryWithCountRow[]

  return rows.map((row) => mapCategory(row, row.taskCount))
}

export async function getCategoryById(
  id: string,
  db?: Database
): Promise<Category | undefined> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<CategoryWithCountRow>(
    `SELECT c.id, c.name, c.color, c.createdAt, c.updatedAt,
            COUNT(t.id) AS taskCount
     FROM categories c
     LEFT JOIN tasks t ON t.categoryId = c.id
     WHERE c.id = ?
     GROUP BY c.id`,
    [id]
  )
  return row ? mapCategory(row, row.taskCount) : undefined
}

export async function createCategory(
  input: { name: string; color: string },
  db?: Database
): Promise<Category> {
  const connection = db ?? (await getDatabase())
  const { name, color } = validateCategoryInput(input.name, input.color)
  const now = new Date().toISOString()
  const id = randomUUID()

  await connection.run(
    `INSERT INTO categories (id, name, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
    [id, name, color, now, now]
  )

  return { id, name, color, createdAt: now, updatedAt: now, taskCount: 0 }
}

export async function updateCategory(
  id: string,
  input: { name: string; color: string },
  db?: Database
): Promise<Category> {
  const connection = db ?? (await getDatabase())
  const existing = await getCategoryById(id, connection)
  if (!existing) throw new Error('Categoria non trovata')

  const { name, color } = validateCategoryInput(input.name, input.color)
  const now = new Date().toISOString()

  await connection.run(
    `UPDATE categories SET name = ?, color = ?, updatedAt = ? WHERE id = ?`,
    [name, color, now, id]
  )

  const updated = await getCategoryById(id, connection)
  if (!updated) throw new Error('Categoria non trovata')
  return updated
}

export async function deleteCategory(id: string, db?: Database): Promise<void> {
  const connection = db ?? (await getDatabase())
  const existing = await getCategoryById(id, connection)
  if (!existing) throw new Error('Categoria non trovata')

  await connection.run('BEGIN')
  try {
    await connection.run(`UPDATE tasks SET categoryId = NULL WHERE categoryId = ?`, [id])
    await connection.run(`DELETE FROM categories WHERE id = ?`, [id])
    await connection.run('COMMIT')
  } catch (error) {
    await connection.run('ROLLBACK')
    throw error
  }
}

export async function seedCategories(
  categories: Array<{ id: string; name: string; color: string }>,
  db: Database
): Promise<void> {
  const now = new Date().toISOString()
  for (const category of categories) {
    const name = sanitizeCategoryName(category.name)
    await db.run(
      `INSERT OR IGNORE INTO categories (id, name, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
      [category.id, name, category.color.toUpperCase(), now, now]
    )
  }
}

export async function categoryExists(id: string, db?: Database): Promise<boolean> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<{ id: string }>(
    `SELECT id FROM categories WHERE id = ?`,
    [id]
  )
  return !!row
}
