import logging
from typing import List, Dict, Any
from backend.services.analyzer import CodeAnalyzer
from backend.services.graph_builder import GraphBuilderService

logger = logging.getLogger(__name__)

class BlastRadiusService:
    def __init__(self, analyzer: CodeAnalyzer, graph_service: GraphBuilderService):
        self.analyzer = analyzer
        self.graph_service = graph_service

    def analyze_pr(self, repo_name: str, modified_files: List[str]) -> Dict[str, Any]:
        """
        Calculates the blast radius of a simulated Pull Request.
        In reality, this would fetch the PR diff and find exactly which functions changed.
        For now, we map the modified file paths to entities we know and query the graph.
        """
        logger.info(f"Analyzing PR for repo {repo_name} with files: {modified_files}")
        
        # We assume entity IDs are like "rel_path:function_name" or "rel_path"
        # We'll just look for any entity that lives in the modified files
        # Alternatively, we could query the DB: "MATCH (e:CodeEntity) WHERE e.file_path IN $modified_files"
        
        # For simplicity, we query the graph directly here using an ad-hoc query
        # via the graph_service for the entities in these files.
        try:
            modified_entity_ids = []
            for eid, node in self.graph_service.nodes.items():
                # node contains "file_path", we check if the path is in the modified files list
                # Since modified_files from PR usually looks like "backend/main.py", we match substrings or exact
                for m_file in modified_files:
                    if m_file in node.get("file_path", ""):
                        modified_entity_ids.append(eid)
                        break
                
            if not modified_entity_ids:
                return {
                    "risk_score": "Low",
                    "impacts": [],
                    "message": "No known CodeEntities found in the modified files."
                }
                
            impacts = self.graph_service.get_blast_radius(modified_entity_ids)
            
            # Calculate Risk Score
            max_distance = 0
            total_impacts = len(impacts)
            
            for impact in impacts:
                if impact["distance"] > max_distance:
                    max_distance = impact["distance"]
                    
            risk_score = "Low"
            if total_impacts > 10 or max_distance > 3:
                risk_score = "High"
            elif total_impacts > 3 or max_distance > 1:
                risk_score = "Medium"
                
            return {
                "risk_score": risk_score,
                "total_impacted_entities": total_impacts,
                "max_dependency_distance": max_distance,
                "impacts": impacts,
                "message": f"PR analysis complete. Found {total_impacts} impacted entities."
            }
        except Exception as e:
            logger.error(f"Error in PR analysis: {e}")
            return {"error": str(e)}
