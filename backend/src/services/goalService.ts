import { randomUUID } from 'crypto'
import type { Database } from 'sqlite'
import type { Goal, GoalHistory, GoalWithProgress } from '../types'
import { getDatabase } from '../config/database'
import {
  calculateCompletion,
  getPeriodBounds,
  isGoalType,
  isPeriodExpired,
  validateGoalTarget,
  type GoalType,
} from '../utils/goalPeriod'

interface GoalRow {
  id: string
  userId: number
  type: GoalType
  target: number
  periodStart: string
  createdAt: string
  updatedAt: string
}

interface GoalHistoryRow {
  id: string
  goalId: string
  userId: number
  type: GoalType
  target: number
  completedTasks: number
  completionPercentage: number
  status: 'reached' | 'not_reached'
  periodStart: string
  periodEnd: string
  createdAt: string
}

function mapGoalRow(row: GoalRow): Goal {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    target: row.target,
    periodStart: row.periodStart,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function mapHistoryRow(row: GoalHistoryRow): GoalHistory {
  return { ...row }
}

export async function countCompletedTasksInPeriod(
  userId: number,
  periodStart: string,
  periodEnd: string,
  db?: Database
): Promise<number> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<{ count: number }>(
    `SELECT COUNT(*) AS count FROM tasks
     WHERE status = 'done'
       AND assigneeId = ?
       AND updatedAt >= ?
       AND updatedAt <= ?
       AND (archived = 0 OR archived IS NULL)`,
    [userId, periodStart, periodEnd]
  )
  return row?.count ?? 0
}

async function buildGoalWithProgress(goal: Goal, db: Database): Promise<GoalWithProgress> {
  const { periodEnd } = getPeriodBounds(goal.type)
  const completedTasks = await countCompletedTasksInPeriod(
    goal.userId,
    goal.periodStart,
    periodEnd,
    db
  )
  const completionPercentage = calculateCompletion(completedTasks, goal.target)
  const reached = completedTasks >= goal.target

  return {
    ...goal,
    periodEnd,
    completedTasks,
    completionPercentage,
    status: reached ? 'reached' : 'in_progress',
  }
}

async function archiveGoalPeriod(goal: Goal, db: Database): Promise<void> {
  const { periodEnd } = getPeriodBounds(goal.type, new Date(goal.periodStart))
  const completedTasks = await countCompletedTasksInPeriod(
    goal.userId,
    goal.periodStart,
    periodEnd,
    db
  )
  const completionPercentage = calculateCompletion(completedTasks, goal.target)
  const status = completedTasks >= goal.target ? 'reached' : 'not_reached'
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO goal_history (
      id, goalId, userId, type, target, completedTasks, completionPercentage,
      status, periodStart, periodEnd, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      goal.id,
      goal.userId,
      goal.type,
      goal.target,
      completedTasks,
      completionPercentage,
      status,
      goal.periodStart,
      periodEnd,
      now,
    ]
  )
}

async function ensureCurrentPeriod(goal: Goal, db: Database): Promise<Goal> {
  if (!isPeriodExpired(goal.type, goal.periodStart)) {
    return goal
  }

  await archiveGoalPeriod(goal, db)
  const { periodStart } = getPeriodBounds(goal.type)
  const now = new Date().toISOString()

  await db.run(
    `UPDATE goals SET periodStart = ?, updatedAt = ? WHERE id = ?`,
    [periodStart, now, goal.id]
  )

  return { ...goal, periodStart, updatedAt: now }
}

export async function getGoalsByUserId(userId: number, db?: Database): Promise<GoalWithProgress[]> {
  const connection = db ?? (await getDatabase())
  const rows = (await connection.all(
    `SELECT id, userId, type, target, periodStart, createdAt, updatedAt
     FROM goals WHERE userId = ? ORDER BY type ASC`,
    [userId]
  )) as GoalRow[]

  const results: GoalWithProgress[] = []
  for (const row of rows) {
    const current = await ensureCurrentPeriod(mapGoalRow(row), connection)
    results.push(await buildGoalWithProgress(current, connection))
  }
  return results
}

export async function getGoalById(
  id: string,
  userId: number,
  db?: Database
): Promise<GoalWithProgress | undefined> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<GoalRow>(
    `SELECT id, userId, type, target, periodStart, createdAt, updatedAt
     FROM goals WHERE id = ? AND userId = ?`,
    [id, userId]
  )
  if (!row) return undefined
  const current = await ensureCurrentPeriod(mapGoalRow(row), connection)
  return buildGoalWithProgress(current, connection)
}

export async function upsertGoal(
  userId: number,
  type: GoalType,
  target: number,
  db?: Database
): Promise<GoalWithProgress> {
  const connection = db ?? (await getDatabase())
  const validTarget = validateGoalTarget(target)

  const existing = await connection.get<GoalRow>(
    `SELECT id, userId, type, target, periodStart, createdAt, updatedAt
     FROM goals WHERE userId = ? AND type = ?`,
    [userId, type]
  )

  const now = new Date().toISOString()
  const { periodStart } = getPeriodBounds(type)

  if (existing) {
    await connection.run(
      `UPDATE goals SET target = ?, updatedAt = ? WHERE id = ?`,
      [validTarget, now, existing.id]
    )
    const updated = await connection.get<GoalRow>(
      `SELECT id, userId, type, target, periodStart, createdAt, updatedAt FROM goals WHERE id = ?`,
      [existing.id]
    )
    if (!updated) throw new Error('Obiettivo non trovato')
    const current = await ensureCurrentPeriod(mapGoalRow(updated), connection)
    return buildGoalWithProgress(current, connection)
  }

  const id = randomUUID()
  await connection.run(
    `INSERT INTO goals (id, userId, type, target, periodStart, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, type, validTarget, periodStart, now, now]
  )

  const created = mapGoalRow({
    id,
    userId,
    type,
    target: validTarget,
    periodStart,
    createdAt: now,
    updatedAt: now,
  })
  return buildGoalWithProgress(created, connection)
}

export async function updateGoal(
  id: string,
  userId: number,
  target: number,
  db?: Database
): Promise<GoalWithProgress> {
  const connection = db ?? (await getDatabase())
  const validTarget = validateGoalTarget(target)
  const existing = await getGoalById(id, userId, connection)
  if (!existing) throw new Error('Obiettivo non trovato')

  const now = new Date().toISOString()
  await connection.run(
    `UPDATE goals SET target = ?, updatedAt = ? WHERE id = ? AND userId = ?`,
    [validTarget, now, id, userId]
  )

  return (await getGoalById(id, userId, connection))!
}

export async function deleteGoal(id: string, userId: number, db?: Database): Promise<void> {
  const connection = db ?? (await getDatabase())
  const existing = await connection.get<{ id: string }>(
    `SELECT id FROM goals WHERE id = ? AND userId = ?`,
    [id, userId]
  )
  if (!existing) throw new Error('Obiettivo non trovato')
  await connection.run(`DELETE FROM goals WHERE id = ?`, [id])
}

export async function getGoalHistory(
  userId: number,
  type?: GoalType,
  db?: Database
): Promise<GoalHistory[]> {
  const connection = db ?? (await getDatabase())
  let query = `SELECT id, goalId, userId, type, target, completedTasks, completionPercentage,
                      status, periodStart, periodEnd, createdAt
               FROM goal_history WHERE userId = ?`
  const params: (string | number)[] = [userId]

  if (type) {
    query += ` AND type = ?`
    params.push(type)
  }

  query += ` ORDER BY periodEnd DESC, createdAt DESC`

  const rows = (await connection.all(query, params)) as GoalHistoryRow[]
  return rows.map(mapHistoryRow)
}

export async function processGoalPeriodRollover(db?: Database): Promise<number> {
  const connection = db ?? (await getDatabase())
  const rows = (await connection.all(
    `SELECT id, userId, type, target, periodStart, createdAt, updatedAt FROM goals`
  )) as GoalRow[]

  let rolled = 0
  for (const row of rows) {
    const goal = mapGoalRow(row)
    if (isPeriodExpired(goal.type, goal.periodStart)) {
      await ensureCurrentPeriod(goal, connection)
      rolled += 1
    }
  }
  return rolled
}

export function parseGoalInput(body: Record<string, unknown>): { type: GoalType; target: number } {
  if (!isGoalType(body.type)) {
    throw new Error('Tipo obiettivo non valido (daily o weekly)')
  }
  return { type: body.type, target: validateGoalTarget(body.target) }
}
