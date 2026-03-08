from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AI Architecture Intelligence System",
    description="API for codebase analysis and blast radius prediction",
    version="1.0.0"
)

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.api.routes import router as api_router
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Architecture Intelligence System API is running"}

@app.get("/health")
def health_check():
    # Will be expanded later to check neo4j, postgres, and faiss
    return {"status": "healthy"}
