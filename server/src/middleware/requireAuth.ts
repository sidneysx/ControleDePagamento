import type { NextFunction, Request, Response } from 'express'
import { SESSION_COOKIE, verifySession } from '../auth.js'

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
