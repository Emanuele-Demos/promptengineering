import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import {
  uploadAttachment,
  validateTaskExists,
} from '../middleware/upload'
import * as attachmentController from '../controllers/attachmentController'

const router = Router()

router.get(
  '/tasks/:taskId/attachments',
  asyncHandler(validateTaskExists),
  asyncHandler(attachmentController.getAttachments)
)

router.post(
  '/tasks/:taskId/attachments',
  asyncHandler(validateTaskExists),
  uploadAttachment.single('file'),
  asyncHandler(attachmentController.uploadAttachment)
)

router.get('/attachments/:id/download', asyncHandler(attachmentController.downloadAttachment))
router.delete('/attachments/:id', asyncHandler(attachmentController.deleteAttachment))

export default router
