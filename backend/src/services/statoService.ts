import type { Database } from 'sqlite'
import { getDatabase } from '../config/database'
import { createSlug } from '../utils/slug'

export interface Stato {
  slug: string
  valore_stato: string
}

export async function getAllStati(db?: Database): Promise<Stato[]> {
  const connection = db ?? (await getDatabase())
  return (await connection.all(
    `SELECT slug, valore_stato FROM stato ORDER BY valore_stato ASC`
  )) as Stato[]
}

export async function addStato(valoreStato: string, db?: Database): Promise<Stato> {
  const connection = db ?? (await getDatabase())
  const trimmed = valoreStato.trim()

  if (!trimmed) {
    throw new Error('Il valore stato è obbligatorio')
  }

  const slug = createSlug(trimmed)

  if (!slug) {
    throw new Error('Impossibile generare uno slug valido')
  }

  await connection.run(
    `INSERT INTO stato (slug, valore_stato) VALUES (?, ?)`,
    [slug, trimmed]
  )

  return { slug, valore_stato: trimmed }
}
