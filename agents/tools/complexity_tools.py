"""
Task complexity analysis tools
"""

from typing import Dict, Any, List


def analyze_task_complexity(description: str, requirements: Dict = None) -> Dict[str, Any]:
    """
    Analyze task complexity to determine effort and escalation needs.
    
    Args:
        description: Task description
        requirements: Structured requirements (if available)
        
    Returns:
        Complexity analysis with recommendations
    """
    # Word count analysis
    word_count = len(description.split())
    
    # Keyword analysis for complexity indicators
    complex_keywords = [
        'architecture', 'refactor', 'migration', 'scalability',
        'distributed', 'microservices', 'security', 'authentication',
        'authorization', 'performance', 'optimization', 'integration'
    ]
    
    simple_keywords = [
        'fix', 'bug', 'typo', 'update', 'change', 'add', 'remove',
        'button', 'text', 'color', 'style'
    ]
    
    description_lower = description.lower()
    
    complex_count = sum(1 for kw in complex_keywords if kw in description_lower)
    simple_count = sum(1 for kw in simple_keywords if kw in description_lower)
    
    # Determine complexity
    if word_count < 30 and simple_count > complex_count:
        complexity = "simple"
        estimated_time_minutes = 5
        ai_payment = "0.01"
        human_payment = "0"
        requires_human = False
    elif word_count < 100 and complex_count <= 2:
        complexity = "medium"
        estimated_time_minutes = 15
        ai_payment = "0.05"
        human_payment = "0"
        requires_human = False
    else:
        complexity = "complex"
        estimated_time_minutes = 60
        ai_payment = "0.10"
        human_payment = "250.00"
        requires_human = complex_count > 3
    
    return {
        "complexity": complexity,
        "word_count": word_count,
        "complex_indicators": complex_count,
        "simple_indicators": simple_count,
        "estimated_time_minutes": estimated_time_minutes,
        "estimated_ai_payment": ai_payment,
        "estimated_human_payment": human_payment,
        "requires_human": requires_human,
        "reasoning": f"Task has {word_count} words with {complex_count} complexity indicators"
    }


def estimate_effort(requirements: Dict, context: Dict = None) -> Dict[str, Any]:
    """
    Estimate effort required for implementation.
    
    Args:
        requirements: Structured requirements
        context: Codebase context
        
    Returns:
        Effort estimation
    """
    # Parse requirements
    num_features = requirements.get("feature_count", 1)
    num_tests = requirements.get("test_count", 3)
    has_integration = requirements.get("requires_integration", False)
    
    # Calculate effort points
    effort_points = num_features * 2 + num_tests * 1
    if has_integration:
        effort_points += 5
    
    # Map to time estimate
    if effort_points < 5:
        time_estimate = "15-30 minutes"
        complexity = "simple"
    elif effort_points < 15:
        time_estimate = "30-60 minutes"
        complexity = "medium"
    else:
        time_estimate = "1-3 hours"
        complexity = "complex"
    
    return {
        "effort_points": effort_points,
        "time_estimate": time_estimate,
        "complexity": complexity,
        "breakdown": {
            "features": num_features,
            "tests": num_tests,
            "integration": has_integration
        }
    }
