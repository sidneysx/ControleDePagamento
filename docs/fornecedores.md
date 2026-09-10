# Módulo de Fornecedores

## Objetivo

Criar uma tela moderna, intuitiva e otimizada para gerenciamento de fornecedores, seguindo o padrão visual do sistema DPL Construções.

## Tela Principal

A tela principal deve exibir uma tabela limpa e responsiva contendo apenas as informações essenciais.

### Colunas

- CPF/CNPJ
- Razão Social
- Cidade
- UF
- Dados Bancários (botão "Visualizar")
- Ações

Cada registro deverá possuir:

- 👁️ Visualizar
- ✏️ Editar
- 🗑️ Excluir

Os botões devem utilizar apenas ícones com tooltip para deixar a interface mais limpa.

## Modal de Visualização

Ao clicar em "Dados Bancários" ou "Visualizar", abrir um modal contendo todas as informações do fornecedor.

### Dados Gerais

- CPF/CNPJ
- Razão Social
- Nome do Favorecido
- Cidade
- UF

### Dados Bancários

- Banco
- Agência
- Conta
- Tipo da Conta
  - Corrente
  - Poupança

### Dados PIX

- Favorecido PIX
- CPF/CNPJ PIX
- Tipo da Chave (exemplos: CPF, CNPJ, E-mail, Celular, Chave Aleatória)
- Chave PIX

## Cadastro / Edição

Ao cadastrar ou editar um fornecedor, organizar o formulário em seções para facilitar o preenchimento.

### Dados do Fornecedor

- CPF/CNPJ *
- Razão Social *
- Favorecido *
- Cidade *
- UF *

### Dados Bancários (opcional)

- Banco
- Agência
- Conta
- Tipo da Conta (selecionar entre: Corrente, Poupança)

### Dados PIX (opcional)

- Favorecido PIX
- CPF/CNPJ PIX
- Tipo da Chave
- Chave PIX

Campos marcados com `*` são obrigatórios. Dados Bancários e Dados PIX são ambos opcionais no cadastro do fornecedor — existem fornecedores pagos via boleto, e a forma de pagamento é escolhida futuramente no lançamento da nota fiscal.

## Pesquisa

Adicionar pesquisa em tempo real por:

- CPF/CNPJ
- Razão Social
- Cidade

## Filtros

Adicionar filtros rápidos:

- Estado (UF)
- Cidade
- Banco

## Ordenação

Permitir ordenar por:

- Razão Social
- Cidade
- Estado
- Data de Cadastro

## Paginação

Adicionar paginação com opções de 10, 20, 50 ou 100 registros por página.

## Layout da Tabela

A tabela deve seguir um padrão moderno utilizando:

- Linhas compactas
- Hover destacado
- Ícones minimalistas
- Cantos arredondados
- Cabeçalho fixo durante a rolagem
- Responsividade para notebooks e monitores ultrawide

## Experiência do Usuário

- Pesquisa instantânea sem recarregar a página
- Modal com animação suave
- Confirmação antes de excluir um fornecedor
- Feedback visual para cadastro, edição e exclusão
- Loading com skeleton enquanto os dados são carregados
- Estados para lista vazia ("Nenhum fornecedor encontrado")

## Tecnologias

- React + Vite
- Tailwind CSS
- Componentes reutilizáveis
- Modal reutilizável
- Tabela responsiva
- Código organizado e escalável
