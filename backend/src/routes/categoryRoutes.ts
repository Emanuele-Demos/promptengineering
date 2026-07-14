import { Router } from 'express'
import * as categoryController from '../controllers/categoryController'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

router.get('/categories', asyncHandler(categoryController.getCategories))
router.post('/categories', asyncHandler(categoryController.createCategory))
router.get('/categories/:id', asyncHandler(categoryController.getCategory))
router.put('/categories/:id', asyncHandler(categoryController.updateCategory))
router.delete('/categories/:id', asyncHandler(categoryController.deleteCategory))

export default router
