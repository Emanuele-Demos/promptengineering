import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export const getProjects = async (_req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany()

    res.json(projects)
  } catch (error) {
    console.error('ERRORE PRISMA:', error)

    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : 'Errore durante il recupero dei progetti'
    })
  }
}