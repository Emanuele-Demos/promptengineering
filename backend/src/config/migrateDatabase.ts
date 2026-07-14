import type { Database } from 'sqlite'

async function columnExists(db: Database, table: string, column: string): Promise<boolean> {
  const rows = (await db.all(`PRAGMA table_info(${table})`)) as { name: string }[]
  return rows.some((row) => row.name === column)
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
}
