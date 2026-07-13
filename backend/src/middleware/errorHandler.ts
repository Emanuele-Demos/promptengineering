import type { NextFunction, Request, Response } from 'express'

export function errorHandler(
  err: Error & { code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err)

  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ message: 'File troppo grande (max 10 MB)' })
    return
  }

  if (err.message === 'Tipo file non supportato') {
    res.status(400).json({ message: err.message })
    return
  }

  if (err.message.includes('UNIQUE constraint failed')) {
    res.status(409).json({ message: 'Questo stato esiste già nel sistema' })
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
