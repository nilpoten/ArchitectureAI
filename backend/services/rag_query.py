import logging
from typing import List, Dict, Any
from backend.services.embedding import EmbeddingService
from backend.services.graph_builder import GraphBuilderService
from backend.core.config import settings

logger = logging.getLogger(__name__)

class RAGQueryService:
    def __init__(self, embedding_service: EmbeddingService, graph_service: GraphBuilderService):
        self.embedding_service = embedding_service
        self.graph_service = graph_service

    def query(self, question: str) -> Dict[str, Any]:
        """Answers a question about the architecture by querying FAISS and Neo4j."""
        logger.info(f"Received query: {question}")
        
        # 1. Retrieve relevant code chunks from Vector DB
        vectors = self.embedding_service.search(question, top_k=3)
        
        # 2. Retrieve relationships from Graph DB
        # To do this, we get the IDs of the top vectors and find their blast radius / dependencies
        entity_ids = [v["id"] for v in vectors]
        
        graph_context = []
        if entity_ids:
            # Get blast radius / dependencies for these specific entities
            impacts = self.graph_service.get_blast_radius(entity_ids)
            graph_context = impacts
            
        # 3. Generate Answer (using LLM or Mock)
        context_text = self._build_context_text(vectors, graph_context)
        
        if settings.MOCK_LLM:
            answer = self._mock_llm_generate(question, context_text)
        else:
            answer = self._llm_generate(question, context_text)
            
        return {
            "question": question,
            "answer": answer,
            "context": {
                "snippets": vectors,
                "graph_relationships": graph_context
            }
        }

    def _build_context_text(self, vectors: List[dict], graph_context: List[dict]) -> str:
        ctx = "Based on the following code snippets:\n\n"
        for i, v in enumerate(vectors):
            ctx += f"[{i+1}] {v['file_path']} - {v['type']} {v['name']}:\n{v['content_preview']}...\n\n"
            
        if graph_context:
            ctx += "And the following architectural relationships:\n\n"
            for g in graph_context:
                ctx += f"- {g['modified']} affects {g['impact_name']} (distance {g['distance']})\n"
                
        return ctx

    def _mock_llm_generate(self, question: str, context: str) -> str:
        """Mock response for testing."""
        return (f"This is a mocked AI response.\n\n"
                f"You asked: '{question}'\n\n"
                f"Based on the retrieved context, the relevant components are strongly coupled. "
                f"Modifying them will likely have a medium-to-high blast radius affecting downstream services.")

    def _llm_generate(self, question: str, context: str) -> str:
        """Integration with a real LLM like OpenAI."""
        # This is where we would call OpenAI API or a local LLM API
        # Example:
        # response = openai.ChatCompletion.create(
        #     model="gpt-4",
        #     messages=[
        #         {"role": "system", "content": "You are a senior software architect. Answer questions about the provided codebase context."},
        #         {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
        #     ]
        # )
        # return response.choices[0].message.content
        return "Real LLM integration not fully configured. Set MOCK_LLM=false and add OPENAI_API_KEY."
