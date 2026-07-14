import type { Request, Response, NextFunction } from 'express'
import { login, getAuthUserById } from '../services/authService'
import { validateLoginInput } from '../validators/authValidator'

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validateLoginInput(req.body)
    const result = await login(input.email, input.password, input.rememberMe)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function meHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = res.locals.userId as string
    const user = await getAuthUserById(userId)
    if (!user) {
      res.status(404).json({ message: 'Utente non trovato' })
      return
    }
    res.json({ user })
  } catch (error) {
    next(error)
  }
}
