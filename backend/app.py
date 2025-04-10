import os
import json
import argparse
import sys
import base64
import re
from pydub import AudioSegment
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from services.azure_service import AzureService
from services.github_service import GitHubService
from openai import AzureOpenAI
import tempfile
from prompts import AUDIO_TRANSCRIPTION_PROMPT, MODIFY_TASKS_VOICE_PROMPT, MODIFY_GANTT_VOICE_PROMPT

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

# Catch-all route for client-side routing
@app.route('/<path:path>')
def catch_all(path):
    """Handles all frontend routes and serves the index.html page."""
    # Skip API routes
    if path.startswith('api/'):
        return jsonify({"error": "Not found"}), 404
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
        
        print(f"Received current tasks: {current_tasks[:200]}...")
        
        # Validate the current tasks JSON
        try:
            json.loads(current_tasks)
        except json.JSONDecodeError as e:
            print(f"Invalid JSON in current_tasks: {str(e)}")
            return jsonify({'error': f'Invalid tasks JSON: {str(e)}'}), 400
        
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
                
                # Create a better prompt that explicitly tells the model to return a JSON array
                prompt_with_json = f"""
                {MODIFY_TASKS_VOICE_PROMPT}
                
                Here are the current tasks in JSON format:
                {current_tasks}
                
                Listen to the audio and modify the tasks according to the user's instructions.
                Return ONLY a valid JSON array of tasks with the same structure as the input.
                Each task should have: id, title, description, and sub_tasks array.
                Each sub_task should have: id, title, description, and estimatedHours (if available).
                """
                
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
                                "text": "I want to modify these tasks. Here's my voice instruction:"
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
                
                print("Sending request to OpenAI API...")
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
                                updated_tasks = json.loads(current_tasks)
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
                    
                    # Ensure updated_tasks is an array
                    if not isinstance(updated_tasks, list):
                        if isinstance(updated_tasks, dict) and 'tasks' in updated_tasks:
                            updated_tasks = updated_tasks['tasks']
                        else:
                            print("Updated tasks is not an array or object with tasks property")
                            updated_tasks = json.loads(current_tasks)
                    
                    # Get the first line as transcription (or fallback to the whole response)
                    transcription = ai_response.split('\n')[0] if '\n' in ai_response else ai_response
                    if transcription.startswith('```') and '\n' in ai_response:
                        # Skip the code block marker and get the next line
                        lines = ai_response.split('\n')
                        for line in lines:
                            if line and not line.startswith('```'):
                                transcription = line
                                break
                    
                    # Log success and return the response
                    print(f"Successfully processed voice modification: {transcription[:100]}")
                    print(f"Returning updated tasks: {json.dumps(updated_tasks)[:200]}...")
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
                print(f"Error processing audio: {str(e)}")
                raise e
                
    except Exception as e:
        print(f"Error in modify-tasks-voice: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/modify-gantt-voice', methods=['POST'])
def modify_gantt_voice():
    """Modify Gantt chart data using voice input"""
    try:
        # Debug: Print configuration
        print(f"Using audio endpoint: {audio_endpoint}")
        print(f"Using audio deployment: gpt-4o-mini-audio-preview")
        
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        current_gantt_data = request.form.get('currentGanttData', '{}')
        
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
                # Include the current Gantt chart JSON in the prompt
                prompt_with_json = MODIFY_GANTT_VOICE_PROMPT + "\n" + current_gantt_data
                
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
                
                # Process the API response to extract the updated Gantt chart JSON
                try:
                    print(f"Raw AI response: {ai_response[:500]}...")
                    
                    # First, check if the response is already valid JSON
                    try:
                        updated_gantt_data = json.loads(ai_response)
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
                                updated_gantt_data = json.loads(json_str)
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
                                    updated_gantt_data = json.loads(json_str)
                                    print("Successfully parsed JSON from pattern")
                                except json.JSONDecodeError:
                                    print(f"Failed to parse JSON from pattern")
                                    updated_gantt_data = json.loads(current_gantt_data) if current_gantt_data else {}
                            else:
                                # If we can't extract JSON, return the original data
                                print("No JSON pattern found in response")
                                updated_gantt_data = json.loads(current_gantt_data) if current_gantt_data else {}
                    
                    # Get the first line as transcription (or fallback to the whole response)
                    transcription = ai_response.split('\n')[0] if '\n' in ai_response else ai_response
                    
                    # Convert updated Gantt data to JSON string
                    updated_gantt_json = json.dumps(updated_gantt_data)
                    
                    # Log success and return the response
                    print(f"Successfully processed Gantt chart voice modification: {transcription[:100]}")
                    return jsonify({
                        'transcription': transcription,
                        'updatedGanttData': updated_gantt_json
                    })
                    
                except Exception as json_error:
                    print(f"Error parsing response JSON: {str(json_error)}")
                    print(f"Raw response: {ai_response}")
                    # Return the original Gantt data on error
                    return jsonify({
                        'transcription': ai_response,
                        'updatedGanttData': current_gantt_data
                    })
                
            except Exception as e:
                # Clean up the temporary files in case of error
                if os.path.exists(temp_audio.name):
                    os.unlink(temp_audio.name)
                raise e
                
    except Exception as e:
        print(f"Error in modify-gantt-voice: {str(e)}")
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
    """Get tasks for a repository by analyzing its issues and sub-issues."""
    try:
        print(f"Fetching tasks for repository: {repo_name}")
        
        # Get all issues for the repository
        issues = github_service.get_repository_issues(repo_name)
        print(f"Retrieved {len(issues)} issues from repository {repo_name}")
        
        # Process issues into tasks
        tasks = []
        parent_tasks = []
        child_tasks = []
        
        # First pass: identify all issues and create task objects
        for issue in issues:
            print(f"Processing issue #{issue['id']}: {issue['title']}")
            print(f"  Labels: {issue['labels']}")
            
            # Determine if this is a parent task based on multiple criteria
            is_parent = False
            
            # Check for broad-goal label
            if issue['is_broad_goal']:
                is_parent = True
                print(f"  Identified as parent task via 'broad-goal' label")
            
            # Check for specific-goal label (this would make it a child task)
            is_child = issue['is_specific_goal']
            if is_child:
                print(f"  Identified as child task via 'specific-goal' label")
            
            # If neither label is present, use heuristics to determine task type
            if not is_parent and not is_child:
                # Default: If we can't determine from labels, treat as a parent task
                is_parent = True
                print(f"  Defaulting to parent task (no specific labels)")
            
            task = {
                'number': issue['id'],
                'title': issue['title'],
                'body': issue['description'],
                'is_parent': is_parent,
                'parent_id': None
            }
            
            tasks.append(task)
            
            # Categorize for easier processing
            if is_parent:
                parent_tasks.append(task)
            else:
                child_tasks.append(task)
        
        # Second pass: try to get sub-issues for each parent task using GitHub's sub-issues API
        for parent_task in parent_tasks:
            parent_id = parent_task['number']
            try:
                # Try to get sub-issues using the GitHub API
                sub_issues = github_service.list_sub_issues(repo_name, parent_id)
                print(f"Retrieved {len(sub_issues)} sub-issues for parent #{parent_id}")
                
                # Update child tasks with parent information
                for sub_issue in sub_issues:
                    sub_issue_id = sub_issue.get('number')
                    if sub_issue_id:
                        # Find the corresponding task in our tasks list
                        child_task = next((t for t in tasks if t['number'] == sub_issue_id), None)
                        
                        if child_task:
                            # Update the parent_id
                            child_task['parent_id'] = parent_id
                            child_task['is_parent'] = False  # Ensure it's marked as a child
                            print(f"  Set parent #{parent_id} for sub-issue #{sub_issue_id} via GitHub sub-issues API")
                        else:
                            # This sub-issue wasn't in our original list, might be a new issue
                            print(f"  Sub-issue #{sub_issue_id} not found in tasks list, might be new")
            except Exception as sub_err:
                # If the sub-issues API fails (e.g., not enabled for this repo), fall back to description parsing
                print(f"  Failed to get sub-issues via API for parent #{parent_id}: {str(sub_err)}")
                print(f"  Falling back to description parsing for parent-child relationships")
                
                # Fall back to the old method: look for references in description
                for child in child_tasks:
                    if child['parent_id'] is None:  # Only process children without assigned parents
                        child_id = child['number']
                        child_issue = next((i for i in issues if i['id'] == child_id), None)
                        
                        if child_issue and child_issue['description']:
                            # Look for explicit parent references in the description using #123 format
                            if f"#{parent_id}" in child_issue['description']:
                                child['parent_id'] = parent_id
                                print(f"  Assigned parent #{parent_id} to child #{child_id} via description reference")
        
        # Third pass: for any remaining child tasks without parents, try to find references in their descriptions
        for task in child_tasks:
            if task['parent_id'] is None:  # Only process children without assigned parents
                issue_id = task['number']
                issue = next((i for i in issues if i['id'] == issue_id), None)
                
                if issue and issue['description']:
                    # Look for explicit parent references in the description using #123 format
                    parent_refs = set()
                    for match in re.finditer(r'#(\d+)', issue['description']):
                        parent_id = int(match.group(1))
                        # Make sure the referenced issue exists and is a parent task
                        if any(p['number'] == parent_id for p in parent_tasks):
                            parent_refs.add(parent_id)
                            print(f"  Issue #{issue_id} references parent #{parent_id}")
                    
                    # If we found exactly one parent reference, use it
                    if len(parent_refs) == 1:
                        task['parent_id'] = next(iter(parent_refs))
                        print(f"  Assigned parent #{task['parent_id']} to child #{issue_id}")
                    # If we found multiple, use the first one that's a parent task
                    elif len(parent_refs) > 1:
                        for parent_id in parent_refs:
                            if any(p['number'] == parent_id for p in parent_tasks):
                                task['parent_id'] = parent_id
                                print(f"  Selected parent #{parent_id} from multiple references for child #{issue_id}")
                                break
        
        print(f"Processed {len(parent_tasks)} parent tasks and {len(child_tasks)} child tasks")
        
        # Ensure we have at least one parent task
        if not parent_tasks and tasks:
            # If we have tasks but no parents, treat the first task as a parent
            print("No parent tasks found, converting first task to parent")
            tasks[0]['is_parent'] = True
            parent_tasks.append(tasks[0])
        
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

@app.route('/api/repository/<repo_name>/issues/<int:issue_number>', methods=['PUT', 'DELETE'])
def update_repository_issue(repo_name, issue_number):
    """Update or delete an existing issue."""
    if request.method == 'DELETE':
        try:
            print(f"Deleting issue #{issue_number} in {repo_name}")
            github_service.delete_issue(repo_name, issue_number)
            return jsonify({"success": True, "message": f"Issue #{issue_number} deleted successfully"})
        except Exception as e:
            print(f"Error deleting issue: {str(e)}")
            return jsonify({"error": str(e)}), 500
    else:  # PUT method
        data = request.json
        try:
            # Determine if this is a parent task or subtask based on the data
            is_broad_goal = data.get('is_parent', False)
            is_specific_goal = not is_broad_goal
            
            print(f"Updating issue #{issue_number} in {repo_name}")
            print(f"  Title: {data.get('title')}")
            print(f"  Is broad goal: {is_broad_goal}")
            print(f"  Is specific goal: {is_specific_goal}")
            
            updated_issue = github_service.update_issue(
                repo_name,
                issue_number,
                title=data.get('title'),
                body=data.get('body') or data.get('description'),
                state=data.get('state'),
                is_broad_goal=is_broad_goal,
                is_specific_goal=is_specific_goal
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
        
        # Check for both old and new parameter formats
        is_parent = data.get('is_parent')  # Old parameter
        is_broad_goal = data.get('is_broad_goal')  # New parameter
        is_specific_goal = data.get('is_specific_goal')  # New parameter
        parent_issue_number = data.get('parent_issue_number')
        
        # If new parameters are not provided, fall back to old parameter
        if is_broad_goal is None and is_specific_goal is None and is_parent is not None:
            is_broad_goal = is_parent
            is_specific_goal = not is_parent
        # Default to broad goal if nothing is specified
        elif is_broad_goal is None and is_specific_goal is None:
            is_broad_goal = True
            is_specific_goal = False
        
        print(f"Creating issue in {repo_name}")
        print(f"  Title: {title}")
        print(f"  Is broad goal: {is_broad_goal}")
        print(f"  Is specific goal: {is_specific_goal}")
        print(f"  Parent issue number: {parent_issue_number}")
        
        if not title:
            return jsonify({'error': 'Title is required'}), 400
            
        issue = github_service.create_issue(
            repo_name, 
            title, 
            body, 
            is_broad_goal=is_broad_goal, 
            is_specific_goal=is_specific_goal,
            parent_issue_number=parent_issue_number
        )
        return jsonify(issue)
    except Exception as e:
        print(f"Error creating issue: {str(e)}")
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