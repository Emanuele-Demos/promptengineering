import fs from 'fs'
import type { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import * as attachmentService from '../services/attachmentService'
import {
  getAttachmentAbsolutePath,
  getAttachmentPublicPath,
} from '../middleware/upload'
import { getParam } from '../utils/params'
export async function getAttachments(req: Request, res: Response): Promise<void> {
  const attachments = await attachmentService.getAttachmentsByTaskId(getParam(req.params.taskId))
  res.json(attachments)
}

export async function uploadAttachment(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ message: 'Nessun file caricato' })
    return
  }

  const taskId = getParam(req.params.taskId)
  const publicPath = getAttachmentPublicPath(taskId, req.file.filename)

  const attachment = await attachmentService.addAttachment(taskId, {
    id: randomUUID(),
    fileName: req.file.originalname,
    path: publicPath,
    type: req.file.mimetype,
    size: req.file.size,
  })

  res.status(201).json(attachment)
}

export async function deleteAttachment(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id)
  const attachment = await attachmentService.getAttachmentById(id)
  if (!attachment) {
    res.status(404).json({ message: 'Allegato non trovato' })
    return
  }

  const absolutePath = getAttachmentAbsolutePath(attachment.path)
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath)
  }

  await attachmentService.deleteAttachment(id)
  res.json({ message: 'Allegato eliminato' })
}

export async function downloadAttachment(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id)
  const attachment = await attachmentService.getAttachmentById(id)
  if (!attachment) {
    res.status(404).json({ message: 'Allegato non trovato' })
    return
  }

  const absolutePath = getAttachmentAbsolutePath(attachment.path)
  if (!fs.existsSync(absolutePath)) {
    res.status(404).json({ message: 'File non trovato sul server' })
    return
  }

  res.download(absolutePath, attachment.fileName)
}