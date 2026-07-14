import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { validateTaskExists } from '../middleware/upload'
import * as noteController from '../controllers/noteController'

const router = Router()

router.get(
  '/tasks/:taskId/notes',
  asyncHandler(validateTaskExists),
  asyncHandler(noteController.getNotes)
)

router.post(
  '/tasks/:taskId/notes',
  asyncHandler(validateTaskExists),
  asyncHandler(noteController.createNote)
)

router.put('/notes/:id', asyncHandler(noteController.updateNote))
router.delete('/notes/:id', asyncHandler(noteController.deleteNote))

export default router
