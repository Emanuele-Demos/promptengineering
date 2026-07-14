import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { validateTaskBody } from '../middleware/validateTask'
import * as taskController from '../controllers/taskController'

const router = Router()

router.get('/', asyncHandler(taskController.getTasks))
router.get('/:id/occurrences', asyncHandler(taskController.getOccurrences))
router.put('/:id/stop-recurrence', asyncHandler(taskController.stopRecurrence))
router.get('/:id', asyncHandler(taskController.getTask))
router.post('/', validateTaskBody, asyncHandler(taskController.createTask))
router.put('/:id', validateTaskBody, asyncHandler(taskController.updateTask))
router.delete('/:id', asyncHandler(taskController.deleteTask))

export default router
