import 'dotenv/config'
import { pool } from './db.js'

const sql = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    regional TEXT NOT NULL,
    seccional TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS fornecedores (
    id SERIAL PRIMARY KEY,
    cpf_cnpj TEXT NOT NULL UNIQUE,
    razao_social TEXT NOT NULL,
    favorecido TEXT NOT NULL,
    cidade TEXT NOT NULL,
    uf CHAR(2) NOT NULL,
    banco TEXT,
    agencia TEXT,
    conta TEXT,
    tipo_conta TEXT CHECK (tipo_conta IN ('corrente', 'poupanca')),
    pix_favorecido TEXT,
    pix_cpf_cnpj TEXT,
    pix_tipo_chave TEXT,
    pix_chave TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- ensure existing installations get the new column
  ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

  CREATE TABLE IF NOT EXISTS notas_fiscais (
    id SERIAL PRIMARY KEY,
    numero TEXT NOT NULL,
    fornecedor_id INTEGER NOT NULL REFERENCES fornecedores(id) ON DELETE RESTRICT,
    valor NUMERIC(12,2) NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS regionais (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS seccionais (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    regional_id INTEGER NOT NULL REFERENCES regionais(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (regional_id, nome)
  );

  -- notas fiscais ganharam campos de operação/regional/seccional/localização;
  -- fornecedor e valor ficam opcionais até serem incorporados ao formulário
  ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS operacao TEXT;
  ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS regional TEXT;
  ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS seccional TEXT;
  ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS cidade TEXT;
  ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS uf CHAR(2);
  ALTER TABLE notas_fiscais ALTER COLUMN fornecedor_id DROP NOT NULL;
  ALTER TABLE notas_fiscais ALTER COLUMN valor DROP NOT NULL;

  -- seccional passou a pertencer a uma regional; ajusta instalações criadas antes desse vínculo
  ALTER TABLE seccionais ADD COLUMN IF NOT EXISTS regional_id INTEGER REFERENCES regionais(id) ON DELETE CASCADE;
  ALTER TABLE seccionais DROP CONSTRAINT IF EXISTS seccionais_nome_key;
  ALTER TABLE seccionais DROP CONSTRAINT IF EXISTS seccionais_regional_id_nome_key;
  ALTER TABLE seccionais ADD CONSTRAINT seccionais_regional_id_nome_key UNIQUE (regional_id, nome);
  ALTER TABLE seccionais ALTER COLUMN regional_id SET NOT NULL;

  -- dados do fornecedor/nota vinculados ao lançamento
  ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS numero_nota TEXT;
  ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS data_emissao DATE;
  ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS placa TEXT;
  ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS descricao TEXT;
  ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS contrato TEXT;
  ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS centro_custo TEXT;
  ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS categoria TEXT;
  ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS observacao TEXT;
`

async function main() {
  await pool.query(sql)
  console.log('Migration applied: users and fornecedores tables ready.')
  await pool.end()
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
