import type { Request, Response } from 'express'
import * as statoService from '../services/statoService'

export async function addStatus(req: Request, res: Response): Promise<void> {
  const { valore_stato } = req.body

  if (!valore_stato || typeof valore_stato !== 'string' || !valore_stato.trim()) {
    res.status(400).json({ message: 'valore_stato è obbligatorio' })
    return
  }

  const stato = await statoService.addStato(valore_stato)
  res.status(201).json(stato)
}

export async function getStati(_req: Request, res: Response): Promise<void> {
  const stati = await statoService.getAllStati()
  res.json(stati)
}
