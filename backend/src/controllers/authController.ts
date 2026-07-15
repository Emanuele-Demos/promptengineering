import type { Request, Response, NextFunction } from 'express'
import { login, register, getAuthUserById } from '../services/authService'
import { validateLoginInput } from '../validators/authValidator'
import { validateRegisterInput } from '../validators/registerValidator'

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validateLoginInput(req.body)
    const result = await login(input.email, input.password, input.rememberMe)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = validateRegisterInput(req.body)
    const result = await register(input)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export async function meHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = res.locals.userId as number
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
