# Bootstrap script for AI Outfit Studio project
# ---------------------------------------------------
# 1️⃣ Frontend (Next.js + Tailwind CSS)
# ---------------------------------------------------
# Ensure Node.js is installed (>=18)
Write-Host "Creating Frontend (Next.js) ..."
# Create Next.js app with TypeScript template
npx create-next-app@latest frontend --typescript --no-eslint --no-tailwind --use-npm
# Move to frontend folder
Set-Location ./frontend
# Install Tailwind CSS and its peer dependencies
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
# Generate Tailwind config files
npx tailwindcss init -p
# Overwrite Tailwind config with custom theme (will be replaced later by file write)
# Install additional UI libs (optional)
# ---------------------------------------------------
# 2️⃣ Backend (FastAPI + Prisma Python client)
# ---------------------------------------------------
Set-Location ..
Write-Host "Setting up Backend (FastAPI) ..."
# Create Python virtual environment
python -m venv venv
# Activate virtualenv
$env:VIRTUAL_ENV = "$(Resolve-Path .\venv)"
$env:PATH = "$env:VIRTUAL_ENV\Scripts;$env:PATH"
# Upgrade pip
pip install --upgrade pip
# Install backend dependencies
pip install -r requirements.txt
# Initialize Prisma schema (prisma-client-py uses `prisma` CLI)
# Install Prisma CLI (Node) locally for schema migrations
npm install -g prisma
# Initialize Prisma (will create prisma folder if missing)
prisma init
# Replace generated schema with our custom schema (already placed in ./prisma/schema.prisma)
# Generate Prisma client for Python
prisma generate
# ---------------------------------------------------
# 3️⃣ Run Development Servers
# ---------------------------------------------------
Write-Host "All set! To start development:" -ForegroundColor Cyan
Write-Host "  1. Frontend: cd frontend && npm run dev"
Write-Host "  2. Backend:  cd backend && uvicorn app.main:app --reload"

