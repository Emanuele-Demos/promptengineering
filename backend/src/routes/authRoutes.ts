import { Router } from 'express'
import {
  loginHandler,
  registerHandler,
  meHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from '../controllers/authController'
import { loginRateLimit } from '../middleware/loginRateLimit'
import { registerRateLimit } from '../middleware/registerRateLimit'
import { forgotPasswordRateLimit } from '../middleware/forgotPasswordRateLimit'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.post('/login', loginRateLimit, loginHandler)
router.post('/register', registerRateLimit, registerHandler)
router.post('/forgot-password', forgotPasswordRateLimit, forgotPasswordHandler)
router.post('/reset-password', resetPasswordHandler)
router.get('/me', requireAuth, meHandler)

export default router
