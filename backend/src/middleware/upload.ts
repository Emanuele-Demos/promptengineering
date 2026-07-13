import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import multer from 'multer'
import type { NextFunction, Request, Response } from 'express'
import * as taskService from '../services/taskService'
import { getParam } from '../utils/params'

export const UPLOAD_ROOT = path.join(__dirname, '../../uploads/attachments')

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

export const uploadAttachment = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const taskId = getParam(req.params.taskId)
      const dir = path.join(UPLOAD_ROOT, taskId)
      fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
      cb(null, `${randomUUID()}-${safeName}`)
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extAllowed = /\.(doc|docx|xls|xlsx)$/i.test(file.originalname)
    if (ALLOWED_MIME.has(file.mimetype) || extAllowed) {
      cb(null, true)
      return
    }
    cb(new Error('Tipo file non supportato'))
  },
})

export async function validateTaskExists(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const task = await taskService.getTaskById(getParam(req.params.taskId))
  if (!task) {
    res.status(404).json({ message: 'Task non trovato' })
    return
  }
  next()
}

export function getAttachmentPublicPath(taskId: string, filename: string): string {
  return `/uploads/attachments/${taskId}/${filename}`
}

export function getAttachmentAbsolutePath(publicPath: string): string {
  const relative = publicPath.replace(/^\/uploads\/attachments\//, '')
  return path.join(UPLOAD_ROOT, relative)
}
