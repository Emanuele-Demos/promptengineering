import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import multer from 'multer'
import type { NextFunction, Request, Response } from 'express'
import * as taskService from '../services/taskService'
import { getParam } from '../utils/params'
import { uploadConfig } from '../config/upload.config'

export const UPLOAD_ROOT = path.join(__dirname, '../../uploads/attachments')

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const ALLOWED_EXT = /\.(pdf|jpe?g|png|webp|doc|docx|xls|xlsx)$/i

function isAllowedFile(file: Express.Multer.File): boolean {
  return ALLOWED_MIME.has(file.mimetype) || ALLOWED_EXT.test(file.originalname)
}

export const uploadAttachment = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const taskId = getParam(req.params.taskId)
      const dir = path.join(UPLOAD_ROOT, taskId)
      fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname)
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9._-]/g, '_')
      cb(null, `${randomUUID()}-${base}${ext}`)
    },
  }),
  limits: { fileSize: uploadConfig.maxFileSize, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (isAllowedFile(file)) {
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
