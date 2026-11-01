from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1 import virtual_fitting, wardrobe

app = FastAPI(title="AI Outfit Studio Backend", version="0.1.0")

# Allow frontend (localhost:3000) to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(virtual_fitting.router, prefix="/api/v1/virtual_fitting", tags=["Virtual Fitting"])
app.include_router(wardrobe.router, prefix="/api/v1/wardrobe", tags=["Wardrobe"])

