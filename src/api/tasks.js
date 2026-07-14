import { authHeaders, USER_ID_KEY } from './authStorage.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '')

const NETWORK_ERROR =
  'Impossibile contattare il server. Avvia il backend con: cd backend && npm run dev'

function getUserId() {
  return localStorage.getItem(USER_ID_KEY) || ''
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
      headers: authHeaders(options.headers),
    })
    return handleResponse(response)
  } catch (error) {
    if (error instanceof Error && error.message) throw error
    throw new Error(NETWORK_ERROR)
  }
}

export function getFileUrl(path) {
  if (!path) return '#'
  if (path.startsWith('http') || path.startsWith('blob:')) return path
  return `${API_ORIGIN}${path}`
}

export function getAttachmentDownloadUrl(id) {
  return `${API_BASE_URL}/attachments/${id}/download`
}

export function getAttachmentOpenUrl(id) {
  return `${API_BASE_URL}/attachments/${id}/open`
}

export async function syncTaskStatus(taskId, status) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      headers: authHeaders(),
    })
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  if (response.ok) {
    const existing = await response.json()
    return apiFetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ...existing, status }),
    })
  }

  return null
}

export async function syncTaskFavorite(taskId, favorite) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      headers: authHeaders(),
    })
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  if (response.ok) {
    const existing = await response.json()
    return apiFetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ...existing, favorite }),
    })
  }

  return null
}

export async function getFavoriteTasks() {
  return apiFetch(`${API_BASE_URL}/tasks/favorites`, {
    headers: authHeaders(),
  })
}

export async function getEstimatedTimeStats() {
  return apiFetch(`${API_BASE_URL}/tasks/estimated-time`, {
    headers: authHeaders(),
  })
}

export async function getArchivedTasks() {
  return apiFetch(`${API_BASE_URL}/tasks/archived`, {
    headers: authHeaders(),
  })
}

export async function archiveTaskApi(taskId) {
  return apiFetch(`${API_BASE_URL}/tasks/${taskId}/archive`, {
    method: 'PUT',
    headers: authHeaders(),
  })
}

export async function restoreTaskApi(taskId) {
  return apiFetch(`${API_BASE_URL}/tasks/${taskId}/restore`, {
    method: 'PUT',
    headers: authHeaders(),
  })
}

export async function deleteTaskPermanent(taskId) {
  return apiFetch(`${API_BASE_URL}/tasks/${taskId}/permanent`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export async function getTasks(params = {}) {
  const search = new URLSearchParams()
  if (params.favorite === true) search.set('favorite', 'true')
  if (params.assigneeId) search.set('assigneeId', params.assigneeId)
  const query = search.toString()
  const url = query ? `${API_BASE_URL}/tasks?${query}` : `${API_BASE_URL}/tasks`
  return apiFetch(url, { headers: authHeaders() })
}

export async function upsertTask(task) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
      headers: authHeaders(),
    })
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  if (response.ok) {
    return apiFetch(`${API_BASE_URL}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    })
  }

  return apiFetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })
}

export async function getTaskNotes(taskId) {
  return apiFetch(`${API_BASE_URL}/tasks/${taskId}/notes`)
}

export async function createTaskNote(taskId, content) {
  return apiFetch(`${API_BASE_URL}/tasks/${taskId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function updateTaskNote(noteId, content) {
  return apiFetch(`${API_BASE_URL}/notes/${noteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function deleteTaskNote(noteId) {
  return apiFetch(`${API_BASE_URL}/notes/${noteId}`, { method: 'DELETE' })
}

export async function getTaskAttachments(taskId) {
  return apiFetch(`${API_BASE_URL}/tasks/${taskId}/attachments`)
}

export async function uploadTaskAttachments(taskId, files) {
  const formData = new FormData()
  for (const file of files) {
    formData.append('files', file)
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    })
    return handleResponse(response)
  } catch {
    throw new Error(NETWORK_ERROR)
  }
}

export async function deleteTaskAttachment(id) {
  return apiFetch(`${API_BASE_URL}/attachments/${id}`, { method: 'DELETE' })
}

export async function getTaskOccurrences(taskId) {
  return apiFetch(`${API_BASE_URL}/tasks/${taskId}/occurrences`)
}

export async function stopTaskRecurrence(taskId, mode) {
  return apiFetch(`${API_BASE_URL}/tasks/${taskId}/stop-recurrence`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  })
}
