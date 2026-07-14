/**
 * Backend Express su porta 3001.
 * Usa URL diretto così funziona anche se Vite parte su porta diversa (5174, ecc.).
 */
import { authHeaders } from './authStorage.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const NETWORK_ERROR =
  'Impossibile contattare il server. Avvia il backend con: cd backend && npm run dev'

async function handleResponse(response) {
  let data = {}
  try {
    data = await response.json()
  } catch {
    /* risposta non JSON */
  }

  if (!response.ok) {
    throw new Error(data.message || 'Errore durante la richiesta')
  }

  return data
}

export const API_ROUTES = {
  /** Aggiunge un nuovo stato al database */
  add_status: `${API_BASE_URL}/add_status`,
  /** Restituisce la lista degli stati presenti nel database */
  get_stati: `${API_BASE_URL}/stati`,
  categories: `${API_BASE_URL}/categories`,
  category: (id) => `${API_BASE_URL}/categories/${id}`,
}

/**
 * Aggiunge un nuovo valore stato.
 * @param {string} valore_stato - Testo inserito dall'utente nel form
 * @returns {Promise<{ slug: string, valore_stato: string }>}
 */
export async function addStatus(valore_stato) {
  let response
  try {
    response = await fetch(API_ROUTES.add_status, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ valore_stato }),
    })
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  return handleResponse(response)
}

/**
 * Recupera tutti gli stati salvati nel database.
 * @returns {Promise<Array<{ slug: string, valore_stato: string }>>}
 */
export async function getStati() {
  let response
  try {
    response = await fetch(API_ROUTES.get_stati, { headers: authHeaders() })
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  return handleResponse(response)
}

export async function getCategories() {
  let response
  try {
    response = await fetch(API_ROUTES.categories, { headers: authHeaders() })
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  return handleResponse(response)
}

export async function getCategory(id) {
  let response
  try {
    response = await fetch(API_ROUTES.category(id), { headers: authHeaders() })
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  return handleResponse(response)
}

export async function createCategory({ name, color }) {
  let response
  try {
    response = await fetch(API_ROUTES.categories, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, color }),
    })
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  return handleResponse(response)
}

export async function updateCategory(id, { name, color }) {
  let response
  try {
    response = await fetch(API_ROUTES.category(id), {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, color }),
    })
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  return handleResponse(response)
}

export async function deleteCategory(id) {
  let response
  try {
    response = await fetch(API_ROUTES.category(id), {
      method: 'DELETE',
      headers: authHeaders(),
    })
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  return handleResponse(response)
}
