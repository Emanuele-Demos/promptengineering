import type { Request, Response, NextFunction } from 'express'

const DEFAULT_USER_ID = 'm1'

export function getUserId(req: Request): string {
  const header = req.headers['x-user-id']
  const query = req.query.userId
  const fromHeader = typeof header === 'string' ? header.trim() : ''
  const fromQuery = typeof query === 'string' ? query.trim() : ''
  return fromHeader || fromQuery || DEFAULT_USER_ID
}

export function requireUserId(req: Request, res: Response, next: NextFunction): void {
  const userId = getUserId(req)
  if (!userId) {
    res.status(400).json({ message: 'userId obbligatorio' })
    return
  }
  res.locals.userId = userId
  next()
}
