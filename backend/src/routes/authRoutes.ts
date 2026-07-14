import { Router } from 'express'
import { loginHandler, meHandler } from '../controllers/authController'
import { loginRateLimit } from '../middleware/loginRateLimit'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.post('/login', loginRateLimit, loginHandler)
router.get('/me', requireAuth, meHandler)

export default router
