import type { Request, Response } from 'express'
import * as memberService from '../services/memberService'
import { getParam } from '../utils/params'
import { parseMemberId } from '../utils/memberId'

export async function getMembers(_req: Request, res: Response): Promise<void> {
  const members = await memberService.getAllMembers()
  res.json(members)
}

export async function getMember(req: Request, res: Response): Promise<void> {
  const id = parseMemberId(req.params.id)
  if (id === null) {
    res.status(400).json({ message: 'ID membro non valido' })
    return
  }

  const member = await memberService.getMemberById(id)
  if (!member) {
    res.status(404).json({ message: 'Membro non trovato' })
    return
  }
  res.json(member)
}

export async function createMember(req: Request, res: Response): Promise<void> {
  const member = await memberService.createMember({
    name: req.body.name.trim(),
    email: req.body.email.trim(),
    role: req.body.role.trim(),
    color: req.body.color.trim(),
  })

  res.status(201).json(member)
}

export async function updateMember(req: Request, res: Response): Promise<void> {
  const id = parseMemberId(req.params.id)
  if (id === null) {
    res.status(400).json({ message: 'ID membro non valido' })
    return
  }

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
  const id = parseMemberId(req.params.id)
  if (id === null) {
    res.status(400).json({ message: 'ID membro non valido' })
    return
  }

  const existing = await memberService.getMemberById(id)
  if (!existing) {
    res.status(404).json({ message: 'Membro non trovato' })
    return
  }

  await memberService.deleteMember(id)
  res.json({ message: 'Membro eliminato' })
}
