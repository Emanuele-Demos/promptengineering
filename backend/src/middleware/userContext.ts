import type { Request, Response, NextFunction } from 'express'
import { parseMemberId } from '../utils/memberId'

export function getUserId(req: Request): number | null {
  if (typeof req.userId === 'number') {
    return req.userId
  }

  const header = req.headers['x-user-id']
  const query = req.query.userId
  const fromHeader = typeof header === 'string' ? parseMemberId(header) : null
  const fromQuery = typeof query === 'string' ? parseMemberId(query) : null
  return fromHeader ?? fromQuery
}

export function requireUserId(req: Request, res: Response, next: NextFunction): void {
  const userId =
    typeof res.locals.userId === 'number' ? res.locals.userId : getUserId(req)
  if (userId === null) {
    res.status(401).json({ message: 'Autenticazione richiesta' })
    return
  }
  res.locals.userId = userId
  req.userId = userId
  next()
}

export function getAuthenticatedUserId(req: Request, res: Response): number {
  if (typeof res.locals.userId === 'number') {
    return res.locals.userId
  }
  const userId = getUserId(req)
  if (userId !== null) {
    return userId
  }
  throw new Error('Autenticazione richiesta')
}
