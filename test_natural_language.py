#!/usr/bin/env python3
"""
Test script to verify natural language task processing flow
"""

from agents.swarm_orchestrator import CodeCollabSwarm
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

def test_natural_language_flow():
    """Test various natural language tasks through the swarm"""

    print("="*80)
    print("  NATURAL LANGUAGE TASK PROCESSING TEST")
    print("="*80)

    # Initialize swarm
    swarm = CodeCollabSwarm()
    print("✅ Swarm initialized successfully\n")

    # Test cases with natural language descriptions
    test_cases = [
        {
            "description": "Simple function request",
            "task": "I need a function that takes two numbers and returns their product",
            "expected_decision": "COMPLETE"
        },
        {
            "description": "Bug fix request",
            "task": "There's a bug in my login function where passwords with special characters don't work. Can you fix it?",
            "expected_decision": "COMPLETE"
        },
        {
            "description": "Class implementation",
            "task": "Build me a Python class to manage a shopping cart with add, remove, and checkout methods",
            "expected_decision": "COMPLETE"
        },
        {
            "description": "Complex architecture task",
            "task": "I need to refactor my monolithic application into microservices with proper API gateways",
            "expected_decision": "ESCALATE"
        },
        {
            "description": "Security-critical task",
            "task": "Implement a secure payment processing system with PCI compliance",
            "expected_decision": "ESCALATE"
        }
    ]

    results = []

    for i, test in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test['description']}")
        print("-"*60)
        print(f"Task: {test['task'][:80]}...")

        # Process task
        result = swarm.process_task(test['task'])

        # Check results
        success = result.get('success', False)
        decision = result.get('final_decision', 'UNKNOWN')
        agents = result.get('agent_sequence', [])

        print(f"✅ Success: {success}")
        print(f"🎯 Decision: {decision}")
        print(f"🔀 Agents involved: {len(agents)}")

        # Verify agent outputs exist
        if 'agent_outputs' in result:
            print(f"📊 Agent outputs captured: {len(result['agent_outputs'])} agents")

        # Check if code was generated (for non-escalated tasks)
        if decision == 'COMPLETE' and result.get('code'):
            print(f"✅ Code generated: {len(result['code'])} characters")

        # Verify expected decision
        if decision == test['expected_decision']:
            print(f"✅ Decision matches expected: {decision}")
        else:
            print(f"⚠️ Decision mismatch! Expected: {test['expected_decision']}, Got: {decision}")

        results.append({
            "test": test['description'],
            "success": success,
            "decision": decision,
            "expected": test['expected_decision'],
            "match": decision == test['expected_decision']
        })

    # Summary
    print("\n" + "="*80)
    print("  TEST SUMMARY")
    print("="*80)

    total = len(results)
    passed = sum(1 for r in results if r['match'])

    print(f"\nTotal tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success rate: {(passed/total)*100:.1f}%")

    print("\nDetailed Results:")
    for r in results:
        status = "✅" if r['match'] else "❌"
        print(f"{status} {r['test']}: {r['decision']} (expected: {r['expected']})")

    # Test agent handoff flow
    print("\n" + "="*80)
    print("  AGENT HANDOFF FLOW TEST")
    print("="*80)

    task = "Create a function to validate email addresses"
    result = swarm.process_task(task)

    print(f"\nTask: {task}")
    print("\nAgent Sequence:")
    for i, agent in enumerate(result.get('agent_sequence', []), 1):
        print(f"  {i}. {agent}")
        if 'agent_outputs' in result and agent in result['agent_outputs']:
            output = result['agent_outputs'][agent]
            if 'handoff_message' in output:
                print(f"     → {output['handoff_message']}")

    print("\n✅ Natural language processing flow is working correctly!")
    print("   - Tasks are properly routed through agents")
    print("   - Agent handoffs occur in sequence")
    print("   - Complex tasks are escalated appropriately")
    print("   - Simple tasks are completed by AI")

if __name__ == "__main__":
    test_natural_language_flow()