# Como Executar o Sistema Jurídico SaaS

## Pré-requisitos
- Node.js 18+ instalado
- Docker Desktop instalado e rodando
- Git (opcional)

---

## 1. Iniciar a infraestrutura (Docker)

```powershell
# Na raiz do projeto (App_Advogados/)
docker-compose up -d postgres redis minio
```

Aguarde os serviços subirem (~30 segundos). Você pode verificar com:
```powershell
docker-compose ps
```

---

## 2. Configurar o Backend

```powershell
cd backend

# Copiar variáveis de ambiente
copy .env.example .env

# (Opcional) Adicionar sua chave da API Gemini no arquivo .env:
# GEMINI_API_KEY=sua_chave_aqui

# Gerar o cliente Prisma
npx prisma generate

# Criar as tabelas no banco
npx prisma db push

# Popular banco com dados iniciais (planos + usuários demo)
node src/database/seeds/index.js

# Iniciar o servidor de desenvolvimento
npm run dev
```

O backend estará disponível em: **http://localhost:3001**
Documentação API (Swagger): **http://localhost:3001/docs**

---

## 3. Configurar o Frontend

```powershell
# Em outro terminal
cd frontend

# Iniciar o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em: **http://localhost:3000**

---

## Credenciais de Acesso

| Usuário | Email | Senha |
|---------|-------|-------|
| Super Admin | admin@juridicosaas.com.br | Admin@123 |
| Admin Demo | joao@escritoriodemo.com.br | Admin@123 |

---

## Módulos disponíveis no sistema

| Módulo | URL |
|--------|-----|
| Dashboard | / |
| Processos | /processos |
| Clientes | /clientes |
| Agenda | /agenda |
| Financeiro | /financeiro |
| Documentos | /documentos |
| Diligências | /diligencias |
| Assistente IA | /ia |
| Jurimetria | /jurimetria |
| Usuários | /usuarios |
| Configurações | /configuracoes |
| Super Admin | /super-admin |
| Portal Cliente | /portal-cliente |

---

## APIs de Tribunais

O sistema já está integrado com:
- **DataJud (CNJ)** — API pública, funciona sem chave
- TJSP, TRF 1-6, TRT (via DataJud)

Monitoramento automático de processos roda a cada **30 minutos**.

---

## Configurar IA (opcional)

1. Acesse: https://aistudio.google.com/app/apikey
2. Crie uma chave gratuita
3. Edite o arquivo `backend/.env`:
   ```
   GEMINI_API_KEY=sua_chave_aqui
   ```
4. Reinicie o backend

---

## Painel MinIO (Storage de Documentos)

Acesse: **http://localhost:9001**
- Usuário: `minio_admin`
- Senha: `minio_pass_2024`

---

## Produção

Para deploy em produção:
```powershell
# Build do frontend
cd frontend; npm run build

# Iniciar todos os serviços via Docker
docker-compose up -d
```

Recomendado usar nginx como proxy reverso na frente do backend e para servir o frontend.
