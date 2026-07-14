import { Router } from 'express'
import memberRoutes from './memberRoutes'
import taskRoutes from './taskRoutes'
import attachmentRoutes from './attachmentRoutes'
import statoRoutes from './statoRoutes'
import noteRoutes from './noteRoutes'
import categoryRoutes from './categoryRoutes'
import notificationRoutes from './notificationRoutes'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

router.use('/members', memberRoutes)
router.use('/tasks', taskRoutes)
router.use('/', attachmentRoutes)
router.use('/', statoRoutes)
router.use('/', noteRoutes)
router.use('/', categoryRoutes)
router.use('/', notificationRoutes)

export default router
