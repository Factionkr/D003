# AI Outfit Studio

## Project Overview
- **Frontend**: Next.js (TypeScript) + Tailwind CSS
- **Backend**: FastAPI (Python) + Prisma (Python client) + PostgreSQL
- **Purpose**: Render virtual outfit fitting and recommendation workflow for 40‑60 year‑old female users.

## Directory Layout
```
PROJECT_ROOT (c:\Project\D003\D003-8)
├─ frontend/                # Next.js app
│   ├─ pages/               # Next.js pages
│   ├─ components/          # React UI components
│   ├─ styles/              # Global CSS (Tailwind directives)
│   ├─ tailwind.config.js   # Custom color palette (provided)
│   └─ postcss.config.js    # PostCSS config for Tailwind
├─ backend/                 # FastAPI server
│   ├─ app/
│   │   ├─ __init__.py
│   │   ├─ main.py
│   │   └─ api/
│   │       └─ v1/
│   │           ├─ __init__.py
│   │           ├─ virtual_fitting.py
│   │           └─ wardrobe.py
│   ├─ prisma/               # Prisma schema
│   ├─ prisma_client/        # Generated Prisma Python client (after `prisma generate`)
│   └─ requirements.txt
├─ .env                     # Environment variables (DB URL, etc.)
├─ setup.ps1                # Bootstrap script (already created)
└─ README.md                # This file
```
