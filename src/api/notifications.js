const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const NETWORK_ERROR =
  'Impossibile contattare il server. Avvia il backend con: cd backend && npm run dev'

function getUserId() {
  return localStorage.getItem('teamflow-user-id') || 'm1'
}

function userHeaders() {
  return { 'X-User-Id': getUserId() }
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
      headers: {
        ...userHeaders(),
        ...(options.headers || {}),
      },
    })
    return handleResponse(response)
  } catch (error) {
    if (error instanceof Error && error.message) throw error
    throw new Error(NETWORK_ERROR)
  }
}

export function getCurrentUserId() {
  return getUserId()
}

export function setCurrentUserId(userId) {
  localStorage.setItem('teamflow-user-id', userId)
}

export function getNotifications(filter = 'all') {
  const params = new URLSearchParams({ userId: getUserId(), filter })
  return apiFetch(`${API_BASE_URL}/notifications?${params}`)
}

export function getUnreadNotificationCount() {
  const params = new URLSearchParams({ userId: getUserId() })
  return apiFetch(`${API_BASE_URL}/notifications/unread-count?${params}`)
}

export function markNotificationAsRead(id) {
  return apiFetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PUT' })
}

export function deleteNotification(id) {
  return apiFetch(`${API_BASE_URL}/notifications/${id}`, { method: 'DELETE' })
}
