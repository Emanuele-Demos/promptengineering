import fs from 'fs'
import type { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import * as attachmentService from '../services/attachmentService'
import {
  getAttachmentAbsolutePath,
  getAttachmentPublicPath,
} from '../middleware/upload'
import { getParam } from '../utils/params'
import { isCloudinaryEnabled } from '../config/upload.config'

export async function getAttachments(req: Request, res: Response): Promise<void> {
  const attachments = await attachmentService.getAttachmentsByTaskId(getParam(req.params.taskId))
  res.json(attachments)
}

export async function uploadAttachments(req: Request, res: Response): Promise<void> {
  if (isCloudinaryEnabled()) {
    res.status(501).json({ message: 'Upload Cloudinary non ancora implementato. Usa UPLOAD_STORAGE=local.' })
    return
  }

  const files = (req.files as Express.Multer.File[] | undefined) ?? (req.file ? [req.file] : [])
  if (files.length === 0) {
    res.status(400).json({ message: 'Nessun file caricato' })
    return
  }

  const taskId = getParam(req.params.taskId)
  const now = new Date().toISOString()
  const created: Awaited<ReturnType<typeof attachmentService.addAttachment>>[] = []

  for (const file of files) {
    const attachment = await attachmentService.addAttachment(taskId, {
      id: randomUUID(),
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: getAttachmentPublicPath(taskId, file.filename),
      createdAt: now,
      updatedAt: now,
    })
    created.push(attachment)
  }

  res.status(201).json(created)
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

  res.download(absolutePath, attachment.originalName)
}

export async function openAttachment(req: Request, res: Response): Promise<void> {
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

  res.setHeader('Content-Type', attachment.mimeType)
  res.sendFile(absolutePath)
}
