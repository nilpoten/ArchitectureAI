import logging
from typing import List, Dict, Any
from backend.services.analyzer import AnalysisResult, CodeEntity

logger = logging.getLogger(__name__)

class GraphBuilderService:
    def __init__(self, max_repos=3):
        # In-memory graph storage since user lacks Docker/Neo4j
        self.nodes = {} # entity_id -> node_dict
        self.edges = [] # list of (source_id, target_id)
        self.repo_entities = {} # repo_name -> list of entity_ids
        self.repo_history = []  # track insertion order for eviction
        self.max_repos = max_repos

    def _evict_old_repos(self):
        """Memory optimization: Evict oldest repos if we exceed max_repos limit"""
        while len(self.repo_history) > self.max_repos:
            oldest_repo = self.repo_history.pop(0)
            logger.info(f"Memory Optimization: Evicting graph data for {oldest_repo}")
            
            # Remove nodes
            entity_ids = self.repo_entities.get(oldest_repo, [])
            for eid in entity_ids:
                if eid in self.nodes:
                    del self.nodes[eid]
                    
            # Remove repo from index
            if oldest_repo in self.repo_entities:
                del self.repo_entities[oldest_repo]
                
            # Rebuild edges (O(E) operation but happens rarely)
            # Only keep edges where both source and target still exist in our nodes
            self.edges = [(src, tgt) for src, tgt in self.edges if src in self.nodes and tgt in self.nodes]

    def close(self):
        pass

    def build_graph(self, analysis_result: AnalysisResult):
        """Builds an in-memory graph representing the repository codebase."""
        logger.info(f"Building in-memory graph for repo: {analysis_result.repo_name}")
        repo_name = analysis_result.repo_name
        self.repo_entities[repo_name] = []
        
        if repo_name not in self.repo_history:
            self.repo_history.append(repo_name)
            
        self._evict_old_repos()
        
        for entity in analysis_result.entities:
            self.nodes[entity.id] = {
                "id": entity.id,
                "name": entity.name,
                "type": entity.type,
                "file_path": entity.file_path,
                "repo_name": repo_name
            }
            self.repo_entities[repo_name].append(entity.id)
                
        for entity in analysis_result.entities:
            if entity.dependencies:
                for dep_id in entity.dependencies:
                    self.edges.append((entity.id, dep_id))

    def get_blast_radius(self, entity_ids: List[str]) -> List[dict]:
        """Queries the in-memory graph for the blast radius of changing the given entities."""
        impacts = []
        visited = set(entity_ids)
        queue = [(eid, eid, self.nodes[eid]["name"] if eid in self.nodes else eid, 0) for eid in entity_ids]
        
        while queue:
            current, original_modified, modified_name, depth = queue.pop(0)
            if depth >= 4:
                continue
                
            # Find what depends ON current
            for src, tgt in self.edges:
                if tgt == current and src not in visited:
                    visited.add(src)
                    impact_name = self.nodes.get(src, {}).get("name", src)
                    
                    impacts.append({
                        "modified": original_modified,
                        "impacted": src,
                        "impact_name": impact_name,
                        "distance": depth + 1
                    })
                    
                    queue.append((src, original_modified, modified_name, depth + 1))
                    
        return sorted(impacts, key=lambda x: x["distance"])

