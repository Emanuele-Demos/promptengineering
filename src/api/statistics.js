const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const NETWORK_ERROR =
  'Impossibile contattare il server. Avvia il backend con: cd backend && npm run dev'

function getUserId() {
  return localStorage.getItem('teamflow-user-id') || 'm1'
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

export function getStatistics({ filter = '7d', from, to } = {}) {
  const params = new URLSearchParams({ userId: getUserId(), filter })
  if (from) params.set('from', from)
  if (to) params.set('to', to)

  return fetch(`${API_BASE_URL}/statistics?${params}`, {
    headers: { 'X-User-Id': getUserId() },
  })
    .then(handleResponse)
    .catch((error) => {
      if (error instanceof Error && error.message) throw error
      throw new Error(NETWORK_ERROR)
    })
}
