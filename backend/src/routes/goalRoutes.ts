import { Router } from 'express'
import * as goalController from '../controllers/goalController'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

router.get('/goals/history', asyncHandler(goalController.getGoalHistory))
router.get('/goals', asyncHandler(goalController.getGoals))
router.post('/goals', asyncHandler(goalController.createGoal))
router.get('/goals/:id', asyncHandler(goalController.getGoal))
router.put('/goals/:id', asyncHandler(goalController.updateGoal))
router.delete('/goals/:id', asyncHandler(goalController.deleteGoal))

export default router
