import os
import json
import argparse
import sys
import base64
from pydub import AudioSegment
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from services.azure_service import AzureService
from services.github_service import GitHubService
from openai import AzureOpenAI
import tempfile
from prompts import AUDIO_TRANSCRIPTION_PROMPT, MODIFY_TASKS_VOICE_PROMPT

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize services
azure_service = AzureService()
github_service = GitHubService()

# Azure OpenAI configuration
base_endpoint = os.getenv("ENDPOINT_URL", "https://general-github-manager.openai.azure.com/")
text_deployment = os.getenv("DEPLOYMENT_NAME", "gpt-4o")
audio_endpoint = "https://general-github-manager.openai.azure.com/"  # Base endpoint only
subscription_key = os.getenv("AZURE_OPENAI_KEY")

# Initialize Azure OpenAI clients
text_client = AzureOpenAI(
    azure_endpoint=base_endpoint,
    api_key=subscription_key,
    api_version="2024-02-15-preview",
)

audio_client = AzureOpenAI(
    azure_endpoint=audio_endpoint,
    api_key=subscription_key,
    api_version="2024-02-15-preview",
)

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
    
    print(f"Received request to generate repo info with prompt: {prompt[:100]}... and goals: {goals[:100]}...")
    
    # Validate input
    if not prompt and not goals:
        print("Error: No prompt or goals provided")
        return jsonify({"error": "No prompt or goals provided"}), 400
    
    try:
        repo_info = azure_service.generate_repo_info(prompt, goals)
        print(f"Generated repo info: {repo_info}")
        
        # Ensure the response has the expected format
        if not isinstance(repo_info, dict) or 'repo_name' not in repo_info or 'description' not in repo_info:
            print(f"Warning: Repo info has incorrect format: {repo_info}")
            # Fix the format if needed
            if isinstance(repo_info, dict):
                if 'name' in repo_info and 'repo_name' not in repo_info:
                    repo_info['repo_name'] = repo_info['name']
                if 'repo_description' in repo_info and 'description' not in repo_info:
                    repo_info['description'] = repo_info['repo_description']
            else:
                # Provide fallback values
                repo_info = {
                    "repo_name": "github-project",
                    "description": "A GitHub project."
                }
        
        print(f"Returning repo info: {repo_info}")
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

@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio():
    try:
        # Debug: Print configuration
        print(f"Using audio endpoint: {audio_endpoint}")
        print(f"Using audio deployment: gpt-4o-mini-audio-preview")
        
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        
        # Save the file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_file.save(temp_audio.name)
            
            try:
                # Convert to proper WAV format using pydub
                audio = AudioSegment.from_file(temp_audio.name)
                
                # Export as proper WAV file
                with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as proper_wav:
                    # Export with standard WAV parameters
                    audio.export(proper_wav.name, format='wav', 
                               parameters=[
                                   "-acodec", "pcm_s16le",  # 16-bit PCM
                                   "-ac", "1",              # mono
                                   "-ar", "16000"           # 16kHz sample rate
                               ])
                    
                    # Read the properly formatted WAV file
                    with open(proper_wav.name, 'rb') as audio_file:
                        audio_data = base64.b64encode(audio_file.read()).decode('utf-8')
                    
                    # Clean up the proper WAV file
                    os.unlink(proper_wav.name)
                
                # Create the messages for the API call with the exact required structure
                messages = [
                    {
                        "role": "system",
                        "content": [
                            {
                                "type": "text",
                                "text": AUDIO_TRANSCRIPTION_PROMPT
                            }
                        ]
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "\n"
                            },
                            {
                                "type": "input_audio",
                                "input_audio": {
                                    "data": audio_data,
                                    "format": "wav"
                                }
                            }
                        ]
                    },
                    {
                        "role": "assistant",
                        "content": []
                    }
                ]
                
                # Call the Azure OpenAI API with audio deployment
                response = audio_client.chat.completions.create(
                    model="gpt-4o-mini-audio-preview",
                    messages=messages,
                    temperature=0.7,
                    top_p=0.95,
                    max_tokens=5000
                )
                
                # Clean up the original temporary file
                os.unlink(temp_audio.name)
                
                # Extract the transcribed text
                transcribed_text = response.choices[0].message.content
                return jsonify({'text': transcribed_text})
                
            except Exception as e:
                # Clean up the temporary files in case of error
                if os.path.exists(temp_audio.name):
                    os.unlink(temp_audio.name)
                raise e
                
    except Exception as e:
        print(f"Error in transcribe_audio: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/voice-chat', methods=['POST'])
def voice_chat():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
            
        audio_file = request.files['audio']
        task_id = request.form.get('taskId')
        conversation = json.loads(request.form.get('conversation', '[]'))
        
        # Process audio file to get transcription
        transcription = azure_service.transcribe_audio(audio_file)
        
        # Get AI response based on transcription and conversation history
        response = azure_service.process_voice_chat(
            transcription=transcription,
            task_id=task_id,
            conversation=conversation
        )
        
        return jsonify({
            'transcription': transcription,
            'response': response.get('message', ''),
            'updatedTask': response.get('updatedTask'),
            'updatedSubTasks': response.get('updatedSubTasks')
        })
        
    except Exception as e:
        print(f"Error in voice chat: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/modify-tasks-voice', methods=['POST'])
def modify_tasks_voice():
    """Modify tasks using voice input"""
    try:
        # Debug: Print configuration
        print(f"Using audio endpoint: {audio_endpoint}")
        print(f"Using audio deployment: gpt-4o-mini-audio-preview")
        
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        current_tasks = request.form.get('currentTasks', '[]')
        
        # Save the file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_file.save(temp_audio.name)
            
            try:
                # Convert to proper WAV format using pydub
                audio = AudioSegment.from_file(temp_audio.name)
                
                # Export as proper WAV file
                with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as proper_wav:
                    # Export with standard WAV parameters
                    audio.export(proper_wav.name, format='wav', 
                               parameters=[
                                   "-acodec", "pcm_s16le",  # 16-bit PCM
                                   "-ac", "1",              # mono
                                   "-ar", "16000"           # 16kHz sample rate
                               ])
                    
                    # Read the properly formatted WAV file
                    with open(proper_wav.name, 'rb') as audio_file:
                        audio_data = base64.b64encode(audio_file.read()).decode('utf-8')
                    
                    # Clean up the proper WAV file
                    os.unlink(proper_wav.name)
                
                # Create the messages for the API call with the exact required structure
                # Include the current tasks JSON in the prompt
                prompt_with_json = MODIFY_TASKS_VOICE_PROMPT + "\n" + current_tasks
                
                messages = [
                    {
                        "role": "system",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt_with_json
                            }
                        ]
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "\n"
                            },
                            {
                                "type": "input_audio",
                                "input_audio": {
                                    "data": audio_data,
                                    "format": "wav"
                                }
                            }
                        ]
                    },
                    {
                        "role": "assistant",
                        "content": []
                    }
                ]
                
                # Call the Azure OpenAI API with audio deployment
                response = audio_client.chat.completions.create(
                    model="gpt-4o-mini-audio-preview",
                    messages=messages,
                    temperature=0.7,
                    top_p=0.95,
                    max_tokens=5000
                )
                
                # Clean up the original temporary file
                os.unlink(temp_audio.name)
                
                # Extract the response from the API
                ai_response = response.choices[0].message.content
                
                # Process the API response to extract the updated tasks JSON
                try:
                    print(f"Raw AI response: {ai_response[:500]}...")
                    
                    # First, check if the response is already valid JSON
                    try:
                        updated_tasks = json.loads(ai_response)
                        print("Successfully parsed entire response as JSON")
                    except json.JSONDecodeError:
                        print("Response is not valid JSON, trying to extract JSON from text...")
                        # If not, try to extract JSON from the text response
                        import re

                        # Try to extract JSON from a code block
                        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', ai_response)
                        if json_match:
                            json_str = json_match.group(1).strip()
                            print(f"Found JSON in code block: {json_str[:200]}...")
                            try:
                                updated_tasks = json.loads(json_str)
                                print("Successfully parsed JSON from code block")
                            except json.JSONDecodeError:
                                # If code block extraction fails, try other methods
                                print(f"Failed to parse JSON from code block")
                        else:
                            # Try to extract JSON from the text by looking for array/object patterns
                            print("No code block found, looking for JSON patterns")
                            json_pattern = re.search(r'(\[.*\]|\{.*\})', ai_response, re.DOTALL)
                            if json_pattern:
                                try:
                                    json_str = json_pattern.group(1).strip()
                                    print(f"Found JSON pattern: {json_str[:200]}...")
                                    updated_tasks = json.loads(json_str)
                                    print("Successfully parsed JSON from pattern")
                                except json.JSONDecodeError:
                                    print(f"Failed to parse JSON from pattern")
                                    updated_tasks = json.loads(current_tasks)
                            else:
                                # If we can't extract JSON, return the original tasks
                                print("No JSON pattern found in response")
                                updated_tasks = json.loads(current_tasks)
                    
                    # Get the first line as transcription (or fallback to the whole response)
                    transcription = ai_response.split('\n')[0] if '\n' in ai_response else ai_response
                    
                    # Log success and return the response
                    print(f"Successfully processed voice modification: {transcription[:100]}")
                    return jsonify({
                        'transcription': transcription,
                        'updatedTasks': updated_tasks
                    })
                    
                except Exception as json_error:
                    print(f"Error parsing response JSON: {str(json_error)}")
                    print(f"Raw response: {ai_response}")
                    # Return the original tasks on error
                    return jsonify({
                        'transcription': ai_response,
                        'updatedTasks': json.loads(current_tasks)
                    })
                
            except Exception as e:
                # Clean up the temporary files in case of error
                if os.path.exists(temp_audio.name):
                    os.unlink(temp_audio.name)
                raise e
                
    except Exception as e:
        print(f"Error in modify-tasks-voice: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/repositories', methods=['GET'])
def get_repositories():
    """Get list of user's GitHub repositories."""
    try:
        repos = github_service.get_user_repositories()
        return jsonify({"success": True, "repositories": repos})
    except Exception as e:
        print(f"Error fetching repositories: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/repository/<repo_name>/tasks', methods=['GET'])
def get_repository_tasks(repo_name):
    """Get tasks for a repository by analyzing its issues."""
    try:
        # Get all issues for the repository
        issues = github_service.get_repository_issues(repo_name)
        
        # Process issues into tasks
        tasks = []
        for issue in issues:
            task = {
                'number': issue['id'],
                'title': issue['title'],
                'body': issue['description'],
                'is_parent': issue['is_broad_goal'],
                'parent_id': None
            }
            
            # If this is a specific goal (sub-task), find its parent
            if issue['is_specific_goal'] and issue['description']:
                # Look for parent reference in the description
                for parent in issues:
                    if parent['is_broad_goal'] and f"#{parent['id']}" in issue['description']:
                        task['parent_id'] = parent['id']
                        break
            
            tasks.append(task)
        
        return jsonify({
            "success": True,
            "tasks": tasks
        })
    except Exception as e:
        print(f"Error fetching repository tasks: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/repository/<repo_name>/issues', methods=['GET'])
def get_repository_issues(repo_name):
    """Get all issues for a repository."""
    state = request.args.get('state', 'all')
    try:
        issues = github_service.get_repository_issues(repo_name, state)
        return jsonify({"success": True, "issues": issues})
    except Exception as e:
        print(f"Error fetching issues: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/repository/<repo_name>/issues/<int:issue_number>', methods=['PUT'])
def update_repository_issue(repo_name, issue_number):
    """Update an existing issue."""
    data = request.json
    try:
        updated_issue = github_service.update_issue(
            repo_name,
            issue_number,
            title=data.get('title'),
            body=data.get('description'),
            state=data.get('state')
        )
        return jsonify({"success": True, "issue": updated_issue})
    except Exception as e:
        print(f"Error updating issue: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/repository/<repo_name>/issues', methods=['POST'])
def create_repository_issue(repo_name):
    try:
        data = request.get_json()
        title = data.get('title')
        body = data.get('body')
        
        if not title:
            return jsonify({'error': 'Title is required'}), 400
            
        issue = github_service.create_issue(repo_name, title, body)
        return jsonify(issue)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Check if port is provided as command line argument
    port = 5001
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port: {sys.argv[1]}. Using default port 5000.")
    
    print(f"Starting server on http://0.0.0.0:{port}")
    app.run(debug=True, host='0.0.0.0', port=port) 