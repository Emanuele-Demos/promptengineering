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
    const error = new Error(data.message || 'Errore durante la richiesta')
    error.status = response.status
    throw error
  }

  return data
}

export async function login({ email, password, rememberMe = false }) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
    })
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  return handleResponse(response)
}

export async function fetchCurrentUser(token) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  return handleResponse(response)
}
