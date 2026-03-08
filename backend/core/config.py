import os
from typing import Optional
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Neo4j
    NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "password")
    
    # Postgres
    POSTGRES_URL: str = os.getenv("POSTGRES_URL", "postgresql://postgres:password@localhost:5432/ai_arch")
    
    # AI/LLM
    MOCK_LLM: bool = os.getenv("MOCK_LLM", "true").lower() == "true"
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    
    # Paths
    REPOS_DIR: str = os.getenv("REPOS_DIR", "/tmp/ai_arch_repos")
    
    class Config:
        env_file = ".env"

settings = Settings()
