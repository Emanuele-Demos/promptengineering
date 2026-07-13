import { useCallback, useEffect, useState } from 'react'
import { ListChecks, Plus } from 'lucide-react'
import { addStatus, getStati } from '../api/api.js'

export function GestioneStato() {
  const [valoreStato, setValoreStato] = useState('')
  const [stati, setStati] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadStati = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getStati()
      setStati(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStati()
  }, [loadStati])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!valoreStato.trim()) {
      setError('Inserisci un valore stato')
      return
    }

    setSubmitting(true)
    try {
      await addStatus(valoreStato.trim())
      setValoreStato('')
      setSuccess('Stato aggiunto con successo')
      await loadStati()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <ListChecks className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Gestione Stato</h1>
        </div>
        <p className="text-sm text-slate-500">
          Aggiungi nuovi stati al sistema. Lo slug viene calcolato automaticamente dal valore inserito.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 mb-8"
      >
        <div>
          <label
            htmlFor="valore_stato"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Valore stato
          </label>
          <input
            id="valore_stato"
            type="text"
            value={valoreStato}
            onChange={(e) => setValoreStato(e.target.value)}
            placeholder="Es. In revisione"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          {submitting ? 'Salvataggio...' : 'Aggiungi valore'}
        </button>
      </form>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Stati presenti ({stati.length})
        </h2>

        {loading ? (
          <p className="text-sm text-slate-500">Caricamento...</p>
        ) : stati.length === 0 ? (
          <p className="text-sm text-slate-500">Nessuno stato presente nel database.</p>
        ) : (
          <ul className="space-y-2">
            {stati.map((stato) => (
              <li
                key={stato.slug}
                className="flex items-center justify-between gap-3 p-3 border border-slate-100 rounded-lg bg-slate-50"
              >
                <span className="text-sm font-medium text-slate-800">
                  {stato.valore_stato}
                </span>
                <code className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded">
                  {stato.slug}
                </code>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
