import { Router } from 'express'
import * as notificationController from '../controllers/notificationController'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

router.get('/notifications/unread-count', asyncHandler(notificationController.getUnreadCount))
router.get('/notifications', asyncHandler(notificationController.getNotifications))
router.get('/notifications/:id', asyncHandler(notificationController.getNotification))
router.put('/notifications/:id/read', asyncHandler(notificationController.markAsRead))
router.delete('/notifications/:id', asyncHandler(notificationController.deleteNotification))

export default router
