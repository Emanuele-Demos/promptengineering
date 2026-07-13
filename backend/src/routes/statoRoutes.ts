import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import * as statoController from '../controllers/statoController'

const router = Router()

router.post('/add_status', asyncHandler(statoController.addStatus))
router.get('/stati', asyncHandler(statoController.getStati))

export default router
