# NeuroGuia

Assistente educacional com avatar interativo **OWL** desenvolvido para apoiar estudantes neurodivergentes do PPGEC/UPE. O projeto é composto por um **frontend em Next.js** (React + TypeScript) e um **backend em Python** (FastAPI) que se comunicam via API REST com streaming Server-Sent Events (SSE).

## Arquitetura

```
NeuroGuia
├── frontend (Next.js 15 + React 19 + TypeScript + Tailwind CSS 4)
│   └── runs at http://localhost:3000
├── backend (FastAPI + Python)
│   └── runs at http://localhost:8000
└── scripts de automação (PowerShell)
    ├── start.ps1  — inicia backend + frontend
    ├── stop.ps1   — encerra ambos
    └── restart.ps1 — reinicia
```

## Pré-requisitos

- **Node.js** 18 ou superior ([download](https://nodejs.org/))
- **Python** 3.9 ou superior ([download](https://www.python.org/))
- **Git** para clonar o repositório

### Windows PowerShell (opcional, para scripts de automação)

Os scripts `.ps1` facilitam iniciar/parar o projeto. Se estiver usando PowerShell no Windows, certifique-se de permitir execução de scripts:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Instalação

### 1. Clone o repositório

```bash
git clone <URL-do-repositorio-no-GitHub>
cd NeuroGuia
```

### 2. Setup do Backend (FastAPI)

```bash
cd backend

# Crie um ambiente virtual
python -m venv venv

# Ative o ambiente (Windows)
venv\Scripts\activate
# ou no macOS/Linux
source venv/bin/activate

# Instale dependências
pip install -r requirements.txt

# Copie o arquivo de configuração (se necessário)
copy config.json.example config.json  # ou cp no macOS/Linux
```

**Variáveis de ambiente:** Crie um arquivo `.env` na pasta `backend/` com as chaves necessárias (ex: Google Gemini API):

```env
GOOGLE_API_KEY=your_api_key_here
```

#### Como gerar uma Google Gemini API Key

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Clique em **"Create API Key"**
3. Escolha **"Create API key in new project"** ou use um projeto existente
4. Copie a chave gerada
5. Cole no arquivo `.env` como `GOOGLE_API_KEY=sua_chave_aqui`

> **Nota:** A chave é gratuita para desenvolvimento. Verifique a [documentação oficial](https://ai.google.dev/) para limites de quotas e planos pagos.

### 3. Crie o usuário admin inicial

```bash
# Na pasta backend (ambiente virtual ativado)
python seed_admin.py
```

Isso criará um usuário admin. Você será solicitado a fornecer:
- **Username** (padrão: `admin`)
- **Senha** (será solicitada de forma segura)

> Guarde essas credenciais — serão usadas para acessar o sistema no login.

### 4. Setup do Frontend (Next.js)

```bash
# Volta à raiz do projeto
cd ..

# Instale dependências Node.js
npm install
```

## Como Executar

### Opção 1: Scripts PowerShell (Windows — recomendado)

```powershell
# Inicia backend + frontend em paralelo
.\start.ps1

# Para encerrar
.\stop.ps1

# Para reiniciar
.\restart.ps1
```

### Opção 2: Manual (qualquer SO)

**Terminal 1 — Backend:**

```bash
cd backend
# Ative o ambiente virtual (see Instalação)
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend:**

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador. O backend estará disponível em [http://localhost:8000](http://localhost:8000).

### Passo final: Ingerir documentos educacionais

O sistema vem com o banco de dados vetorial vazio. Para usar o chatbot com conteúdo educacional:

1. Acesse [http://localhost:3000](http://localhost:3000) e faça login com suas credenciais
2. Vá para a seção **"Ingest de Documentos"** (painel admin)
3. Upload de arquivos suportados:
   - **PDF** (.pdf)
   - **Texto plano** (.txt)
   - **Word** (.docx)
4. O sistema processa, particiona em chunks e cria embeddings automaticamente
5. Os documentos estarão disponíveis para o RAG (Retrieval-Augmented Generation) do chatbot

> **Limite:** máximo 20 MB por arquivo. Limite de quotas do Google Gemini: verificar [Google AI Studio](https://aistudio.google.com/app/apikey).

## Scripts disponíveis

### Frontend

```bash
npm run dev      # Inicia dev server (hot reload)
npm run build    # Build de produção
npm run lint     # ESLint
npm test         # Jest
```

### Backend

```bash
python -m uvicorn main:app --reload  # Dev server com auto-reload
python -m pytest backend/tests/       # Rodar testes
```

## Funcionalidades

- **Chat interativo** — interface com histórico de mensagens
- **Avatar OWL** — expressões faciais dinâmicas (neutral, happy, encouraging, empathetic, thoughtful)
- **Movimentação do avatar** — estados de repouso, comunicação e pensamento (idle, talking, thinking)
- **Autenticação** — login e gerenciamento de usuários
- **Feedback** — coleta de feedback do usuário
- **Ingest de documentos** — upload e processamento de materiais educacionais
- **Acessibilidade** — fonte Atkinson Hyperlegible, respeita `prefers-reduced-motion`

## Estrutura do projeto

```
NeuroGuia/
├── src/                          # Frontend (Next.js)
│   ├── app/                      # Páginas (chat, login, feedback, ingest)
│   ├── components/               # Componentes React (ChatInput, EmotionControls, AppHeader, etc)
│   ├── hooks/                    # Custom hooks (useChat, useTTS)
│   └── types/                    # TypeScript types
├── backend/                      # Backend (FastAPI)
│   ├── main.py                   # Aplicação FastAPI
│   ├── routers/                  # Endpoints (chat, docs)
│   ├── auth.py                   # Autenticação
│   ├── config.json               # Configuração
│   ├── requirements.txt           # Dependências Python
│   └── tests/                    # Testes
├── start.ps1                     # Script para iniciar tudo
├── stop.ps1                      # Script para parar tudo
└── restart.ps1                   # Script para reiniciar tudo
```

## Tecnologias

### Frontend
- [Next.js 15](https://nextjs.org/)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Atkinson Hyperlegible](https://www.atkinsonhyperlegible.com/) (fonte acessível)

### Backend
- [FastAPI](https://fastapi.tiangolo.com/)
- [Uvicorn](https://www.uvicorn.org/) (ASGI server)
- [Google Gemini API](https://ai.google.dev/)

## Troubleshooting

**Erro: "Porta 8000/3000 já está em uso"**

Use os scripts:
```powershell
.\stop.ps1  # Encerra processos anteriores
.\start.ps1 # Inicia novo
```

Ou encontre e encerre manualmente:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8000
kill -9 <PID>
```

**Erro: "ModuleNotFoundError" no backend**

Certifique-se de ativar o venv e instalar dependências:
```bash
cd backend
source venv/bin/activate  # ou venv\Scripts\activate no Windows
pip install -r requirements.txt
```

**Frontend não conecta ao backend**

Verifique se o backend está rodando em `http://localhost:8000` e se não há CORS issues. Confirme que `.env` está configurado corretamente.
