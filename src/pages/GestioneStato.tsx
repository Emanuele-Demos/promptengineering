import { useCallback, useEffect, useState } from 'react'
import { ListChecks, Plus } from 'lucide-react'

interface Stato {
  slug: string
  valore_stato: string
}

export function GestioneStato() {
  const [valoreStato, setValoreStato] = useState('')
  const [stati, setStati] = useState<Stato[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStati = useCallback(async () => {
    try {
      const res = await fetch('/api/get_stati')
      if (!res.ok) throw new Error('Caricamento fallito')
      const data = (await res.json()) as Stato[]
      setStati(data)
    } catch {
      setError('Impossibile caricare gli stati')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStati()
  }, [fetchStati])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valoreStato.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/add_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valore_stato: valoreStato.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Errore durante il salvataggio')
        return
      }

      setValoreStato('')
      await fetchStati()
    } catch {
      setError('Errore di connessione al server')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto w-full">
      <header className="mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Gestione Stato
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Aggiungi e visualizza gli stati disponibili nel sistema
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-4"
      >
        <div>
          <label
            htmlFor="valore_stato"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Valore stato
          </label>
          <input
            id="valore_stato"
            type="text"
            value={valoreStato}
            onChange={(e) => setValoreStato(e.target.value)}
            placeholder="es. da fare subito"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !valoreStato.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {submitting ? 'Salvataggio...' : 'Aggiungi valore'}
        </button>
      </form>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
          <ListChecks className="w-5 h-5 text-indigo-600" />
          Stati presenti nel database
        </h2>

        {loading ? (
          <p className="text-sm text-slate-500">Caricamento...</p>
        ) : stati.length === 0 ? (
          <p className="text-sm text-slate-500">Nessuno stato presente.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {stati.map((stato) => (
              <li
                key={stato.slug}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <span className="text-sm font-medium text-slate-900">
                  {stato.valore_stato}
                </span>
                <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded">
                  {stato.slug}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
