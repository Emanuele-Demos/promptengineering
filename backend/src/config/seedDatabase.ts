import type { Database } from 'sqlite'
import { seedData } from '../data/seed'
import { defaultCategories } from '../data/categories'
import { createTask } from '../services/taskService'
import { seedCategories } from '../services/categoryService'

export async function seedDatabase(db: Database): Promise<void> {
  await seedCategories(defaultCategories, db)

  for (const member of seedData.members) {
    await db.run(
      `INSERT INTO members (id, name, email, role, color) VALUES (?, ?, ?, ?, ?)`,
      [member.id, member.name, member.email, member.role, member.color]
    )
  }

  for (const task of seedData.tasks) {
    await createTask(task, db)
  }

  console.log(`🌱 Seed completato: ${seedData.members.length} membri, ${defaultCategories.length} categorie, ${seedData.tasks.length} task`)
}
