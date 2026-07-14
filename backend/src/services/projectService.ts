import { randomUUID } from 'crypto'
import type { Database } from 'sqlite'
import type { Project, ProjectTaskSummary, TeamMember } from '../types'
import { getDatabase } from '../config/database'
import { getMemberById } from './memberService'
import {
  computeProjectProgress,
  validateProjectInput,
} from '../utils/projectValidation'

interface ProjectRow {
  id: string
  name: string
  description: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

interface ProjectStatsRow extends ProjectRow {
  totalTasks: number
  completedTasks: number
}

interface ProjectTaskRow {
  id: string
  title: string
  status: string
  priority: string
  categoryId: string | null
  categoryName: string | null
  dueDate: string | null
}

function mapProjectTask(row: ProjectTaskRow): ProjectTaskSummary {
  return {
    id: row.id,
    title: row.title,
    status: row.status as ProjectTaskSummary['status'],
    priority: row.priority as ProjectTaskSummary['priority'],
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    dueDate: row.dueDate,
    isCompleted: row.status === 'done',
  }
}

async function mapProjectWithStats(
  row: ProjectStatsRow,
  db: Database,
  includeTasks = false
): Promise<Project> {
  const owner = await getMemberById(row.ownerId, db)
  const totalTasks = row.totalTasks ?? 0
  const completedTasks = row.completedTasks ?? 0
  const progress = computeProjectProgress(totalTasks, completedTasks)

  const project: Project = {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.ownerId,
    owner: owner ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    totalTasks,
    completedTasks,
    progress,
    isCompleted: totalTasks > 0 && completedTasks === totalTasks,
  }

  if (includeTasks) {
    const taskRows = (await db.all(
      `SELECT t.id, t.title, t.status, t.priority, t.categoryId, t.dueDate, c.name AS categoryName
       FROM tasks t
       LEFT JOIN categories c ON c.id = t.categoryId
       WHERE t.projectId = ?
       ORDER BY t.dueDate IS NULL, t.dueDate ASC, t.title COLLATE NOCASE ASC`,
      [row.id]
    )) as ProjectTaskRow[]
    project.tasks = taskRows.map(mapProjectTask)
  }

  return project
}

const PROJECT_STATS_SELECT = `
  SELECT p.id, p.name, p.description, p.ownerId, p.createdAt, p.updatedAt,
         COUNT(t.id) AS totalTasks,
         SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completedTasks
  FROM projects p
  LEFT JOIN tasks t ON t.projectId = p.id
`

export async function getProjectsByOwner(
  ownerId: string,
  search?: string,
  db?: Database
): Promise<Project[]> {
  const connection = db ?? (await getDatabase())
  const params: string[] = [ownerId]
  let where = 'WHERE p.ownerId = ?'
  if (search?.trim()) {
    where += ' AND p.name LIKE ? COLLATE NOCASE'
    params.push(`%${search.trim()}%`)
  }

  const rows = (await connection.all(
    `${PROJECT_STATS_SELECT}
     ${where}
     GROUP BY p.id
     ORDER BY p.name COLLATE NOCASE ASC`,
    params
  )) as ProjectStatsRow[]

  return Promise.all(rows.map((row) => mapProjectWithStats(row, connection)))
}

export async function getProjectById(
  id: string,
  ownerId: string,
  db?: Database
): Promise<Project | undefined> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<ProjectStatsRow>(
    `${PROJECT_STATS_SELECT}
     WHERE p.id = ? AND p.ownerId = ?
     GROUP BY p.id`,
    [id, ownerId]
  )
  if (!row) return undefined
  return mapProjectWithStats(row, connection, true)
}

export async function createProject(
  input: { name: string; description: string; ownerId: string },
  db?: Database
): Promise<Project> {
  const connection = db ?? (await getDatabase())
  const owner = await getMemberById(input.ownerId, connection)
  if (!owner) throw new Error('Proprietario non valido')

  const { name, description } = validateProjectInput(input.name, input.description)
  const now = new Date().toISOString()
  const id = randomUUID()

  await connection.run(
    `INSERT INTO projects (id, name, description, ownerId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, name, description, input.ownerId, now, now]
  )

  return {
    id,
    name,
    description,
    ownerId: input.ownerId,
    owner,
    createdAt: now,
    updatedAt: now,
    totalTasks: 0,
    completedTasks: 0,
    progress: 0,
    isCompleted: false,
    tasks: [],
  }
}

export async function updateProject(
  id: string,
  ownerId: string,
  input: { name: string; description: string },
  db?: Database
): Promise<Project> {
  const connection = db ?? (await getDatabase())
  const existing = await getProjectById(id, ownerId, connection)
  if (!existing) throw new Error('Progetto non trovato')

  const { name, description } = validateProjectInput(input.name, input.description)
  const now = new Date().toISOString()

  await connection.run(
    `UPDATE projects SET name = ?, description = ?, updatedAt = ? WHERE id = ? AND ownerId = ?`,
    [name, description, now, id, ownerId]
  )

  const updated = await getProjectById(id, ownerId, connection)
  if (!updated) throw new Error('Progetto non trovato')
  return updated
}

export async function deleteProject(id: string, ownerId: string, db?: Database): Promise<void> {
  const connection = db ?? (await getDatabase())
  const existing = await getProjectById(id, ownerId, connection)
  if (!existing) throw new Error('Progetto non trovato')

  await connection.run('BEGIN')
  try {
    await connection.run(`UPDATE tasks SET projectId = NULL WHERE projectId = ?`, [id])
    await connection.run(`DELETE FROM projects WHERE id = ? AND ownerId = ?`, [id, ownerId])
    await connection.run('COMMIT')
  } catch (error) {
    await connection.run('ROLLBACK')
    throw error
  }
}

export async function projectExists(id: string, db?: Database): Promise<boolean> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<{ id: string }>(
    `SELECT id FROM projects WHERE id = ?`,
    [id]
  )
  return !!row
}

export async function projectOwnedBy(id: string, ownerId: string, db?: Database): Promise<boolean> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<{ id: string }>(
    `SELECT id FROM projects WHERE id = ? AND ownerId = ?`,
    [id, ownerId]
  )
  return !!row
}
