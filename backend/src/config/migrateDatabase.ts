import type { Database } from 'sqlite'
import { hashDefaultPassword } from '../services/authService'
import {
  generateRandomLastName,
  isPlaceholderLastName,
} from '../utils/randomLastName'
import { buildInstitutionalEmail } from '../utils/institutionalEmail'
import { createOnboardingTaskForMember } from '../services/onboardingService'
import type { CompanyRole } from '../data/companyRoles'
import { isCompanyRole } from '../data/companyRoles'
import { migrateMemberIntegerIds, membersUseIntegerIds } from './migrateMemberIntegerIds'

async function columnExists(db: Database, table: string, column: string): Promise<boolean> {
  const rows = (await db.all(`PRAGMA table_info(${table})`)) as { name: string }[]
  return rows.some((row) => row.name === column)
}

async function tableExists(db: Database, table: string): Promise<boolean> {
  const row = await db.get<{ count: number }>(
    `SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name=?`,
    [table]
  )
  return (row?.count ?? 0) > 0
}

export async function runMigrations(db: Database): Promise<void> {
  if (!(await columnExists(db, 'attachments', 'originalName'))) {
    await db.exec(`ALTER TABLE attachments ADD COLUMN originalName TEXT`)
    await db.exec(`UPDATE attachments SET originalName = fileName WHERE originalName IS NULL`)
  }

  if (!(await columnExists(db, 'attachments', 'mimeType'))) {
    await db.exec(`ALTER TABLE attachments ADD COLUMN mimeType TEXT`)
  }

  if (await columnExists(db, 'attachments', 'type')) {
    await db.exec(`UPDATE attachments SET mimeType = type WHERE mimeType IS NULL OR mimeType = ''`)
  }

  if (!(await columnExists(db, 'attachments', 'createdAt'))) {
    await db.exec(`ALTER TABLE attachments ADD COLUMN createdAt TEXT`)
    await db.exec(
      `UPDATE attachments SET createdAt = datetime('now') WHERE createdAt IS NULL`
    )
  }

  if (!(await columnExists(db, 'attachments', 'updatedAt'))) {
    await db.exec(`ALTER TABLE attachments ADD COLUMN updatedAt TEXT`)
    await db.exec(
      `UPDATE attachments SET updatedAt = datetime('now') WHERE updatedAt IS NULL`
    )
  }

  if (await columnExists(db, 'attachments', 'type')) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS attachments_new (
        id TEXT PRIMARY KEY,
        taskId TEXT NOT NULL,
        fileName TEXT NOT NULL,
        originalName TEXT NOT NULL,
        mimeType TEXT NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `)
    await db.exec(`
      INSERT INTO attachments_new (id, taskId, fileName, originalName, mimeType, size, path, createdAt, updatedAt)
      SELECT
        id,
        taskId,
        fileName,
        COALESCE(originalName, fileName),
        COALESCE(NULLIF(mimeType, ''), type, 'application/octet-stream'),
        size,
        path,
        COALESCE(createdAt, datetime('now')),
        COALESCE(updatedAt, datetime('now'))
      FROM attachments
    `)
    await db.exec(`DROP TABLE attachments`)
    await db.exec(`ALTER TABLE attachments_new RENAME TO attachments`)
  }

  const categoriesTable = (await db.all(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='categories'`
  )) as { name: string }[]

  if (categoriesTable.length === 0) {
    await db.exec(`
      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        color TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)
  }

  if (!(await columnExists(db, 'tasks', 'categoryId'))) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN categoryId TEXT REFERENCES categories(id) ON DELETE SET NULL`)
  }

  const projectsTable = (await db.all(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='projects'`
  )) as { name: string }[]

  if (projectsTable.length === 0) {
    await db.exec(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        ownerId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (ownerId) REFERENCES members(id) ON DELETE CASCADE
      )
    `)
  }

  if (!(await columnExists(db, 'tasks', 'projectId'))) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN projectId TEXT REFERENCES projects(id) ON DELETE SET NULL`)
  }

  if (!(await columnExists(db, 'tasks', 'reminderDate'))) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN reminderDate TEXT`)
  }

  if (!(await columnExists(db, 'tasks', 'reminderType'))) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN reminderType TEXT`)
  }

  if (!(await columnExists(db, 'tasks', 'reminderSentAt'))) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN reminderSentAt TEXT`)
  }

  const recurrenceColumns: [string, string][] = [
    ['isRecurring', 'INTEGER NOT NULL DEFAULT 0'],
    ['repeatType', 'TEXT'],
    ['repeatEvery', 'INTEGER DEFAULT 1'],
    ['repeatCustomUnit', 'TEXT'],
    ['repeatEndType', "TEXT DEFAULT 'never'"],
    ['repeatEnd', 'TEXT'],
    ['repeatOccurrences', 'INTEGER'],
    ['occurrencesGenerated', 'INTEGER DEFAULT 0'],
    ['lastGeneratedAt', 'TEXT'],
    ['nextOccurrence', 'TEXT'],
    ['parentTaskId', 'TEXT'],
  ]

  for (const [column, definition] of recurrenceColumns) {
    if (!(await columnExists(db, 'tasks', column))) {
      await db.exec(`ALTER TABLE tasks ADD COLUMN ${column} ${definition}`)
    }
  }

  const advancedRecurrenceColumns: [string, string][] = [
    ['repeatDays', "TEXT DEFAULT '[]'"],
    ['maxOccurrences', 'INTEGER'],
    ['currentOccurrences', 'INTEGER DEFAULT 0'],
    ['isRecurringActive', 'INTEGER NOT NULL DEFAULT 1'],
  ]

  for (const [column, definition] of advancedRecurrenceColumns) {
    if (!(await columnExists(db, 'tasks', column))) {
      await db.exec(`ALTER TABLE tasks ADD COLUMN ${column} ${definition}`)
    }
  }

  if (await columnExists(db, 'tasks', 'occurrencesGenerated')) {
    await db.exec(
      `UPDATE tasks SET currentOccurrences = occurrencesGenerated WHERE currentOccurrences IS NULL OR currentOccurrences = 0`
    )
  }

  const notificationsTable = (await db.all(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'`
  )) as { name: string }[]

  if (notificationsTable.length === 0) {
    await db.exec(`
      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        taskId TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        isRead INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        readAt TEXT,
        FOREIGN KEY (userId) REFERENCES members(id) ON DELETE CASCADE,
        FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `)
  }

  const goalsTable = (await db.all(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='goals'`
  )) as { name: string }[]

  if (goalsTable.length === 0) {
    await db.exec(`
      CREATE TABLE goals (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('daily', 'weekly')),
        target INTEGER NOT NULL,
        periodStart TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES members(id) ON DELETE CASCADE,
        UNIQUE(userId, type)
      )
    `)
  }

  const goalHistoryTable = (await db.all(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='goal_history'`
  )) as { name: string }[]

  if (goalHistoryTable.length === 0) {
    await db.exec(`
      CREATE TABLE goal_history (
        id TEXT PRIMARY KEY,
        goalId TEXT NOT NULL,
        userId TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('daily', 'weekly')),
        target INTEGER NOT NULL,
        completedTasks INTEGER NOT NULL,
        completionPercentage INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('reached', 'not_reached')),
        periodStart TEXT NOT NULL,
        periodEnd TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES members(id) ON DELETE CASCADE
      )
    `)
  }

  if (!(await columnExists(db, 'tasks', 'favorite'))) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0`)
  }

  if (!(await columnExists(db, 'tasks', 'archived'))) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`)
  }

  if (!(await columnExists(db, 'tasks', 'archivedAt'))) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN archivedAt TEXT`)
  }

  if (!(await columnExists(db, 'tasks', 'estimatedTime'))) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN estimatedTime INTEGER`)
  }

  if (!(await columnExists(db, 'tasks', 'actualTime'))) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN actualTime INTEGER`)
  }

  if (!(await columnExists(db, 'members', 'password'))) {
    await db.exec(`ALTER TABLE members ADD COLUMN password TEXT`)
  }

  if (!(await columnExists(db, 'members', 'createdAt'))) {
    await db.exec(`ALTER TABLE members ADD COLUMN createdAt TEXT`)
    await db.exec(
      `UPDATE members SET createdAt = datetime('now') WHERE createdAt IS NULL`
    )
  }

  if (!(await columnExists(db, 'members', 'updatedAt'))) {
    await db.exec(`ALTER TABLE members ADD COLUMN updatedAt TEXT`)
    await db.exec(
      `UPDATE members SET updatedAt = datetime('now') WHERE updatedAt IS NULL`
    )
  }

  const membersWithoutPassword = (await db.all(
    `SELECT id FROM members WHERE password IS NULL OR password = ''`
  )) as { id: number | string }[]

  if (membersWithoutPassword.length > 0) {
    const hashed = await hashDefaultPassword()
    for (const member of membersWithoutPassword) {
      await db.run(`UPDATE members SET password = ?, updatedAt = datetime('now') WHERE id = ?`, [
        hashed,
        member.id,
      ])
    }
  }

  if (!(await columnExists(db, 'members', 'firstName'))) {
    await db.exec(`ALTER TABLE members ADD COLUMN firstName TEXT`)
  }

  if (!(await columnExists(db, 'members', 'lastName'))) {
    await db.exec(`ALTER TABLE members ADD COLUMN lastName TEXT`)
  }

  if (!(await columnExists(db, 'members', 'username'))) {
    await db.exec(`ALTER TABLE members ADD COLUMN username TEXT`)
    await db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_members_username ON members(username) WHERE username IS NOT NULL`)
  }

  if (!(await columnExists(db, 'members', 'isActive'))) {
    await db.exec(`ALTER TABLE members ADD COLUMN isActive INTEGER NOT NULL DEFAULT 1`)
  }

  const membersWithoutNames = (await db.all(
    `SELECT id, name FROM members WHERE firstName IS NULL OR firstName = ''`
  )) as { id: number | string; name: string }[]

  for (const member of membersWithoutNames) {
    const parts = member.name.trim().split(/\s+/)
    const firstName = parts[0] ?? member.name
    const lastName = parts.slice(1).join(' ') || ''
    await db.run(
      `UPDATE members SET firstName = ?, lastName = ?, updatedAt = datetime('now') WHERE id = ?`,
      [firstName, lastName, member.id]
    )
  }

  await db.run(`UPDATE members SET isActive = 1 WHERE isActive IS NULL`)

  await db.run(`
    DELETE FROM members
    WHERE LOWER(email) = 'test.utente@team.it'
       OR LOWER(firstName) = 'test'
       OR LOWER(name) LIKE 'test %'
  `)

  const usesIntegerIds = await membersUseIntegerIds(db)

  if (!usesIntegerIds) {
    const seedNames: Record<string, { firstName: string; lastName: string }> = {
      m1: { firstName: 'Marco', lastName: 'Rossi' },
      m2: { firstName: 'Laura', lastName: 'Bianchi' },
      m3: { firstName: 'Giuseppe', lastName: 'Verdi' },
      m4: { firstName: 'Anna', lastName: 'Neri' },
    }

    for (const [id, names] of Object.entries(seedNames)) {
      await db.run(
        `UPDATE members SET firstName = ?, lastName = ?, name = ?, updatedAt = datetime('now') WHERE id = ?`,
        [names.firstName, names.lastName, `${names.firstName} ${names.lastName}`, id]
      )
    }

    const membersWithPlaceholder = (await db.all(
      `SELECT id, firstName, lastName, name FROM members
       WHERE id NOT IN ('m1','m2','m3','m4')
         AND (
           lastName IS NULL
           OR LOWER(TRIM(lastName)) = 'team'
           OR LOWER(TRIM(lastName)) = 'utente'
           OR name LIKE '% Team'
         )`
    )) as { id: string; firstName: string | null; lastName: string | null; name: string }[]

    for (const member of membersWithPlaceholder) {
      const firstName =
        member.firstName?.trim() || member.name.trim().split(/\s+/)[0] || 'Utente'

      if (!isPlaceholderLastName(member.lastName) && !member.name.trim().endsWith(' Team')) {
        continue
      }

      const lastName = generateRandomLastName()
      await db.run(
        `UPDATE members SET firstName = ?, lastName = ?, name = ?, updatedAt = datetime('now') WHERE id = ?`,
        [firstName, lastName, `${firstName} ${lastName}`, member.id]
      )
    }

    const registeredUsers = (await db.all(
      `SELECT id FROM members WHERE id LIKE 'u%'`
    )) as { id: string }[]

    if (registeredUsers.length > 0) {
      const hashed = await hashDefaultPassword()
      for (const user of registeredUsers) {
        await db.run(
          `UPDATE members SET password = ?, updatedAt = datetime('now') WHERE id = ?`,
          [hashed, user.id]
        )
      }
    }
  }

  const membersForEmail = (await db.all(
    `SELECT id, firstName, lastName, email FROM members
     WHERE firstName IS NOT NULL AND TRIM(firstName) != ''
       AND lastName IS NOT NULL AND TRIM(lastName) != ''`
  )) as { id: number | string; firstName: string; lastName: string; email: string }[]

  for (const member of membersForEmail) {
    const email = buildInstitutionalEmail(member.firstName, member.lastName)
    if (member.email.toLowerCase() !== email) {
      await db.run(
        `UPDATE members SET email = ?, updatedAt = datetime('now') WHERE id = ?`,
        [email, member.id]
      )
    }
  }

  await migrateMemberIntegerIds(db)

  if (!(await tableExists(db, 'password_reset_tokens'))) {
    await db.exec(`
      CREATE TABLE password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memberId INTEGER NOT NULL,
        tokenHash TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        usedAt TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_password_reset_token_hash ON password_reset_tokens(tokenHash);
      CREATE INDEX idx_password_reset_member ON password_reset_tokens(memberId);
    `)
  }

  if (!(await columnExists(db, 'members', 'avatarPath'))) {
    await db.exec(`ALTER TABLE members ADD COLUMN avatarPath TEXT`)
  }

  const roleByFirstName: Record<string, CompanyRole> = {
    lorenzo: 'Developer',
    mario: 'QA Engineer',
  }

  const membersNeedingRole = (await db.all(
    `SELECT id, firstName, lastName, role FROM members
     WHERE LOWER(firstName) IN ('mario', 'lorenzo')
       AND (role IS NULL OR TRIM(role) = '' OR role = 'User')`
  )) as { id: number; firstName: string; lastName: string; role: string }[]

  for (const member of membersNeedingRole) {
    const role = roleByFirstName[member.firstName.trim().toLowerCase()]
    if (!role || !isCompanyRole(role)) continue

    await db.run(
      `UPDATE members SET role = ?, updatedAt = datetime('now') WHERE id = ?`,
      [role, member.id]
    )

    const taskRow = await db.get<{ count: number }>(
      `SELECT COUNT(*) AS count FROM tasks
       WHERE assigneeId = ? AND archived = 0 AND status != 'done'`,
      [member.id]
    )

    if ((taskRow?.count ?? 0) === 0) {
      await createOnboardingTaskForMember(member.id, role, db)
    }
  }
}
