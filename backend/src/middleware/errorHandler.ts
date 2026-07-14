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

  if (err.message.includes('FOREIGN KEY constraint failed')) {
    res.status(400).json({ message: 'Riferimento non valido' })
    return
  }

  res.status(500).json({
    message: err.message || 'Errore interno del server',
  })
}
