from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import logging

from backend.core.config import settings
from backend.services.ingestion import IngestionService, RepoMetadata
from backend.services.analyzer import CodeAnalyzer
from backend.services.embedding import EmbeddingService
from backend.services.graph_builder import GraphBuilderService
from backend.services.rag_query import RAGQueryService
from backend.services.blast_radius import BlastRadiusService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Architecture Intelligence"])

# Initialize services
ingestion_svc = IngestionService(repos_dir=settings.REPOS_DIR)
analyzer_svc = CodeAnalyzer()
graph_svc = GraphBuilderService()
embedding_svc = EmbeddingService()
rag_svc = RAGQueryService(embedding_svc, graph_svc)
blast_radius_svc = BlastRadiusService(analyzer_svc, graph_svc)

class IngestRequest(BaseModel):
    repo_url: str

class QueryRequest(BaseModel):
    question: str

class PRAnalysisRequest(BaseModel):
    repo_name: str
    modified_files: List[str]

@router.post("/ingest")
async def ingest_repository(request: IngestRequest, background_tasks: BackgroundTasks):
    """
    Triggers the ingestion, analysis, and embedding of a GitHub repository.
    """
    try:
        # 1. Clone & detect languages
        metadata = ingestion_svc.ingest(request.repo_url)
        
        # 2. Parse Code
        analysis_result = analyzer_svc.analyze_repository(metadata.local_path, metadata.name)
        
        # 3. Build Graph
        graph_svc.build_graph(analysis_result)
        
        # 4. Generate Embeddings
        embedding_svc.index_entities(analysis_result.entities)
        
        return {
            "status": "success",
            "message": f"Successfully ingested, analyzed, and indexed {request.repo_url}",
            "metadata": metadata,
            "entities_extracted": len(analysis_result.entities)
        }
    except Exception as e:
        logger.error(f"Error ingesting repository: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def query_architecture(request: QueryRequest):
    """Answers a natural language question about the architecture."""
    try:
        result = rag_svc.query(request.question)
        return result
    except Exception as e:
        logger.error(f"Error during query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pr-analysis")
async def analyze_pr(request: PRAnalysisRequest):
    """Analyzes a PR to determine blast radius."""
    try:
        result = blast_radius_svc.analyze_pr(request.repo_name, request.modified_files)
        if "error" in result:
             raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        logger.error(f"Error analyzing PR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph/{repo_name}")
async def get_graph(repo_name: str):
    """Retrieves the graph data (nodes, links) for visualization in D3.js."""
    try:
        nodes = {}
        links = []
        
        entity_ids = graph_svc.repo_entities.get(repo_name, [])
        for eid in entity_ids:
            node = graph_svc.nodes.get(eid)
            if node:
                nodes[eid] = {"id": node["id"], "name": node["name"], "group": node["type"]}
            
        for src, tgt in graph_svc.edges:
            if src in nodes and tgt in nodes: # Only include edges between known nodes
                links.append({"source": src, "target": tgt, "value": 1})
        
        return {
            "nodes": list(nodes.values()),
            "links": links
        }
    except Exception as e:
        logger.error(f"Error retrieving graph: {e}")
        raise HTTPException(status_code=500, detail=str(e))
