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

async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: authHeaders({
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      }),
    })
    return handleResponse(response)
  } catch (error) {
    if (error instanceof Error && error.message) throw error
    throw new Error(NETWORK_ERROR)
  }
}

export function getMembers() {
  return apiFetch(`${API_BASE_URL}/members`)
}

export function getMember(id) {
  return apiFetch(`${API_BASE_URL}/members/${id}`)
}

export function createMember({ name, email, role, color }) {
  return apiFetch(`${API_BASE_URL}/members`, {
    method: 'POST',
    body: JSON.stringify({ name, email, role, color }),
  })
}

export function updateMember(id, { name, email, role, color }) {
  return apiFetch(`${API_BASE_URL}/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, email, role, color }),
  })
}

export function deleteMember(id) {
  return apiFetch(`${API_BASE_URL}/members/${id}`, { method: 'DELETE' })
}
