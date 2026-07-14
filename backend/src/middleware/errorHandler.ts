import type { NextFunction, Request, Response } from 'express'

export function errorHandler(
  err: Error & { code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err)

  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ message: `File troppo grande (max ${process.env.UPLOAD_MAX_MB || 10} MB)` })
    return
  }

  if (err.message === 'Tipo file non supportato') {
    res.status(400).json({ message: err.message })
    return
  }

  if (err.message.includes('UNIQUE constraint failed')) {
    const message = err.message.includes('categories.name')
      ? 'Esiste già una categoria con questo nome'
      : err.message.includes('stato')
        ? 'Questo stato esiste già nel sistema'
        : 'Valore già presente nel sistema'
    res.status(409).json({ message })
    return
  }

  if (
    err.message.includes('Il nome della categoria') ||
    err.message.includes('Il colore deve essere') ||
    err.message.includes('Categoria non trovata') ||
    err.message.includes('Categoria non valida')
  ) {
    res.status(400).json({ message: err.message })
    return
  }

  if (
    err.message.includes('Il promemoria') ||
    err.message.includes('Imposta una scadenza') ||
    err.message.includes('Data promemoria') ||
    err.message.includes('Notifica non trovata')
  ) {
    res.status(400).json({ message: err.message })
    return
  }

  if (err.message.includes('Non autorizzato')) {
    res.status(403).json({ message: err.message })
    return
  }

  const statusCode = (err as Error & { statusCode?: number }).statusCode
  if (statusCode === 401 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
    res.status(statusCode).json({ message: err.message })
    return
  }

  if (
    err.message.includes('Email obbligatoria') ||
    err.message.includes('Email non valida') ||
    err.message.includes('Email già registrata') ||
    err.message.includes('Username già in uso') ||
    err.message.includes('Username non valido') ||
    err.message.includes('Nome obbligatorio') ||
    err.message.includes('Cognome obbligatorio') ||
    err.message.includes('Nome non valido') ||
    err.message.includes('Cognome non valido') ||
    err.message.includes('Password obbligatoria') ||
    err.message.includes('Password non valida') ||
    err.message.includes('La password deve contenere') ||
    err.message.includes('Dati di login non validi') ||
    err.message.includes('Dati di registrazione non validi') ||
    err.message.includes('email istituzionale')
  ) {
    res.status(400).json({ message: err.message })
    return
  }

  if (
    err.message.includes('Il target deve essere') ||
    err.message.includes('Tipo obiettivo non valido') ||
    err.message.includes('Obiettivo non trovato')
  ) {
    res.status(400).json({ message: err.message })
    return
  }

  if (
    err.message.includes('Intervallo personalizzato') ||
    err.message.includes('Date non valide') ||
    err.message.includes('La data iniziale')
  ) {
    res.status(400).json({ message: err.message })
    return
  }

  if (
    err.message.includes('Tipo di ricorrenza') ||
    err.message.includes('intervallo di ricorrenza') ||
    err.message.includes('repeatEvery') ||
    err.message.includes('ricorrenza personalizzata') ||
    err.message.includes('fine ricorrenza') ||
    err.message.includes('occorrenze') ||
    err.message.includes('task ricorrente')
  ) {
    res.status(400).json({ message: err.message })
    return
  }

  if (
    err.message.includes('Il nome del progetto') ||
    err.message.includes('Proprietario non valido') ||
    err.message.includes('Progetto non trovato') ||
    err.message.includes('Progetto non valido')
  ) {
    res.status(400).json({ message: err.message })
    return
  }

  if (err.message.includes('FOREIGN KEY constraint failed')) {
    res.status(400).json({ message: 'Riferimento non valido' })
    return
  }

  res.status(500).json({
    message: err.message || 'Errore interno del server',
  })
}
