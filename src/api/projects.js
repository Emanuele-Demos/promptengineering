import { authHeaders, USER_ID_KEY } from './authStorage.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const NETWORK_ERROR =
  'Impossibile contattare il server. Avvia il backend con: cd backend && npm run dev'

function getUserId() {
  return localStorage.getItem(USER_ID_KEY) || ''
}

function userHeaders() {
  return authHeaders({ 'Content-Type': 'application/json' })
}

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
      headers: { ...userHeaders(), ...(options.headers || {}) },
    })
    return handleResponse(response)
  } catch (error) {
    if (error instanceof Error && error.message) throw error
    throw new Error(NETWORK_ERROR)
  }
}

export function getProjects(search) {
  const params = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiFetch(`${API_BASE_URL}/projects${params}`)
}

export function getProject(id) {
  return apiFetch(`${API_BASE_URL}/projects/${id}`)
}

export function createProject({ name, description }) {
  return apiFetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
}

export function updateProject(id, { name, description }) {
  return apiFetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, description }),
  })
}

export function deleteProject(id) {
  return apiFetch(`${API_BASE_URL}/projects/${id}`, { method: 'DELETE' })
}
