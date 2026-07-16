import type { Database } from 'sqlite'
import { seedMembers, seedTasks } from '../data/seed'
import { defaultCategories } from '../data/categories'
import { createTask } from '../services/taskService'
import { seedCategories } from '../services/categoryService'
import { hashDefaultPassword } from '../services/authService'

export async function seedDatabase(db: Database): Promise<void> {
  await seedCategories(defaultCategories, db)

  const hashedPassword = await hashDefaultPassword()
  const now = new Date().toISOString()
  const memberIdByEmail = new Map<string, number>()

  for (const member of seedMembers) {
    const result = await db.run(
      `INSERT INTO members (
        name, firstName, lastName, email, role, color, password, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member.name,
        member.firstName,
        member.lastName,
        member.email,
        member.role,
        member.color,
        hashedPassword,
        1,
        now,
        now,
      ]
    )
    memberIdByEmail.set(member.email.toLowerCase(), Number(result.lastID))
  }

  for (const { assigneeEmail, ...task } of seedTasks) {
    const assigneeId = memberIdByEmail.get(assigneeEmail.toLowerCase()) ?? null
    await createTask({ ...task, assigneeId }, db)
  }

  console.log(
    `🌱 Seed completato: ${seedMembers.length} membri, ${defaultCategories.length} categorie, ${seedTasks.length} task`
  )
}
