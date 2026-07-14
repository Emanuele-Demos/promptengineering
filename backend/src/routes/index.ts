import { Router } from 'express'
import authRoutes from './authRoutes'
import { requireAuth } from '../middleware/authMiddleware'
import memberRoutes from './memberRoutes'
import taskRoutes from './taskRoutes'
import attachmentRoutes from './attachmentRoutes'
import statoRoutes from './statoRoutes'
import noteRoutes from './noteRoutes'
import categoryRoutes from './categoryRoutes'
import notificationRoutes from './notificationRoutes'
import goalRoutes from './goalRoutes'
import statisticsRoutes from './statisticsRoutes'
import projectRoutes from './projectRoutes'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

router.use('/auth', authRoutes)

router.use(requireAuth)

router.use('/members', memberRoutes)
router.use('/tasks', taskRoutes)
router.use('/', attachmentRoutes)
router.use('/', statoRoutes)
router.use('/', noteRoutes)
router.use('/', categoryRoutes)
router.use('/', notificationRoutes)
router.use('/', goalRoutes)
router.use('/', statisticsRoutes)
router.use('/', projectRoutes)

export default router
