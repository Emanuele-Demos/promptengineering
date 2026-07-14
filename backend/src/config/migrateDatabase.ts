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

  if (!(await columnExists(db, 'tasks', 'reminderDate'))) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN reminderDate TEXT`)
  }

  if (!(await columnExists(db, 'tasks', 'reminderType'))) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN reminderType TEXT`)
  }

  if (!(await columnExists(db, 'tasks', 'reminderSentAt'))) {
    await db.exec(`ALTER TABLE tasks ADD COLUMN reminderSentAt TEXT`)
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
}
