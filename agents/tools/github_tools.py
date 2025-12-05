"""
GitHub Integration Tools for CodeCollab
Fetches and analyzes GitHub repositories for codebase context
"""

from strands import tool
from typing import Dict, Any, List, Optional
import subprocess
import tempfile
import os
import shutil
from pathlib import Path


@tool
def clone_github_repository(repo_url: str, branch: str = "main") -> Dict[str, Any]:
    """
    Clone a GitHub repository to a temporary directory for analysis.

    Args:
        repo_url: GitHub repository URL (https://github.com/user/repo)
        branch: Branch to clone (default: main)

    Returns:
        Dict containing:
            - success: Boolean indicating if clone was successful
            - repo_path: Path to cloned repository
            - repo_name: Repository name
            - error: Error message if failed
    """
    try:
        # Create temporary directory
        temp_dir = tempfile.mkdtemp(prefix="codecollab_repo_")

        # Extract repo name from URL
        repo_name = repo_url.rstrip('/').split('/')[-1].replace('.git', '')

        # Clone repository
        result = subprocess.run(
            ['git', 'clone', '--depth', '1', '--branch', branch, repo_url, temp_dir],
            capture_output=True,
            text=True,
            timeout=120
        )

        if result.returncode != 0:
            # If branch doesn't exist, try without branch specification
            result = subprocess.run(
                ['git', 'clone', '--depth', '1', repo_url, temp_dir],
                capture_output=True,
                text=True,
                timeout=120
            )

        if result.returncode == 0:
            return {
                "success": True,
                "repo_path": temp_dir,
                "repo_name": repo_name,
                "message": f"Successfully cloned {repo_name}"
            }
        else:
            return {
                "success": False,
                "error": f"Failed to clone repository: {result.stderr}",
                "repo_name": repo_name
            }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "Repository clone timed out after 120 seconds"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error cloning repository: {str(e)}"
        }


@tool
def analyze_repository_structure(repo_path: str) -> Dict[str, Any]:
    """
    Analyze the structure of a cloned repository.

    Args:
        repo_path: Path to the repository directory

    Returns:
        Dict containing:
            - file_tree: Directory structure
            - file_count: Total number of files
            - languages: Programming languages detected
            - key_files: Important files (README, requirements, etc.)
    """
    try:
        if not os.path.exists(repo_path):
            return {
                "success": False,
                "error": f"Repository path does not exist: {repo_path}"
            }

        # Count files and detect languages
        file_extensions = {}
        key_files = []
        total_files = 0
        file_tree = []

        key_filenames = [
            'README.md', 'README.rst', 'README.txt',
            'requirements.txt', 'package.json', 'setup.py',
            'Dockerfile', 'docker-compose.yml', '.env.example',
            'Makefile', 'pyproject.toml', 'Cargo.toml'
        ]

        for root, dirs, files in os.walk(repo_path):
            # Skip .git directory
            if '.git' in root:
                continue

            rel_root = os.path.relpath(root, repo_path)
            level = rel_root.count(os.sep)

            for file in files:
                total_files += 1
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, repo_path)

                # Track file extensions
                ext = Path(file).suffix
                if ext:
                    file_extensions[ext] = file_extensions.get(ext, 0) + 1

                # Identify key files
                if file in key_filenames:
                    key_files.append(rel_path)

                # Build file tree (limit to first 100 files)
                if len(file_tree) < 100:
                    indent = "  " * level
                    file_tree.append(f"{indent}{file}")

        # Map extensions to languages
        language_map = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.java': 'Java',
            '.go': 'Go',
            '.rs': 'Rust',
            '.cpp': 'C++',
            '.c': 'C',
            '.rb': 'Ruby',
            '.php': 'PHP',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.jsx': 'React',
            '.tsx': 'TypeScript React',
            '.vue': 'Vue',
            '.sh': 'Shell',
            '.yaml': 'YAML',
            '.yml': 'YAML',
            '.json': 'JSON',
            '.md': 'Markdown'
        }

        languages = {}
        for ext, count in file_extensions.items():
            lang = language_map.get(ext, ext)
            languages[lang] = languages.get(lang, 0) + count

        # Sort languages by file count
        languages = dict(sorted(languages.items(), key=lambda x: x[1], reverse=True))

        return {
            "success": True,
            "file_tree": file_tree[:50],  # First 50 files
            "file_count": total_files,
            "languages": languages,
            "key_files": key_files,
            "primary_language": list(languages.keys())[0] if languages else "Unknown"
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Error analyzing repository: {str(e)}"
        }


@tool
def extract_key_file_contents(repo_path: str, file_patterns: List[str] = None) -> Dict[str, str]:
    """
    Extract contents of key configuration and documentation files.

    Args:
        repo_path: Path to the repository
        file_patterns: List of file patterns to extract (default: README, requirements, etc.)

    Returns:
        Dict mapping file paths to their contents
    """
    try:
        if file_patterns is None:
            file_patterns = [
                'README.md', 'README.rst', 'README.txt',
                'requirements.txt', 'package.json', 'setup.py',
                '.env.example', 'pyproject.toml'
            ]

        file_contents = {}

        for root, dirs, files in os.walk(repo_path):
            # Skip .git directory
            if '.git' in root:
                continue

            for file in files:
                if file in file_patterns:
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, repo_path)

                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read(5000)  # First 5000 characters
                            file_contents[rel_path] = content
                    except Exception as e:
                        file_contents[rel_path] = f"Error reading file: {str(e)}"

        return file_contents

    except Exception as e:
        return {"error": f"Error extracting file contents: {str(e)}"}


@tool
def search_codebase(repo_path: str, query: str, file_extension: str = None) -> List[Dict[str, Any]]:
    """
    Search for code patterns in the repository.

    Args:
        repo_path: Path to the repository
        query: Search query (regex pattern)
        file_extension: Optional file extension filter (e.g., '.py')

    Returns:
        List of matches with file path, line number, and content
    """
    try:
        import re

        matches = []
        pattern = re.compile(query, re.IGNORECASE)

        for root, dirs, files in os.walk(repo_path):
            # Skip .git directory
            if '.git' in root:
                continue

            for file in files:
                # Filter by extension if specified
                if file_extension and not file.endswith(file_extension):
                    continue

                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, repo_path)

                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        for line_num, line in enumerate(f, 1):
                            if pattern.search(line):
                                matches.append({
                                    "file": rel_path,
                                    "line": line_num,
                                    "content": line.strip()[:200]  # First 200 chars
                                })

                                # Limit to 50 matches
                                if len(matches) >= 50:
                                    return matches
                except:
                    continue

        return matches

    except Exception as e:
        return [{"error": f"Search failed: {str(e)}"}]


@tool
def cleanup_repository(repo_path: str) -> Dict[str, bool]:
    """
    Clean up cloned repository directory.

    Args:
        repo_path: Path to the repository to delete

    Returns:
        Dict with success status
    """
    try:
        if os.path.exists(repo_path) and repo_path.startswith('/tmp'):
            shutil.rmtree(repo_path)
            return {"success": True, "message": f"Cleaned up {repo_path}"}
        else:
            return {"success": False, "error": "Invalid repository path"}
    except Exception as e:
        return {"success": False, "error": f"Cleanup failed: {str(e)}"}


@tool
def get_repository_metadata(repo_url: str) -> Dict[str, Any]:
    """
    Get metadata about a GitHub repository using git commands.

    Args:
        repo_url: GitHub repository URL

    Returns:
        Dict containing repository metadata
    """
    try:
        # Extract owner and repo name
        parts = repo_url.rstrip('/').split('/')
        if len(parts) >= 2:
            owner = parts[-2]
            repo = parts[-1].replace('.git', '')
        else:
            return {"error": "Invalid GitHub URL format"}

        return {
            "success": True,
            "owner": owner,
            "repo_name": repo,
            "url": repo_url,
            "clone_url": f"https://github.com/{owner}/{repo}.git"
        }

    except Exception as e:
        return {"success": False, "error": f"Failed to parse repository URL: {str(e)}"}
