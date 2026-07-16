import type { Database } from 'sqlite'

const SEED_MEMBER_IDS = ['m1', 'm2', 'm3', 'm4'] as const

type MemberRow = {
  id: string
  name: string
  firstName: string | null
  lastName: string | null
  username: string | null
  email: string
  role: string
  color: string
  password: string | null
  isActive: number | null
  createdAt: string | null
  updatedAt: string | null
}

async function tableExists(db: Database, table: string): Promise<boolean> {
  const row = await db.get<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [table]
  )
  return Boolean(row)
}

async function columnExists(db: Database, table: string, column: string): Promise<boolean> {
  const rows = (await db.all(`PRAGMA table_info(${table})`)) as { name: string }[]
  return rows.some((row) => row.name === column)
}

async function columnType(db: Database, table: string, column: string): Promise<string | null> {
  const rows = (await db.all(`PRAGMA table_info(${table})`)) as { name: string; type: string }[]
  return rows.find((row) => row.name === column)?.type ?? null
}

export async function membersUseIntegerIds(db: Database): Promise<boolean> {
  const row = await db.get<{ type: string }>(
    `SELECT type FROM pragma_table_info('members') WHERE name = 'id'`
  )
  return row?.type === 'INTEGER'
}

async function createMembersNew(db: Database): Promise<void> {
  await db.exec('DROP TABLE IF EXISTS members_new')
  await db.exec(`
    CREATE TABLE members_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      firstName TEXT,
      lastName TEXT,
      username TEXT UNIQUE,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'User',
      color TEXT NOT NULL,
      password TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const allMembers = (await db.all(`SELECT * FROM members`)) as MemberRow[]

  let seedNumericId = 1
  for (const seedId of SEED_MEMBER_IDS) {
    const member = allMembers.find((row) => row.id === seedId)
    if (!member) continue

    await db.run(
      `INSERT INTO members_new (
        id, name, firstName, lastName, username, email, role, color,
        password, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        seedNumericId,
        member.name,
        member.firstName,
        member.lastName,
        member.username,
        member.email,
        member.role,
        member.color,
        member.password,
        member.isActive ?? 1,
        member.createdAt ?? new Date().toISOString(),
        member.updatedAt ?? new Date().toISOString(),
      ]
    )
    seedNumericId++
  }

  const otherMembers = allMembers
    .filter((member) => !SEED_MEMBER_IDS.includes(member.id as (typeof SEED_MEMBER_IDS)[number]))
    .sort((a, b) => {
      const aTime = a.createdAt ?? ''
      const bTime = b.createdAt ?? ''
      return aTime.localeCompare(bTime) || a.name.localeCompare(b.name)
    })

  for (const member of otherMembers) {
    await db.run(
      `INSERT INTO members_new (
        name, firstName, lastName, username, email, role, color,
        password, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member.name,
        member.firstName,
        member.lastName,
        member.username,
        member.email,
        member.role,
        member.color,
        member.password,
        member.isActive ?? 1,
        member.createdAt ?? new Date().toISOString(),
        member.updatedAt ?? new Date().toISOString(),
      ]
    )
  }
}

async function buildIdMap(db: Database): Promise<Map<string, number>> {
  const rows = (await db.all(`
    SELECT old.id AS oldId, new.id AS newId
    FROM members old
    JOIN members_new new ON LOWER(old.email) = LOWER(new.email)
  `)) as { oldId: string; newId: number }[]

  const idMap = new Map<string, number>()
  for (const row of rows) {
    idMap.set(row.oldId, row.newId)
  }
  return idMap
}

async function migrateForeignKeyColumn(
  db: Database,
  table: string,
  column: string,
  idMap: Map<string, number>
): Promise<void> {
  if (!(await tableExists(db, table))) return

  const currentType = await columnType(db, table, column)
  if (currentType === 'INTEGER') return

  const tempColumn = `${column}_int`
  if (!(await columnExists(db, table, tempColumn))) {
    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${tempColumn} INTEGER`)
  }

  for (const [oldId, newId] of idMap) {
    await db.run(`UPDATE ${table} SET ${tempColumn} = ? WHERE ${column} = ?`, [newId, oldId])
  }

  if (await columnExists(db, table, column)) {
    await db.exec('PRAGMA legacy_alter_table = ON')
    const legacyColumn = `${column}_legacy`
    await db.exec(`ALTER TABLE ${table} RENAME COLUMN ${column} TO ${legacyColumn}`)
  }

  if (await columnExists(db, table, tempColumn)) {
    await db.exec(`ALTER TABLE ${table} RENAME COLUMN ${tempColumn} TO ${column}`)
  }

  const legacyColumn = `${column}_legacy`
  if (await columnExists(db, table, legacyColumn)) {
    try {
      await db.exec(`ALTER TABLE ${table} DROP COLUMN ${legacyColumn}`)
    } catch {
      /* colonna legacy innocua se il drop fallisce per vincoli SQLite */
    }
  }
}

export async function migrateMemberIntegerIds(db: Database): Promise<void> {
  if (await membersUseIntegerIds(db)) {
    await db.exec('DROP TABLE IF EXISTS members_new')
    return
  }

  await db.exec('PRAGMA foreign_keys = OFF')

  const hasMembersNew = await tableExists(db, 'members_new')
  if (!hasMembersNew) {
    await createMembersNew(db)
  }

  const idMap = await buildIdMap(db)
  if (idMap.size === 0) {
    await db.exec('DROP TABLE IF EXISTS members_new')
    throw new Error('Migrazione ID membri fallita: mappa ID vuota')
  }

  await migrateForeignKeyColumn(db, 'tasks', 'assigneeId', idMap)
  await migrateForeignKeyColumn(db, 'projects', 'ownerId', idMap)
  await migrateForeignKeyColumn(db, 'notifications', 'userId', idMap)
  await migrateForeignKeyColumn(db, 'goals', 'userId', idMap)
  await migrateForeignKeyColumn(db, 'goal_history', 'userId', idMap)

  await db.exec('DROP TABLE members')
  await db.exec('ALTER TABLE members_new RENAME TO members')
  await db.exec(
    `UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM members) WHERE name = 'members'`
  )
  await db.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_members_username ON members(username) WHERE username IS NOT NULL'
  )

  await db.exec('PRAGMA foreign_keys = ON')

  console.log(`🔢 Migrazione ID membri completata (${idMap.size} utenti)`)
}
