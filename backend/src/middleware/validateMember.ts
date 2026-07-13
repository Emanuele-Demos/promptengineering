import type { NextFunction, Request, Response } from 'express'

export function validateMemberBody(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { name, email, role, color } = req.body

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ message: 'Il nome è obbligatorio' })
    return
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    res.status(400).json({ message: 'L\'email è obbligatoria' })
    return
  }

  if (!role || typeof role !== 'string' || !role.trim()) {
    res.status(400).json({ message: 'Il ruolo è obbligatorio' })
    return
  }

  if (!color || typeof color !== 'string' || !color.trim()) {
    res.status(400).json({ message: 'Il colore è obbligatorio' })
    return
  }

  next()
}
