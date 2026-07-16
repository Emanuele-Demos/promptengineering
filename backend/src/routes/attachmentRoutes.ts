import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { uploadAttachment, validateTaskExists } from '../middleware/upload'
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
  uploadAttachment.array('files', 10),
  asyncHandler(attachmentController.uploadAttachments)
)

router.get('/attachments/:id/download', asyncHandler(attachmentController.downloadAttachment))
router.get('/attachments/:id/open', asyncHandler(attachmentController.openAttachment))
router.delete('/attachments/:id', asyncHandler(attachmentController.deleteAttachment))

export default router
