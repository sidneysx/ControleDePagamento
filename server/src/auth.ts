import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET
if (!secret) {
  throw new Error('JWT_SECRET is not set')
}
const JWT_SECRET: string = secret

export const SESSION_COOKIE = 'session'

export type SessionPayload = {
  userId: number
}

export function signSession(payload: SessionPayload, expiresIn: `${number}d` = '1d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, JWT_SECRET) as SessionPayload
}
