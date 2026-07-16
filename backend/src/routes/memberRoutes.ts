import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { validateMemberBody } from '../middleware/validateMember'
import * as memberController from '../controllers/memberController'

const router = Router()

router.get('/', asyncHandler(memberController.getMembers))
router.get('/:id', asyncHandler(memberController.getMember))
router.post('/', validateMemberBody, asyncHandler(memberController.createMember))
router.put('/:id', validateMemberBody, asyncHandler(memberController.updateMember))
router.delete('/:id', asyncHandler(memberController.deleteMember))

export default router
