#!/usr/bin/env python3
"""
CodeCollab Swarm - Interactive Task Processor
Run AI agents to solve development tasks
"""

import sys
import argparse
import time
from typing import Optional
from agents.swarm_orchestrator import CodeCollabSwarm
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Colors:
    """Terminal colors for better output"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_banner():
    """Print application banner"""
    banner = f"""
{Colors.CYAN}{'='*80}
{Colors.BOLD}                    🤖 CodeCollab Swarm Orchestrator 🤖{Colors.ENDC}
{Colors.CYAN}{'='*80}{Colors.ENDC}
{Colors.YELLOW}AI-powered development assistant with 5 specialized agents:{Colors.ENDC}
  1. 📋 Requirements Agent - Analyzes and structures requirements
  2. 🔍 Context Agent      - Understands codebase and patterns
  3. 🔨 Builder Agent      - Writes production-quality code
  4. ✅ Quality Agent      - Verifies and tests implementation
  5. 🎯 Escalation Agent   - Decides completion or human handoff
{Colors.CYAN}{'='*80}{Colors.ENDC}
    """
    print(banner)


def print_task_header(task: str):
    """Print task header"""
    print(f"\n{Colors.BLUE}{'─'*80}{Colors.ENDC}")
    print(f"{Colors.BOLD}📝 TASK:{Colors.ENDC} {task}")
    print(f"{Colors.BLUE}{'─'*80}{Colors.ENDC}\n")


def print_agent_flow(agents: list):
    """Print agent handoff flow"""
    if not agents:
        return

    print(f"\n{Colors.GREEN}🔀 AGENT FLOW ({len(agents)} agents):{Colors.ENDC}")
    for i, agent in enumerate(agents, 1):
        if i < len(agents):
            print(f"   {i}. {agent} → ")
        else:
            print(f"   {i}. {agent} ✓")


def print_result(result: dict):
    """Print execution result"""
    print(f"\n{Colors.CYAN}{'─'*80}{Colors.ENDC}")
    print(f"{Colors.BOLD}📊 EXECUTION RESULT{Colors.ENDC}")
    print(f"{Colors.CYAN}{'─'*80}{Colors.ENDC}")

    # Success status
    success = result.get('success', False)
    status_color = Colors.GREEN if success else Colors.RED
    status_icon = "✅" if success else "❌"
    print(f"{status_icon} Status: {status_color}{'SUCCESS' if success else 'FAILED'}{Colors.ENDC}")

    # Timing
    exec_time = result.get('execution_time_ms', result.get('latency_ms', 0)) / 1000
    print(f"⏱️  Time: {exec_time:.2f} seconds")

    # Tokens
    tokens = result.get('tokens_used', result.get('total_tokens', 0))
    if tokens:
        print(f"🎫 Tokens: {tokens}")

    # Agent sequence
    agents = result.get('agent_sequence', [])
    if agents:
        print_agent_flow(agents)

    # Decision
    decision = result.get('final_decision', result.get('decision', ''))
    if decision:
        decision_color = Colors.GREEN if decision == 'COMPLETE' else Colors.YELLOW
        print(f"\n🎯 Decision: {decision_color}{decision}{Colors.ENDC}")

    # Final result/code
    print(f"\n{Colors.BOLD}📋 GENERATED CODE:{Colors.ENDC}")
    print(f"{Colors.CYAN}{'─'*80}{Colors.ENDC}")

    # Try to get code first, then final_result
    code = result.get('code', result.get('final_result', 'No result available'))

    # If it's a dict (from mock), extract the actual result
    if isinstance(code, dict):
        code = code.get('code', code.get('final_result', str(code)))

    # Format code nicely
    if isinstance(code, str) and code.strip():
        # Truncate if too long
        if len(code) > 2000:
            print(code[:2000])
            print(f"\n{Colors.YELLOW}... (output truncated, showing first 2000 chars){Colors.ENDC}")
        else:
            print(code)
    else:
        print("No code generated")

    print(f"{Colors.CYAN}{'─'*80}{Colors.ENDC}")


def process_task(swarm: CodeCollabSwarm, task: str):
    """Process a single task"""
    print_task_header(task)

    print(f"{Colors.YELLOW}🔄 Processing with swarm agents...{Colors.ENDC}\n")

    try:
        # Start timer
        start = time.time()

        # Process task
        result = swarm.process_task(task)

        # Calculate time if not in result
        if 'execution_time_ms' not in result:
            result['execution_time_ms'] = (time.time() - start) * 1000

        # Print result
        print_result(result)

        return result

    except Exception as e:
        print(f"{Colors.RED}❌ Error processing task: {e}{Colors.ENDC}")
        return {"success": False, "error": str(e)}


def interactive_mode(swarm: CodeCollabSwarm):
    """Run in interactive mode"""
    print(f"\n{Colors.GREEN}🎮 INTERACTIVE MODE{Colors.ENDC}")
    print("Enter your development tasks. Type 'exit' or 'quit' to stop.")
    print("Type 'help' for example tasks.\n")

    while True:
        try:
            # Get user input
            print(f"{Colors.YELLOW}{'─'*80}{Colors.ENDC}")
            task = input(f"{Colors.BOLD}Enter task > {Colors.ENDC}").strip()

            # Check for exit
            if task.lower() in ['exit', 'quit', 'q']:
                print(f"\n{Colors.CYAN}👋 Goodbye!{Colors.ENDC}")
                break

            # Check for help
            if task.lower() == 'help':
                print_help()
                continue

            # Skip empty input
            if not task:
                continue

            # Process the task
            process_task(swarm, task)

            # Ask if user wants to continue
            print(f"\n{Colors.YELLOW}Press Enter to continue or type 'exit' to quit...{Colors.ENDC}")
            if input().lower() in ['exit', 'quit', 'q']:
                print(f"\n{Colors.CYAN}👋 Goodbye!{Colors.ENDC}")
                break

        except KeyboardInterrupt:
            print(f"\n\n{Colors.CYAN}👋 Interrupted. Goodbye!{Colors.ENDC}")
            break
        except Exception as e:
            print(f"{Colors.RED}Error: {e}{Colors.ENDC}")


def print_help():
    """Print help with example tasks"""
    help_text = f"""
{Colors.CYAN}📚 EXAMPLE TASKS:{Colors.ENDC}

{Colors.BOLD}Simple Tasks:{Colors.ENDC}
  • Create a function to calculate factorial
  • Write a class for managing a todo list
  • Fix the bug in the login function
  • Add input validation to the user registration

{Colors.BOLD}Medium Tasks:{Colors.ENDC}
  • Create a REST API endpoint for user authentication
  • Implement a binary search tree with insertion and deletion
  • Write a function to parse and validate email addresses
  • Add caching to the database query function

{Colors.BOLD}Complex Tasks:{Colors.ENDC}
  • Design a microservice for payment processing
  • Refactor the monolithic application into modules
  • Implement real-time chat with WebSocket
  • Create a CI/CD pipeline for automated deployment

{Colors.YELLOW}Tip: Be specific about requirements for better results!{Colors.ENDC}
    """
    print(help_text)


def main():
    """Main entry point"""
    # Parse arguments
    parser = argparse.ArgumentParser(
        description='CodeCollab Swarm - AI-powered development assistant'
    )
    parser.add_argument(
        'task',
        nargs='?',
        help='Development task to process (optional, enters interactive mode if not provided)'
    )
    parser.add_argument(
        '--no-banner',
        action='store_true',
        help='Skip the banner display'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output result as JSON'
    )

    args = parser.parse_args()

    # Show banner unless disabled
    if not args.no_banner:
        print_banner()

    # Initialize swarm
    print(f"{Colors.YELLOW}📦 Initializing swarm agents...{Colors.ENDC}")
    try:
        swarm = CodeCollabSwarm()
        print(f"{Colors.GREEN}✅ Swarm ready!{Colors.ENDC}\n")
    except Exception as e:
        print(f"{Colors.RED}❌ Failed to initialize swarm: {e}{Colors.ENDC}")
        sys.exit(1)

    # Process based on mode
    if args.task:
        # Single task mode
        result = process_task(swarm, args.task)

        # Output as JSON if requested
        if args.json:
            import json
            print("\n" + json.dumps(result, indent=2))
    else:
        # Interactive mode
        interactive_mode(swarm)


if __name__ == "__main__":
    main()