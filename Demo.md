# Demo Walkthrough: AI Architecture Intelligence System

This document outlines how to demonstrate the capabilities of the AI Architecture Intelligence System.

## Scenario: Investigating Legacy Code & PR Impact

Imagine you are a developer joining a new team. You need to understand a massive monolithic application and you are tasked with modifying the `auth.py` file, but you are afraid of the "blast radius" of your changes.

### Step 1: System Ingestion
1. Start the Docker containers (`docker-compose up -d`).
2. Start the React Frontend (`npm run dev`).
3. Open `http://localhost:5173`.
4. In the top nav bar, enter a target repository URL (e.g., `https://github.com/tiangolo/fastapi` or any sample repo) and click **Ingest**.
   - *Behind the scenes*: The backend clones the repo, uses `tree-sitter` to parse the AST for Python/JS/Java code, builds a Neo4j Graph of the dependencies, and generates embeddings for FAISS.

### Step 2: Architecture Visualization
1. Once ingestion finishes, the 2D Force Graph will populate.
2. Note the different colors representing `Modules` (files), `Classes`, and `Functions`.
3. You can see how tightly coupled certain modules are by looking at the dense clusters.

### Step 3: Natural Language Queries (RAG)
1. In the "Ask the Architecture AI" box, type:
   > "What components handle user authentication?"
2. The AI returns an explanation.
   - *Behind the scenes*: It queried FAISS for semantically similar code chunks, retrieved the node IDs, queried Neo4j for their dependencies, and synthesized the context.

### Step 4: Blast Radius Prediction
1. On the right side "Simulate PR Impact" panel, input the file you want to change:
   > `backend/services/auth.py`
2. Click **Analyze Blast Radius**.
3. The system returns a **Risk Score** (e.g., High, Medium, Low).
4. You will see a list of downstream impacted entities, showing that changing `auth.py` affects `payment_service.py` at a depth of 3!
5. This prevents a critical incident before the PR is even opened.

## Conclusion
The AI Architecture Intelligence System successfully eliminates architectural amnesia, providing real-time code visibility, AI-assisted architectural reasoning, and predictive PR risk analysis.
