"""
Testing and quality assurance tools
"""

from typing import Dict, Any, List
import subprocess
import tempfile
import os


def run_tests(test_code: str, test_file_name: str = "test_temp.py") -> Dict[str, Any]:
    """
    Execute test code and return results.
    
    Args:
        test_code: Python test code to execute
        test_file_name: Name for temporary test file
        
    Returns:
        Test execution results
    """
    try:
        # Create temporary test file
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.py',
            delete=False
        ) as f:
            f.write(test_code)
            temp_file = f.name
        
        # Run pytest on the file
        result = subprocess.run(
            ['pytest', temp_file, '-v', '--tb=short'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        # Parse output
        output = result.stdout + result.stderr
        passed = output.count(' PASSED')
        failed = output.count(' FAILED')
        
        # Cleanup
        os.unlink(temp_file)
        
        return {
            "success": result.returncode == 0,
            "passed": passed,
            "failed": failed,
            "output": output[:500],  # Truncate long output
            "return_code": result.returncode
        }
    
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "passed": 0,
            "failed": 0,
            "output": "Tests timed out after 30 seconds",
            "return_code": -1
        }
    except Exception as e:
        return {
            "success": False,
            "passed": 0,
            "failed": 0,
            "output": f"Error running tests: {str(e)}",
            "return_code": -1
        }


def calculate_coverage(source_code: str, test_code: str) -> Dict[str, Any]:
    """
    Calculate test coverage for code.
    
    Args:
        source_code: Source code to test
        test_code: Test code
        
    Returns:
        Coverage metrics
    """
    # Simplified coverage calculation
    # In production, would use coverage.py
    
    source_lines = [l for l in source_code.split('\n') if l.strip()]
    test_lines = [l for l in test_code.split('\n') if l.strip()]
    
    # Estimate coverage based on test/source ratio
    coverage_estimate = min(100, (len(test_lines) / max(len(source_lines), 1)) * 50)
    
    return {
        "coverage_percentage": round(coverage_estimate, 2),
        "source_lines": len(source_lines),
        "test_lines": len(test_lines),
        "estimated": True
    }


def lint_code(code: str, language: str = "python") -> Dict[str, List[str]]:
    """
    Run linting checks on code.
    
    Args:
        code: Source code to lint
        language: Programming language
        
    Returns:
        Linting issues found
    """
    issues = {
        "errors": [],
        "warnings": [],
        "style": []
    }
    
    lines = code.split('\n')
    
    # Basic style checks
    for i, line in enumerate(lines, 1):
        # Line length
        if len(line) > 100:
            issues["style"].append(f"Line {i}: Exceeds 100 characters")
        
        # Trailing whitespace
        if line.endswith(' ') or line.endswith('\t'):
            issues["style"].append(f"Line {i}: Trailing whitespace")
        
        # Multiple statements on one line
        if ';' in line and not line.strip().startswith('#'):
            issues["warnings"].append(f"Line {i}: Multiple statements on one line")
    
    # Check for missing docstrings
    if 'def ' in code and '"""' not in code and "'''" not in code:
        issues["warnings"].append("Functions missing docstrings")
    
    return issues
