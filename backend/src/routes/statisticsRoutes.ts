import { Router } from 'express'
import { getStatisticsHandler } from '../controllers/statisticsController'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

router.get('/statistics', asyncHandler(getStatisticsHandler))

export default router
