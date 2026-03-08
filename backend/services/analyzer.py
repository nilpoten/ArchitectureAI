import os
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Dict
import tree_sitter
import tree_sitter_python
import tree_sitter_javascript
import tree_sitter_java

class CodeEntity(BaseModel):
    id: str
    name: str
    type: str # "function", "class", "module"
    file_path: str
    content: str
    dependencies: List[str] = [] # List of other entity IDs or names it depends on

class AnalysisResult(BaseModel):
    repo_name: str
    entities: List[CodeEntity]

class CodeAnalyzer:
    def __init__(self):
        # Initialize parsers
        self.parsers = {}
        
        # Python
        try:
            self.parsers[".py"] = tree_sitter.Parser(tree_sitter.Language(tree_sitter_python.language()))
        except Exception as e:
            print(f"Failed to load Python parser: {e}")
            
        # JS/TS
        try:
            js_lang = tree_sitter.Language(tree_sitter_javascript.language())
            self.parsers[".js"] = tree_sitter.Parser(js_lang)
            self.parsers[".jsx"] = tree_sitter.Parser(js_lang)
            # For simplicity, using JS parser for TS if no dedicated one, though TS is better
            self.parsers[".ts"] = tree_sitter.Parser(js_lang)
            self.parsers[".tsx"] = tree_sitter.Parser(js_lang)
        except Exception as e:
            print(f"Failed to load JS parser: {e}")
            
        # Java
        try:
            self.parsers[".java"] = tree_sitter.Parser(tree_sitter.Language(tree_sitter_java.language()))
        except Exception as e:
            print(f"Failed to load Java parser: {e}")

    def analyze_repository(self, repo_path: str, repo_name: str) -> AnalysisResult:
        """Walks through the repository, parsing supported files and extracting entities."""
        import re
        entities = []
        
        for root, _, files in os.walk(repo_path):
            if '.git' in root or 'node_modules' in root or 'venv' in root:
                continue
                
            for file in files:
                ext = Path(file).suffix
                if ext in self.parsers:
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, repo_path)
                    
                    try:
                        file_entities = self.parse_file(file_path, rel_path, ext)
                        entities.extend(file_entities)
                    except Exception as e:
                        print(f"Error parsing {file_path}: {e}")
                        
        # Post-Processing: Infer dependencies and edges between entities
        # Optimize memory and CPU using O(N) set intersection instead of O(N^2) regex scans
        entity_map = {e.name: e for e in entities if e.type != "module" and len(e.name) > 3}
        valid_names = set(entity_map.keys())
        
        for entity in entities:
            # 1. Link functions and classes to the module they are defined in
            if entity.type != "module":
                if entity.file_path not in entity.dependencies:
                    entity.dependencies.append(entity.file_path)
            
            # 2. Fast AST dependency resolution via text token intersection
            if entity.content:
                # Extract all word-like tokens from the content to find references
                tokens = set(re.findall(r'[a-zA-Z_]\w*', entity.content))
                # Intersect tokens with our known architecture entities
                found_names = tokens.intersection(valid_names)
                
                for name in found_names:
                    if name != entity.name:
                        target_entity = entity_map[name]
                        if target_entity.id not in entity.dependencies:
                            entity.dependencies.append(target_entity.id)
                                    
        return AnalysisResult(repo_name=repo_name, entities=entities)

    def parse_file(self, full_path: str, rel_path: str, ext: str) -> List[CodeEntity]:
        """Parses a single file and returns extracted functions/classes as entities."""
        parser = self.parsers[ext]
        
        with open(full_path, 'r', encoding='utf-8') as f:
            code = f.read()
            
        tree = parser.parse(bytes(code, "utf8"))
        
        entities = []
        
        # Simple extraction using tree-sitter.
        # This is a very rudimentary extraction to show concepts.
        # A robust system needs Tree-sitter Queries configured per language.
        
        def traverse(node):
            if ext == '.py':
                if node.type == 'function_definition':
                    name_node = node.child_by_field_name('name')
                    if name_node:
                        name = code[name_node.start_byte:name_node.end_byte]
                        content = code[node.start_byte:node.end_byte]
                        entities.append(CodeEntity(
                            id=f"{rel_path}:{name}",
                            name=name,
                            type="function",
                            file_path=rel_path,
                            content=content
                        ))
                elif node.type == 'class_definition':
                    name_node = node.child_by_field_name('name')
                    if name_node:
                        name = code[name_node.start_byte:name_node.end_byte]
                        content = code[node.start_byte:node.end_byte]
                        entities.append(CodeEntity(
                            id=f"{rel_path}:{name}",
                            name=name,
                            type="class",
                            file_path=rel_path,
                            content=content
                        ))
            elif ext in ['.js', '.jsx', '.ts', '.tsx']:
                if node.type in ['function_declaration', 'arrow_function', 'method_definition']:
                    name_node = node.child_by_field_name('name')
                    name = code[name_node.start_byte:name_node.end_byte] if name_node else "anonymous"
                    content = code[node.start_byte:node.end_byte]
                    entities.append(CodeEntity(
                        id=f"{rel_path}:{name}",
                        name=name,
                        type="function",
                        file_path=rel_path,
                        content=content
                    ))
                elif node.type == 'class_declaration':
                    name_node = node.child_by_field_name('name')
                    if name_node:
                        name = code[name_node.start_byte:name_node.end_byte]
                        content = code[node.start_byte:node.end_byte]
                        entities.append(CodeEntity(
                            id=f"{rel_path}:{name}",
                            name=name,
                            type="class",
                            file_path=rel_path,
                            content=content
                        ))
            elif ext == '.java':
                if node.type == 'method_declaration':
                    name_node = node.child_by_field_name('name')
                    if name_node:
                        name = code[name_node.start_byte:name_node.end_byte]
                        content = code[node.start_byte:node.end_byte]
                        entities.append(CodeEntity(
                            id=f"{rel_path}:{name}",
                            name=name,
                            type="function",
                            file_path=rel_path,
                            content=content
                        ))
                elif node.type == 'class_declaration':
                    name_node = node.child_by_field_name('name')
                    if name_node:
                        name = code[name_node.start_byte:name_node.end_byte]
                        content = code[node.start_byte:node.end_byte]
                        entities.append(CodeEntity(
                            id=f"{rel_path}:{name}",
                            name=name,
                            type="class",
                            file_path=rel_path,
                            content=content
                        ))

            for child in node.children:
                traverse(child)

        traverse(tree.root_node)
        
        # Add the file itself as a module
        entities.append(CodeEntity(
            id=rel_path,
            name=os.path.basename(rel_path),
            type="module",
            file_path=rel_path,
            content=code
        ))
        
        return entities
