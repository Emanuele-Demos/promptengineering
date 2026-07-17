import fs from 'fs'
import path from 'path'
import multer from 'multer'
import type { Request } from 'express'

export const AVATAR_ROOT = path.join(__dirname, '../../uploads/avatars')

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i
const MAX_FILE_SIZE = 2 * 1024 * 1024

function isAllowedImage(file: Express.Multer.File): boolean {
  return ALLOWED_MIME.has(file.mimetype) || ALLOWED_EXT.test(file.originalname)
}

export function getAvatarPublicPath(memberId: number, filename: string): string {
  return `/uploads/avatars/${filename}`
}

export function getAvatarAbsolutePath(publicPath: string): string {
  const relative = publicPath.replace(/^\/uploads\/avatars\//, '')
  return path.join(AVATAR_ROOT, relative)
}

export const uploadAvatar = multer({
  storage: multer.diskStorage({
    destination: (req: Request, _file, cb) => {
      fs.mkdirSync(AVATAR_ROOT, { recursive: true })
      cb(null, AVATAR_ROOT)
    },
    filename: (req: Request, file, cb) => {
      const memberId = req.userId
      if (memberId === undefined) {
        cb(new Error('Utente non autenticato'), '')
        return
      }
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
      cb(null, `member-${memberId}${ext}`)
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (isAllowedImage(file)) {
      cb(null, true)
      return
    }
    cb(new Error('Formato immagine non supportato. Usa JPG, PNG o WebP.'))
  },
})
