from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os

from app.database import init_db
from app.api.tasks import router as tasks_router
from app.api.quick_capture import router as capture_router
from app.api.whatsapp import router as whatsapp_router

app = FastAPI(title="Task Manager", version="1.0.0")

# Init database on startup
@app.on_event("startup")
def on_startup():
    init_db()

# Mount frontend static files
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

# Register API routers
app.include_router(tasks_router)
app.include_router(capture_router)
app.include_router(whatsapp_router)

# Serve the frontend index for all non-API routes
@app.get("/")
def serve_index():
    return FileResponse(str(FRONTEND_DIR / "index.html"))
