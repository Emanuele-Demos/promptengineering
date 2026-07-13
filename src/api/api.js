/**
 * Configurazione API disponibili sul frontend.
 * Base URL del backend Express (SQLite3).
 */
const API_BASE_URL = '/api'

export const API_ROUTES = {
  /** Aggiunge un nuovo stato al database */
  add_status: `${API_BASE_URL}/add_status`,
  /** Restituisce la lista degli stati presenti nel database */
  get_stati: `${API_BASE_URL}/stati`,
}

/**
 * Aggiunge un nuovo valore stato.
 * @param {string} valore_stato - Testo inserito dall'utente nel form
 * @returns {Promise<{ slug: string, valore_stato: string }>}
 */
export async function addStatus(valore_stato) {
  const response = await fetch(API_ROUTES.add_status, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ valore_stato }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Errore durante il salvataggio')
  }

  return data
}

/**
 * Recupera tutti gli stati salvati nel database.
 * @returns {Promise<Array<{ slug: string, valore_stato: string }>>}
 */
export async function getStati() {
  const response = await fetch(API_ROUTES.get_stati)

  if (!response.ok) {
    throw new Error('Errore durante il caricamento degli stati')
  }

  return response.json()
}
