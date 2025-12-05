"""
Custom tools for CodeCollab agents following Strands SDK patterns
"""

from strands import tool
import re
import ast
import subprocess
import tempfile
import os
from typing import Dict, Any, List


@tool
def analyze_code_complexity(code: str) -> Dict[str, Any]:
    """
    Analyze Python code complexity and provide metrics.
    
    Args:
        code (str): The Python code to analyze
        
    Returns:
        Dict with complexity metrics including cyclomatic complexity,
        line count, function count, and complexity assessment
    """
    try:
        # Parse the AST
        tree = ast.parse(code)
        
        # Count functions and classes
        functions = [node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
        
        # Count lines (excluding empty lines and comments)
        lines = [line.strip() for line in code.split('\n') if line.strip() and not line.strip().startswith('#')]
        
        # Simple complexity heuristics
        complexity_indicators = [
            'if ', 'elif ', 'else:', 'for ', 'while ', 'try:', 'except:', 'with '
        ]
        
        complexity_score = sum(code.count(indicator) for indicator in complexity_indicators)
        
        # Assess complexity level
        if len(lines) < 20 and complexity_score < 5:
            complexity_level = "Simple"
        elif len(lines) < 100 and complexity_score < 15:
            complexity_level = "Medium" 
        else:
            complexity_level = "Complex"
            
        return {
            "line_count": len(lines),
            "function_count": len(functions),
            "class_count": len(classes),
            "complexity_score": complexity_score,
            "complexity_level": complexity_level,
            "functions": [f.name for f in functions],
            "classes": [c.name for c in classes]
        }
        
    except SyntaxError as e:
        return {
            "error": f"Syntax error in code: {str(e)}",
            "complexity_level": "Invalid"
        }
    except Exception as e:
        return {
            "error": f"Analysis error: {str(e)}",
            "complexity_level": "Unknown"
        }


@tool
def extract_code_blocks(text: str) -> List[Dict[str, str]]:
    """
    Extract Python code blocks from text (markdown format).
    
    Args:
        text (str): Text containing code blocks
        
    Returns:
        List of dictionaries with extracted code blocks
    """
    # Pattern to match ```python code blocks
    pattern = r'```python\n(.*?)\n```'
    matches = re.findall(pattern, text, re.DOTALL)
    
    code_blocks = []
    for i, code in enumerate(matches):
        code_blocks.append({
            "block_id": i + 1,
            "code": code.strip(),
            "language": "python",
            "line_count": len(code.strip().split('\n'))
        })
    
    # Also look for simple function definitions not in code blocks
    if not code_blocks:
        func_pattern = r'(def \w+.*?)(?=\n\n|\nclass|\n#|\Z)'
        func_matches = re.findall(func_pattern, text, re.DOTALL)
        
        for i, code in enumerate(func_matches):
            code_blocks.append({
                "block_id": i + 1,
                "code": code.strip(),
                "language": "python",
                "line_count": len(code.strip().split('\n'))
            })
    
    return code_blocks


@tool
def validate_python_syntax(code: str) -> Dict[str, Any]:
    """
    Validate Python code syntax and provide feedback.
    
    Args:
        code (str): Python code to validate
        
    Returns:
        Dict with validation results and suggestions
    """
    try:
        # Try to parse the code
        ast.parse(code)
        
        return {
            "is_valid": True,
            "message": "Code syntax is valid",
            "errors": []
        }
        
    except SyntaxError as e:
        return {
            "is_valid": False,
            "message": f"Syntax error: {e.msg}",
            "errors": [{
                "line": e.lineno,
                "column": e.offset,
                "message": e.msg,
                "type": "SyntaxError"
            }]
        }
    except Exception as e:
        return {
            "is_valid": False,
            "message": f"Validation error: {str(e)}",
            "errors": [{
                "message": str(e),
                "type": type(e).__name__
            }]
        }


@tool
def run_python_tests(code: str) -> Dict[str, Any]:
    """
    Execute Python code and capture output, including test results.
    
    Args:
        code (str): Python code to execute
        
    Returns:
        Dict with execution results
    """
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        try:
            # Execute the code
            result = subprocess.run(
                ['python', temp_file],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode,
                "execution_time": "< 30s"
            }
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_file):
                os.unlink(temp_file)
                
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "stdout": "",
            "stderr": "Execution timed out (30s limit)",
            "return_code": -1,
            "execution_time": "> 30s"
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Execution error: {str(e)}",
            "return_code": -1,
            "execution_time": "N/A"
        }


@tool
def generate_test_cases(function_signature: str, description: str) -> List[str]:
    """
    Generate test cases for a given function signature and description.
    
    Args:
        function_signature (str): The function signature (e.g., "def add(a, b)")
        description (str): Description of what the function should do
        
    Returns:
        List of test case strings
    """
    # Extract function name
    func_name_match = re.search(r'def (\w+)\(', function_signature)
    if not func_name_match:
        return ["# Could not extract function name from signature"]
    
    func_name = func_name_match.group(1)
    
    # Generate basic test cases based on common patterns
    test_cases = [
        f"# Test basic functionality",
        f"assert {func_name}(2, 3) == 5  # Basic positive case",
        f"assert {func_name}(0, 0) == 0  # Edge case: zeros",
        f"assert {func_name}(-1, 1) == 0  # Mixed positive/negative",
        f"",
        f"# Test edge cases",
        f"try:",
        f"    {func_name}(None, 1)  # Test with None",
        f"    assert False, 'Should raise TypeError'",
        f"except (TypeError, ValueError):",
        f"    pass  # Expected behavior",
        f"",
        f"print('✅ All {func_name} tests passed!')"
    ]
    
    return test_cases


@tool 
def assess_task_difficulty(requirements: str) -> Dict[str, Any]:
    """
    Assess the difficulty level of a development task.
    
    Args:
        requirements (str): Task requirements description
        
    Returns:
        Dict with difficulty assessment and reasoning
    """
    requirements_lower = requirements.lower()
    
    # Simple task indicators
    simple_indicators = [
        'function', 'calculate', 'add', 'subtract', 'multiply', 'divide',
        'simple', 'basic', 'hello world', 'print', 'variable'
    ]
    
    # Medium task indicators  
    medium_indicators = [
        'class', 'object', 'method', 'api', 'file', 'data processing',
        'validation', 'parsing', 'algorithm', 'sorting', 'searching'
    ]
    
    # Complex task indicators
    complex_indicators = [
        'microservice', 'database', 'distributed', 'concurrent', 'async',
        'security', 'authentication', 'encryption', 'performance', 
        'optimization', 'architecture', 'integration', 'scalability'
    ]
    
    simple_count = sum(1 for indicator in simple_indicators if indicator in requirements_lower)
    medium_count = sum(1 for indicator in medium_indicators if indicator in requirements_lower)
    complex_count = sum(1 for indicator in complex_indicators if indicator in requirements_lower)
    
    # Determine difficulty
    if complex_count > 0:
        difficulty = "Complex"
        ai_confidence = "Low"
        reasoning = f"Task contains complex indicators: {[i for i in complex_indicators if i in requirements_lower]}"
    elif medium_count > 1:
        difficulty = "Medium"
        ai_confidence = "Medium"
        reasoning = f"Task has multiple medium complexity indicators: {[i for i in medium_indicators if i in requirements_lower]}"
    elif simple_count > 0 or len(requirements.split()) < 20:
        difficulty = "Simple"
        ai_confidence = "High" 
        reasoning = "Task appears straightforward with simple requirements"
    else:
        difficulty = "Medium"
        ai_confidence = "Medium"
        reasoning = "Task complexity unclear, defaulting to medium difficulty"
    
    return {
        "difficulty": difficulty,
        "ai_confidence": ai_confidence,
        "reasoning": reasoning,
        "estimated_time_minutes": {
            "Simple": 5,
            "Medium": 15,
            "Complex": 45
        }[difficulty],
        "requires_human": difficulty == "Complex"
    }