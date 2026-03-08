import os
import shutil
from pathlib import Path
from git import Repo
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class RepoMetadata(BaseModel):
    name: str
    url: str
    local_path: str
    languages: dict[str, int] # language -> line count (approx via file count or basic stats)

class IngestionService:
    def __init__(self, repos_dir: str):
        self.repos_dir = Path(repos_dir)
        self.repos_dir.mkdir(parents=True, exist_ok=True)
        
        self.language_extensions = {
            ".py": "Python",
            ".js": "JavaScript",
            ".jsx": "JavaScript",
            ".ts": "TypeScript",
            ".tsx": "TypeScript",
            ".java": "Java",
            ".go": "Go",
            ".cpp": "C++",
            ".c": "C",
            ".h": "C/C++ Header"
        }

    def clone_repository(self, repo_url: str) -> str:
        """Clones a repository and returns its local path."""
        repo_name = repo_url.rstrip('/').split('/')[-1]
        if repo_name.endswith('.git'):
            repo_name = repo_name[:-4]
            
        local_path = self.repos_dir / repo_name
        
        if local_path.exists():
            logger.info(f"Repository {repo_name} already exists locally. Pulling latest...")
            try:
                repo = Repo(local_path)
                repo.remotes.origin.pull()
            except Exception as e:
                logger.error(f"Error pulling repo {repo_name}: {e}")
                # Fallback: remove and clone again
                shutil.rmtree(local_path)
                Repo.clone_from(repo_url, local_path)
        else:
            logger.info(f"Cloning {repo_url} into {local_path}...")
            Repo.clone_from(repo_url, local_path)
            
        return str(local_path)

    def detect_languages(self, local_path: str) -> dict[str, int]:
        """Detects languages and counts files for each language in the repo."""
        languages = {}
        for root, _, files in os.walk(local_path):
            if '.git' in root:
                continue
                
            for file in files:
                ext = Path(file).suffix
                if ext in self.language_extensions:
                    lang = self.language_extensions[ext]
                    languages[lang] = languages.get(lang, 0) + 1
                    
        return languages

    def ingest(self, repo_url: str) -> RepoMetadata:
        """Full pipeline to ingest a repository."""
        local_path = self.clone_repository(repo_url)
        languages = self.detect_languages(local_path)
        
        repo_name = Path(local_path).name
        
        # In a real app, save to Postgres here
        
        return RepoMetadata(
            name=repo_name,
            url=repo_url,
            local_path=local_path,
            languages=languages
        )
