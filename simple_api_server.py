#!/usr/bin/env python3
"""
Simple HTTP API server for CodeCollab Swarm UI (no external dependencies)
Uses only Python standard library
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sys
import os
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.swarm_orchestrator import CodeCollabSwarm

# Initialize swarm
try:
    swarm = CodeCollabSwarm()
    print("✅ Swarm orchestrator initialized")
except Exception as e:
    print(f"⚠️ Using mock swarm: {e}")
    swarm = None

# Task history
task_history = []

class SwarmAPIHandler(BaseHTTPRequestHandler):
    """Simple HTTP handler for Swarm API"""

    def _set_headers(self, status=200, content_type='application/json'):
        """Set response headers"""
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _send_json(self, data, status=200):
        """Send JSON response"""
        self._set_headers(status)
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self._set_headers(200)

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)

        if parsed_path.path == '/':
            self._send_json({
                "service": "CodeCollab Swarm API",
                "version": "1.0.0",
                "status": "online"
            })

        elif parsed_path.path == '/api/health':
            self._send_json({
                "status": "healthy" if swarm else "degraded",
                "swarm_available": swarm is not None,
                "agents_count": 5,
                "timestamp": "2024-10-11T12:00:00"
            })

        elif parsed_path.path == '/api/agents':
            agents = [
                {"name": "RequirementsAgent", "icon": "📋", "description": "Analyzes and structures requirements", "status": "ready"},
                {"name": "ContextAgent", "icon": "🔍", "description": "Understands codebase and patterns", "status": "ready"},
                {"name": "BuilderAgent", "icon": "🔨", "description": "Writes production-quality code", "status": "ready"},
                {"name": "QualityAgent", "icon": "✅", "description": "Verifies and tests implementation", "status": "ready"},
                {"name": "EscalationAgent", "icon": "🎯", "description": "Decides completion or human handoff", "status": "ready"}
            ]
            self._send_json(agents)

        elif parsed_path.path == '/api/history':
            self._send_json(task_history[-10:])

        else:
            self._send_json({"error": "Not found"}, 404)

    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)

        if parsed_path.path == '/api/process':
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)

            try:
                data = json.loads(post_data)
                task_description = data.get('task', '')
                github_url = data.get('github_url', '')
                requirements = data.get('requirements', '')

                # Combine task description with GitHub URL if provided
                full_task = task_description
                if github_url:
                    full_task += f"\n\nGitHub Repository: {github_url}"
                if requirements:
                    full_task += f"\n\nAdditional Requirements: {requirements}"

                if swarm and task_description:
                    # Process task with swarm (GitHub URL will be parsed by ContextAgent)
                    result = swarm.process_task(full_task)

                    # Build response
                    response = {
                        "success": result.get("success", False),
                        "task_description": task_description,
                        "github_url": github_url,
                        "requirements": requirements,
                        "agent_sequence": result.get("agent_sequence", [
                            "RequirementsAgent", "ContextAgent",
                            "BuilderAgent", "QualityAgent", "EscalationAgent"
                        ]),
                        "agent_outputs": result.get("agent_outputs"),
                        "final_result": result.get("final_result"),
                        "code": result.get("code"),
                        "final_decision": result.get("final_decision", "COMPLETE"),
                        "execution_time_ms": result.get("execution_time_ms", 2500),
                        "tokens_used": result.get("tokens_used", 500),
                        "payment": result.get("payment", {"amount": 0.05, "currency": "USD"})
                    }
                else:
                    # Mock response
                    is_complex = any(word in task_description.lower()
                                    for word in ['microservice', 'architecture', 'distributed'])
                    has_github = bool(github_url)

                    response = {
                        "success": True,
                        "task_description": task_description,
                        "github_url": github_url,
                        "requirements": requirements,
                        "agent_sequence": ["RequirementsAgent", "ContextAgent",
                                         "BuilderAgent", "QualityAgent", "EscalationAgent"],
                        "final_decision": "ESCALATE" if is_complex else "COMPLETE",
                        "code": """def process_task(task: str) -> str:
    \"\"\"Process the given task\"\"\"
    # Implementation here
    return f"Processed: {task}\"""" if not is_complex else None,
                        "execution_time_ms": 2500,
                        "tokens_used": 750,
                        "github_analyzed": has_github
                    }

                # Store in history
                task_history.append(response)
                if len(task_history) > 50:
                    task_history.pop(0)

                self._send_json(response)

            except Exception as e:
                self._send_json({"error": str(e)}, 500)

        elif parsed_path.path == '/api/clear':
            task_history.clear()
            self._send_json({"message": "History cleared", "success": True})

        else:
            self._send_json({"error": "Not found"}, 404)

    def log_message(self, format, *args):
        """Override to reduce console output"""
        if args[1] != '200':
            print(f"{self.address_string()} - [{self.log_date_time_string()}] {format%args}")

def run_server(port=8000):
    """Run the HTTP server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, SwarmAPIHandler)

    print(f"""
╔════════════════════════════════════════════╗
║   🤖 CodeCollab Swarm API Server          ║
╚════════════════════════════════════════════╝

  Server running on: http://localhost:{port}

  Endpoints:
    GET  /api/health    - Health check
    GET  /api/agents    - List agents
    POST /api/process   - Process task
    GET  /api/history   - Task history

  Press Ctrl+C to stop the server
""")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n✅ Server stopped")
        sys.exit(0)

if __name__ == '__main__':
    run_server()