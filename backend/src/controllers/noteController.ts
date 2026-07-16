import type { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import * as noteService from '../services/noteService'
import { getParam } from '../utils/params'

export async function getNotes(req: Request, res: Response): Promise<void> {
  const notes = await noteService.getNotesByTaskId(getParam(req.params.taskId))
  res.json(notes)
}

export async function createNote(req: Request, res: Response): Promise<void> {
  const { content } = req.body
  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ message: 'Il contenuto della nota è obbligatorio' })
    return
  }

  const note = await noteService.createNote(
    getParam(req.params.taskId),
    content,
    randomUUID()
  )
  res.status(201).json(note)
}

export async function updateNote(req: Request, res: Response): Promise<void> {
  const { content } = req.body
  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ message: 'Il contenuto della nota è obbligatorio' })
    return
  }

  const id = getParam(req.params.id)
  const existing = await noteService.getNoteById(id)
  if (!existing) {
    res.status(404).json({ message: 'Nota non trovata' })
    return
  }

  const note = await noteService.updateNote(id, content)
  res.json(note)
}

export async function deleteNote(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id)
  const existing = await noteService.getNoteById(id)
  if (!existing) {
    res.status(404).json({ message: 'Nota non trovata' })
    return
  }

  await noteService.deleteNote(id)
  res.json({ message: 'Nota eliminata' })
}
