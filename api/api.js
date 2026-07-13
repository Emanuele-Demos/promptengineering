import express from 'express'
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'database.sqlite')

let db

function getDb() {
  if (!db) {
    db = new sqlite3.Database(dbPath)
    db.run(`
      CREATE TABLE IF NOT EXISTS stato (
        slug TEXT PRIMARY KEY,
        valore_stato TEXT NOT NULL
      )
    `)
  }
  return db
}

export function toSlug(valore) {
  return valore
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) reject(err)
      else resolve({ changes: this.changes })
    })
  })
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

export function createApiRouter() {
  const router = express.Router()
  router.use(express.json())

  router.post('/add_status', async (req, res) => {
    const { valore_stato } = req.body

    if (!valore_stato || !String(valore_stato).trim()) {
      return res.status(400).json({ error: 'valore_stato obbligatorio' })
    }

    const trimmed = String(valore_stato).trim()
    const slug = toSlug(trimmed)

    if (!slug) {
      return res.status(400).json({ error: 'valore_stato non valido' })
    }

    try {
      await dbRun(
        'INSERT INTO stato (slug, valore_stato) VALUES (?, ?)',
        [slug, trimmed],
      )
      res.status(201).json({ slug, valore_stato: trimmed })
    } catch (err) {
      if (err.message?.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Questo stato esiste già' })
      }
      res.status(500).json({ error: 'Errore durante il salvataggio' })
    }
  })

  router.get('/get_stati', async (_req, res) => {
    try {
      const rows = await dbAll(
        'SELECT slug, valore_stato FROM stato ORDER BY valore_stato ASC',
      )
      res.json(rows)
    } catch {
      res.status(500).json({ error: 'Errore durante il caricamento' })
    }
  })

  return router
}
