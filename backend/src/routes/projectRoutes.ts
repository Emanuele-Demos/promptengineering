import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import * as projectController from '../controllers/projectController'

const router = Router()

router.get('/projects', asyncHandler(projectController.getProjects))
router.post('/projects', asyncHandler(projectController.createProject))
router.get('/projects/:id', asyncHandler(projectController.getProject))
router.put('/projects/:id', asyncHandler(projectController.updateProject))
router.delete('/projects/:id', asyncHandler(projectController.deleteProject))

export default router
