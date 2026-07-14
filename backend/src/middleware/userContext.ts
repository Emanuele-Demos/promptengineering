import type { Request, Response, NextFunction } from 'express'

export function getUserId(req: Request): string {
  if (req.userId) {
    return req.userId
  }

  const header = req.headers['x-user-id']
  const query = req.query.userId
  const fromHeader = typeof header === 'string' ? header.trim() : ''
  const fromQuery = typeof query === 'string' ? query.trim() : ''
  return fromHeader || fromQuery
}

export function requireUserId(req: Request, res: Response, next: NextFunction): void {
  const userId = res.locals.userId || getUserId(req)
  if (!userId) {
    res.status(401).json({ message: 'Autenticazione richiesta' })
    return
  }
  res.locals.userId = userId
  next()
}
