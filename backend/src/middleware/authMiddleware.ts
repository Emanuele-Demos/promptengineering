import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../services/authService'

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token =
    typeof header === 'string' && header.startsWith('Bearer ')
      ? header.slice(7).trim()
      : ''

  if (!token) {
    res.status(401).json({ message: 'Autenticazione richiesta' })
    return
  }

  try {
    const { userId } = verifyToken(token)
    res.locals.userId = userId
    req.userId = userId
    next()
  } catch {
    res.status(401).json({ message: 'Token non valido o scaduto' })
  }
}
