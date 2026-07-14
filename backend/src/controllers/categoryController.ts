import type { Request, Response } from 'express'
import * as categoryService from '../services/categoryService'
import { getParam } from '../utils/params'
import { validateCategoryInput } from '../utils/categoryValidation'

export async function getCategories(_req: Request, res: Response): Promise<void> {
  const categories = await categoryService.getAllCategories()
  res.json(categories)
}

export async function getCategory(req: Request, res: Response): Promise<void> {
  const category = await categoryService.getCategoryById(getParam(req.params.id))
  if (!category) {
    res.status(404).json({ message: 'Categoria non trovata' })
    return
  }
  res.json(category)
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>
  validateCategoryInput(body.name, body.color)
  const category = await categoryService.createCategory({
    name: body.name as string,
    color: body.color as string,
  })
  res.status(201).json(category)
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id)
  const body = req.body as Record<string, unknown>
  validateCategoryInput(body.name, body.color)

  const existing = await categoryService.getCategoryById(id)
  if (!existing) {
    res.status(404).json({ message: 'Categoria non trovata' })
    return
  }

  const category = await categoryService.updateCategory(id, {
    name: body.name as string,
    color: body.color as string,
  })
  res.json(category)
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id)
  const existing = await categoryService.getCategoryById(id)
  if (!existing) {
    res.status(404).json({ message: 'Categoria non trovata' })
    return
  }

  await categoryService.deleteCategory(id)
  res.json({ message: 'Categoria eliminata' })
}
