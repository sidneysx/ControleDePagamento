import { Router } from 'express'
import { centrosCusto } from '../centrosCusto.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const centrosCustoRouter = Router()
centrosCustoRouter.use(requireAuth)

centrosCustoRouter.get('/', (_req, res) => {
  res.json({ data: centrosCusto })
})
