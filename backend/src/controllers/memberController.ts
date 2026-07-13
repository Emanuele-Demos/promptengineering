import type { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import * as memberService from '../services/memberService'
import { getParam } from '../utils/params'

export async function getMembers(_req: Request, res: Response): Promise<void> {
  const members = await memberService.getAllMembers()
  res.json(members)
}

export async function getMember(req: Request, res: Response): Promise<void> {
  const member = await memberService.getMemberById(getParam(req.params.id))
  if (!member) {
    res.status(404).json({ message: 'Membro non trovato' })
    return
  }
  res.json(member)
}

export async function createMember(req: Request, res: Response): Promise<void> {
  const member = {
    id: randomUUID(),
    name: req.body.name.trim(),
    email: req.body.email.trim(),
    role: req.body.role.trim(),
    color: req.body.color.trim(),
  }

  await memberService.createMember(member)
  res.status(201).json(member)
}

export async function updateMember(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id)
  const existing = await memberService.getMemberById(id)
  if (!existing) {
    res.status(404).json({ message: 'Membro non trovato' })
    return
  }

  await memberService.updateMember(id, {
    name: req.body.name?.trim() ?? existing.name,
    email: req.body.email?.trim() ?? existing.email,
    role: req.body.role?.trim() ?? existing.role,
    color: req.body.color?.trim() ?? existing.color,
  })

  const updated = await memberService.getMemberById(id)
  res.json(updated)
}

export async function deleteMember(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id)
  const existing = await memberService.getMemberById(id)
  if (!existing) {
    res.status(404).json({ message: 'Membro non trovato' })
    return
  }

  await memberService.deleteMember(id)
  res.json({ message: 'Membro eliminato' })
}
