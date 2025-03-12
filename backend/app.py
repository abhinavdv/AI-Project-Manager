import os
import json
import argparse
import sys
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from services.azure_service import AzureService
from services.github_service import GitHubService

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize services
azure_service = AzureService()
github_service = GitHubService()

# Routes for serving the frontend
@app.route('/')
def index():
    """Render the main application page."""
    return render_template('index.html')

# API routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the API is running."""
    return jsonify({"status": "healthy"}), 200

@app.route('/api/analyze', methods=['POST'])
def analyze_prompt():
    """Analyze the user's prompt and generate big goals."""
    data = request.json
    prompt = data.get('prompt', '')
    
    # Validate input
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    
    try:
        goals = azure_service.generate_goals(prompt)
        return jsonify({"big_goals": goals})
    except Exception as e:
        print(f"Error generating goals: {str(e)}")
        error_message = str(e)
        if "Azure OpenAI credentials not properly configured" in error_message:
            return jsonify({"error": "Azure API is not properly configured. Please set up your Azure OpenAI credentials."}), 500
        return jsonify({"error": f"Failed to generate goals: {error_message}"}), 500

@app.route('/api/break-down-goal', methods=['POST'])
def break_down_goal():
    """Break down a big goal into smaller, more specific goals."""
    data = request.json
    goal_id = data.get('goal_id')
    goal_title = data.get('goal_title', '')
    goal_description = data.get('goal_description', '')
    
    # Validate input
    if not goal_id or not goal_title:
        return jsonify({"error": "Missing goal information"}), 400
    
    try:
        smaller_goals = azure_service.break_down_goal(goal_id, goal_title, goal_description)
        return jsonify({"smaller_goals": smaller_goals})
    except Exception as e:
        print(f"Error breaking down goal: {str(e)}")
        error_message = str(e)
        if "Azure OpenAI credentials not properly configured" in error_message:
            return jsonify({"error": "Azure API is not properly configured. Please set up your Azure OpenAI credentials."}), 500
        return jsonify({"error": f"Failed to break down goal: {error_message}"}), 500

@app.route('/api/generate-repo-info', methods=['POST'])
def generate_repo_info():
    """Generate repository name and description based on the prompt and goals."""
    data = request.json
    prompt = data.get('prompt', '')
    goals = data.get('goals', '')
    
    # Validate input
    if not prompt and not goals:
        return jsonify({"error": "No prompt or goals provided"}), 400
    
    try:
        repo_info = azure_service.generate_repo_info(prompt, goals)
        return jsonify(repo_info)
    except Exception as e:
        print(f"Error generating repository info: {str(e)}")
        error_message = str(e)
        if "Azure OpenAI credentials not properly configured" in error_message:
            return jsonify({"error": "Azure API is not properly configured. Please set up your Azure OpenAI credentials."}), 500
        return jsonify({"error": f"Failed to generate repository info: {error_message}"}), 500

@app.route('/api/create-repository', methods=['POST'])
def create_repository():
    """Create a new GitHub repository."""
    data = request.json
    repo_name = data.get('repo_name', '')
    repo_description = data.get('repo_description', '')
    
    # Validate input
    if not repo_name:
        return jsonify({"error": "Repository name is required"}), 400
    
    try:
        repository = github_service.create_repository(repo_name, repo_description)
        return jsonify({"success": True, "repository": repository})
    except Exception as e:
        print(f"Error creating repository: {str(e)}")
        error_message = str(e)
        if "GitHub token is not configured" in error_message:
            return jsonify({"error": "GitHub API is not properly configured. Please set up your GitHub token."}), 500
        elif "already exists" in error_message.lower():
            return jsonify({"error": f"Repository '{repo_name}' already exists. Please choose a different name."}), 400
        return jsonify({"error": f"Failed to create repository: {error_message}"}), 500

@app.route('/api/create-issues', methods=['POST'])
def create_issues():
    """Create GitHub issues for goals."""
    data = request.json
    repo_name = data.get('repo_name', '')
    goals = data.get('goals', [])
    
    # Validate input
    if not repo_name:
        return jsonify({"error": "Repository name is required"}), 400
    
    if not goals:
        return jsonify({"error": "At least one goal is required"}), 400
    
    try:
        issues = github_service.create_issues(repo_name, goals)
        return jsonify({"success": True, "issues": issues})
    except Exception as e:
        print(f"Error creating issues: {str(e)}")
        error_message = str(e)
        if "GitHub token is not configured" in error_message:
            return jsonify({"error": "GitHub API is not properly configured. Please set up your GitHub token."}), 500
        elif "Not Found" in error_message:
            return jsonify({"error": f"Repository '{repo_name}' not found. Please check the repository name."}), 404
        return jsonify({"error": f"Failed to create issues: {error_message}"}), 500

if __name__ == '__main__':
    # Check if port is provided as command line argument
    port = 5000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port: {sys.argv[1]}. Using default port 5000.")
    
    print(f"Starting server on http://0.0.0.0:{port}")
    app.run(debug=True, host='0.0.0.0', port=port) 