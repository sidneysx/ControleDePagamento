import type { NextFunction, Request, Response } from 'express'
import { SESSION_COOKIE, verifySession } from '../auth.js'
import { pool } from '../db.js'

declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE]
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  try {
    const { userId } = verifySession(token)
    req.userId = userId
    next()
  } catch {
    res.status(401).json({ error: 'Not authenticated' })
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const result = await pool.query<{ role: string }>('SELECT role FROM users WHERE id = $1', [req.userId])
  if (result.rows[0]?.role !== 'adm') {
    res.status(403).json({ error: 'Apenas administradores podem acessar este recurso.' })
    return
  }
  next()
}
