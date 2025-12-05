"""
Code analysis tools for agents
"""

from typing import Dict, List, Any
import re


def analyze_code_complexity(code: str, language: str = "python") -> Dict[str, Any]:
    """
    Analyze code complexity and quality metrics.
    
    Args:
        code: Source code to analyze
        language: Programming language
        
    Returns:
        Dict containing complexity metrics and recommendations
    """
    # Count lines of code
    lines = code.split('\n')
    loc = len([l for l in lines if l.strip() and not l.strip().startswith('#')])
    
    # Count functions/methods
    if language == "python":
        functions = len(re.findall(r'def\s+\w+', code))
        classes = len(re.findall(r'class\s+\w+', code))
    else:
        functions = 0
        classes = 0
    
    # Basic complexity scoring
    complexity_score = min(100, max(0, 100 - (loc / 10)))
    
    # Determine complexity level
    if loc < 50:
        complexity = "simple"
    elif loc < 200:
        complexity = "medium"
    else:
        complexity = "complex"
    
    return {
        "lines_of_code": loc,
        "functions": functions,
        "classes": classes,
        "complexity": complexity,
        "complexity_score": complexity_score,
        "language": language,
        "recommendations": [
            "Consider breaking down large functions" if loc > 200 else "Code size is manageable",
            "Add docstrings to all functions",
            "Ensure proper error handling"
        ]
    }


def find_code_patterns(code: str, language: str = "python") -> Dict[str, List[str]]:
    """
    Find common code patterns and anti-patterns.
    
    Args:
        code: Source code to analyze
        language: Programming language
        
    Returns:
        Dict of patterns found
    """
    patterns = {
        "imports": [],
        "error_handling": [],
        "testing_patterns": [],
        "anti_patterns": []
    }
    
    lines = code.split('\n')
    
    # Find imports
    for line in lines:
        if line.strip().startswith('import ') or line.strip().startswith('from '):
            patterns["imports"].append(line.strip())
    
    # Find error handling
    if 'try:' in code and 'except' in code:
        patterns["error_handling"].append("try-except blocks found")
    
    # Find testing patterns
    if 'def test_' in code or 'class Test' in code:
        patterns["testing_patterns"].append("Unit tests present")
    
    # Check for anti-patterns
    if 'except:' in code and 'except Exception:' not in code:
        patterns["anti_patterns"].append("Bare except clause (catch-all exception)")
    
    if code.count('print(') > 5:
        patterns["anti_patterns"].append("Excessive print statements (use logging)")
    
    return patterns


def detect_security_issues(code: str) -> Dict[str, List[str]]:
    """
    Detect potential security vulnerabilities in code.
    
    Args:
        code: Source code to analyze
        
    Returns:
        Dict of security issues found
    """
    issues = {
        "high": [],
        "medium": [],
        "low": [],
        "info": []
    }
    
    # Check for common security issues
    if 'eval(' in code:
        issues["high"].append("Use of eval() - potential code injection risk")
    
    if 'exec(' in code:
        issues["high"].append("Use of exec() - potential code injection risk")
    
    if 'pickle.loads' in code:
        issues["medium"].append("Pickle deserialization - validate input source")
    
    if 'password' in code.lower() and ('=' in code or 'input(' in code):
        issues["medium"].append("Hardcoded credentials or password in plain text")
    
    if 'sql' in code.lower() and '+' in code:
        issues["medium"].append("Potential SQL injection via string concatenation")
    
    if 'os.system' in code:
        issues["medium"].append("Use of os.system() - validate all inputs")
    
    # Info level
    if not any([issues["high"], issues["medium"], issues["low"]]):
        issues["info"].append("No obvious security issues detected")
    
    return issues
