import { Router } from 'express'
import { loginHandler, registerHandler, meHandler } from '../controllers/authController'
import { loginRateLimit } from '../middleware/loginRateLimit'
import { registerRateLimit } from '../middleware/registerRateLimit'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.post('/login', loginRateLimit, loginHandler)
router.post('/register', registerRateLimit, registerHandler)
router.get('/me', requireAuth, meHandler)

export default router
