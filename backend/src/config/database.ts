import fs from 'fs'
import path from 'path'
import sqlite3 from 'sqlite3'
import { open, type Database } from 'sqlite'

sqlite3.verbose()

const DB_PATH = path.join(__dirname, '../../database/database.sqlite')

let db: Database | null = null

export function getDatabasePath(): string {
  return DB_PATH
}

export async function getDatabase(): Promise<Database> {
  if (db) return db

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  })

  await db.exec('PRAGMA foreign_keys = ON')

  return db
}

export async function closeDatabase(): Promise<void> {
  if (!db) return
  await db.close()
  db = null
}
