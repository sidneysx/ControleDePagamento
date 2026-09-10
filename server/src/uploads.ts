import { randomUUID } from 'crypto'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import multer from 'multer'

export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads')

if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${randomUUID()}${ext}`)
  },
})

export const uploadNotaArquivos = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Apenas arquivos PDF são permitidos.'))
      return
    }
    cb(null, true)
  },
}).fields([
  { name: 'boleto_arquivo', maxCount: 1 },
  { name: 'nota_fiscal_arquivo', maxCount: 1 },
])
