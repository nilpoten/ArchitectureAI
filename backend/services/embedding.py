import random
import logging
from typing import List, Dict, Any
from backend.services.analyzer import CodeEntity
from backend.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self, index_dir: str = "", max_entities=10000):
        self.metadata = {}  # index -> dict
        self.vectors = []
        self.max_entities = max_entities
        
    def _evict_old_entities(self):
        """Memory Optimization: Prevent mock embeddings from growing infinitely."""
        if len(self.vectors) > self.max_entities:
            logger.info("Memory Optimization: Evicting old embedding vectors.")
            excess = len(self.vectors) - self.max_entities
            self.vectors = self.vectors[excess:]
            
            # Re-index metadata dict
            new_meta = {}
            for old_idx in range(excess, excess + self.max_entities):
                if old_idx in self.metadata:
                    new_meta[old_idx - excess] = self.metadata[old_idx]
            self.metadata = new_meta

    def index_entities(self, entities: List[CodeEntity]):
        """Mocks generating embeddings for code entities."""
        if not entities:
            return
            
        start_id = len(self.vectors)
        for i, entity in enumerate(entities):
            # Memory optimization: Mock vector with tiny float array instead of 384 dimensions
            self.vectors.append([0.1])
            self.metadata[start_id + i] = {
                "id": entity.id,
                "name": entity.name,
                "type": entity.type,
                "file_path": entity.file_path,
                "content_preview": entity.content[:200]
            }
            
        self._evict_old_entities()
        logger.info(f"Mock embedded {len(entities)} entities. Memory pool at {len(self.vectors)}.")

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Mocks searching the vector database for relevant code chunks."""
        results = []
        # Return first few matches for the demo
        for i in range(min(top_k, len(self.metadata))):
            meta = self.metadata[i].copy()
            meta["score"] = 0.99
            results.append(meta)
        return results
