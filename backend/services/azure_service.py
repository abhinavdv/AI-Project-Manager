import os
import json
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv
from prompts import (
    SYSTEM_PROMPT,
    GENERATE_GOALS_PROMPT,
    BREAK_DOWN_GOAL_PROMPT,
    GENERATE_REPO_INFO_PROMPT,
    MODIFY_TASKS_VOICE_PROMPT
)
import tempfile
import base64
from pydub import AudioSegment
from azure.cognitiveservices.speech import (
    SpeechConfig, 
    AudioConfig, 
    SpeechRecognizer, 
    ResultReason, 
    CancellationDetails, 
    CancellationReason
)
from openai import AzureOpenAI

class AzureService:
    def __init__(self):
        # Text Analytics credentials
        key = os.getenv('AZURE_KEY', 'YOUR_AZURE_KEY')
        endpoint = os.getenv('AZURE_ENDPOINT', 'YOUR_AZURE_ENDPOINT')
        self.text_client = self._create_text_client(key, endpoint)
        
        # Load environment variables
        load_dotenv()
        
        # Initialize Azure OpenAI configuration
        self.openai_key = os.getenv("AZURE_OPENAI_KEY")
        self.openai_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.openai_deployment = os.getenv("DEPLOYMENT_NAME", "gpt-4o")
        self.openai_api_version = os.getenv("OPENAI_API_VERSION", "2024-02-15-preview")
        
        # Initialize Azure Speech config
        self.speech_key = os.getenv("AZURE_SPEECH_KEY")
        self.speech_region = os.getenv("AZURE_SPEECH_REGION", "eastus")
        self.speech_config = SpeechConfig(
            subscription=self.speech_key,
            region=self.speech_region
        )
        
        # Initialize Azure OpenAI config
        self.openai_client = AzureOpenAI(
            api_key=self.openai_key,
            api_version="2024-02-15-preview",
            azure_endpoint=self.openai_endpoint
        )
    
    def _create_text_client(self, key, endpoint):
        """Create an Azure Text Analytics client."""
        try:
            credential = AzureKeyCredential(key)
            return TextAnalyticsClient(endpoint=endpoint, credential=credential)
        except Exception as e:
            print(f"Error creating Azure Text client: {str(e)}")
            # Return None to allow the application to run with mock data
            return None
    
    def _call_openai_api(self, prompt: str = None, max_tokens: int = 4000, temperature: float = 0.5, default_response=None, system_prompt: str = None, user_prompt: str = None, deployment_name: str = None) -> Dict[str, Any]:
        """Call the OpenAI API using Azure endpoint."""
        try:
            if not self.openai_key or not self.openai_endpoint:
                print("Azure OpenAI credentials not properly configured")
                raise Exception("Azure OpenAI credentials not properly configured. Please set AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT environment variables.")
            
            # Use the OpenAI client instead of direct API calls
            try:
                messages = []
                
                # Add system prompt
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                else:
                    messages.append({"role": "system", "content": SYSTEM_PROMPT})
                
                # Add user prompt
                if user_prompt:
                    messages.append({"role": "user", "content": user_prompt})
                elif prompt:
                    messages.append({"role": "user", "content": prompt})
                else:
                    raise Exception("No prompt provided to OpenAI API call")
                
                # Use specified deployment name or default
                model_name = deployment_name if deployment_name else self.openai_deployment
                
                response = self.openai_client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    response_format={"type": "json_object"}
                )
                
                # Extract the content from the response
                content = response.choices[0].message.content
                
                try:
                    # Try to parse the JSON content
                    content_json = json.loads(content)
                    return content_json
                except json.JSONDecodeError as e:
                    print(f"JSON Parse Error: {str(e)}")
                    print(f"Raw content: {content}")
                    # Try to clean the content before parsing
                    cleaned_content = content.strip()
                    if cleaned_content.startswith('```json'):
                        cleaned_content = cleaned_content[7:]
                    if cleaned_content.endswith('```'):
                        cleaned_content = cleaned_content[:-3]
                    cleaned_content = cleaned_content.strip()
                    try:
                        return json.loads(cleaned_content)
                    except:
                        # If JSON parsing fails, return the raw content
                        return {"content": content}
                
            except Exception as api_error:
                print(f"API Call Error: {str(api_error)}")
                raise Exception(f"Azure OpenAI API error: {str(api_error)}")
                
        except Exception as e:
            print(f"Error calling Azure OpenAI API: {str(e)}")
            if default_response:
                return default_response
            raise
    
    def _get_mock_llm_response(self, prompt: str) -> Dict[str, Any]:
        """Generate mock LLM response data for demonstration."""
        # Simple mock implementation
        mock_content = ""
        
        if "goals" in prompt.lower():
            mock_content = json.dumps({
                "goals": [
                    {"id": 1, "title": "Set up project infrastructure", "description": "Create basic project structure and configure environment"},
                    {"id": 2, "title": "Implement core functionality", "description": "Develop the main features of the application"},
                    {"id": 3, "title": "Design user interface", "description": "Create responsive and intuitive UI for the application"}
                ]
            })
        elif "break down" in prompt.lower():
            mock_content = json.dumps({
                "smaller_goals": [
                    {"id": 101, "title": "Initialize project repository", "description": "Create Git repository with README and license"},
                    {"id": 102, "title": "Set up development environment", "description": "Configure development tools and dependencies"},
                    {"id": 103, "title": "Create project structure", "description": "Organize folders and files according to best practices"}
                ]
            })
        else:
            mock_content = json.dumps({"response": "I couldn't determine what you're asking for."})
        
        return {
            "choices": [
                {
                    "message": {
                        "content": mock_content
                    }
                }
            ]
        }
    
    def analyze_text(self, text):
        """
        Analyze text to extract key phrases and entities.
        In a real implementation, this would use Azure's AI capabilities.
        """
        if not self.text_client:
            # Return mock data if client initialization failed
            return self._get_mock_analysis(text)
        
        try:
            # Extract key phrases
            key_phrase_response = self.text_client.extract_key_phrases([text])[0]
            key_phrases = key_phrase_response.key_phrases if not key_phrase_response.is_error else []
            
            # Extract entities
            entity_response = self.text_client.recognize_entities([text])[0]
            entities = [entity.text for entity in entity_response.entities] if not entity_response.is_error else []
            
            return {
                "key_phrases": key_phrases,
                "entities": entities
            }
        except Exception as e:
            print(f"Error during text analysis: {str(e)}")
            return self._get_mock_analysis(text)
    
    def _get_mock_analysis(self, text):
        """Generate mock analysis data for demonstration."""
        # Simple mock implementation
        words = text.split()
        key_phrases = []
        current_phrase = []
        
        for i, word in enumerate(words):
            current_phrase.append(word)
            if i % 3 == 2 or i == len(words) - 1:  # Every 3 words or last word
                key_phrases.append(" ".join(current_phrase))
                current_phrase = []
        
        return {
            "key_phrases": key_phrases,
            "entities": [word for word in words if len(word) > 5][:5]  # Just some longer words
        }
    
    def generate_goals(self, text: str) -> List[Dict[str, Any]]:
        """
        Generate big goals and their sub-tasks based on project description.
        
        Args:
            text (str): Project description
            
        Returns:
            dict: Dictionary containing both big goals and their sub-tasks
        """
        try:
            prompt = GENERATE_GOALS_PROMPT.format(text=text)
            response = self._call_openai_api(prompt)
            
            # Validate response structure
            if not isinstance(response, dict):
                raise ValueError(f"Expected dictionary response, got {type(response)}")
            
            # Extract goals array
            goals = response.get("goals", [])
            if not isinstance(goals, list):
                raise ValueError(f"Expected goals to be a list, got {type(goals)}")
            
            # Validate and process each goal
            processed_goals = []
            for goal in goals:
                if not isinstance(goal, dict):
                    print(f"Skipping invalid goal: {goal}")
                    continue
                
                # Ensure required fields exist
                if "title" not in goal:
                    print(f"Skipping goal without title: {goal}")
                    continue
                
                # Process sub-tasks if they exist
                sub_tasks = []
                if "sub_tasks" in goal and isinstance(goal["sub_tasks"], list):
                    for task in goal["sub_tasks"]:
                        if isinstance(task, dict) and "title" in task:
                            sub_tasks.append({
                                "id": task.get("id", len(sub_tasks) + 1),
                                "title": task["title"],
                                "description": task.get("description", "")
                            })
                
                # Add processed goal
                processed_goals.append({
                    "id": goal.get("id", len(processed_goals) + 1),
                    "title": goal["title"],
                    "description": goal.get("description", ""),
                    "sub_tasks": sub_tasks
                })
            
            if not processed_goals:
                raise ValueError("No valid goals found in response")
            
            return {"goals": processed_goals}
        
        except Exception as e:
            print(f"Error generating goals: {str(e)}")
            raise Exception(f"Failed to generate goals: {str(e)}")
    
    def _get_mock_goals(self):
        """Return mock goals if API fails"""
        return [
            {"id": 1, "title": "Set up project infrastructure", "description": "Create basic project structure and configure environment"},
            {"id": 2, "title": "Implement core functionality", "description": "Develop the main features of the application"},
            {"id": 3, "title": "Design user interface", "description": "Create responsive and intuitive UI for the application"}
        ]
    
    def break_down_goal(self, goal_id, goal_title, goal_description):
        """
        Break down a big goal into smaller, more specific goals.
        
        Args:
            goal_id (int): The ID of the goal being broken down
            goal_title (str): The title of the goal to break down
            goal_description (str): The description of the goal
            
        Returns:
            list: List of smaller goals
        """
        goal_id_start = goal_id * 100 + 1
        goal_id_start_plus_one = goal_id_start + 1
        
        prompt = BREAK_DOWN_GOAL_PROMPT.format(
            goal_title=goal_title,
            goal_description=goal_description,
            goal_id_start=goal_id_start,
            goal_id_start_plus_one=goal_id_start_plus_one
        )
        
        try:
            response = self._call_openai_api(prompt)
            print(f"Response from break_down_goal API: {response}")
            
            # Check if response is already a list of goals
            if isinstance(response, list) and len(response) > 0 and "title" in response[0]:
                return response
            
            # If response is in a nested format like {"smaller_goals": [...]}
            if isinstance(response, dict):
                # Check for various possible keys the API might use
                for key in ["smaller_goals", "goals", "specificGoals"]:
                    if key in response and isinstance(response[key], list):
                        return response[key]
                
                # Check if the response itself is a single goal object
                if all(key in response for key in ["id", "title", "description"]):
                    # Wrap the single goal in a list
                    return [response]
                
            raise Exception(f"Unexpected response format: {response}")
        except Exception as e:
            print(f"Error in break_down_goal: {str(e)}")
            raise
    
    def generate_repo_info(self, prompt, goals):
        """
        Generate repository name and description based on prompt and goals.
        
        Args:
            prompt (str): The original project prompt
            goals (str): The broad goals as a string (newline separated)
            
        Returns:
            dict: Repository information with name and description
        """
        if not prompt and not goals:
            raise Exception("Missing prompt and goals for repo info generation")
            
        print(f"Generating repository info with prompt: {prompt[:100]}... and goals: {goals[:100]}...")
        
        api_prompt = GENERATE_REPO_INFO_PROMPT.format(prompt=prompt, goals=goals)
        
        try:
            response = self._call_openai_api(api_prompt)
            print(f"Raw LLM response for repo info: {response}")
            
            # Try to extract and parse the JSON
            if isinstance(response, dict) and "repo_name" in response and "description" in response:
                return response
            elif isinstance(response, str):
                # Try to extract JSON from the string
                import re
                import json
                
                # Look for JSON pattern in the response
                json_match = re.search(r'({.*})', response.replace('\n', ' '), re.DOTALL)
                if json_match:
                    try:
                        json_str = json_match.group(1)
                        repo_info = json.loads(json_str)
                        
                        if "repo_name" in repo_info and "description" in repo_info:
                            return repo_info
                        elif "name" in repo_info and "description" in repo_info:
                            # Fix property name to match expected format
                            repo_info["repo_name"] = repo_info["name"]
                            del repo_info["name"]
                            return repo_info
                        else:
                            print(f"Response missing required fields: {repo_info}")
                    except json.JSONDecodeError:
                        print(f"Failed to parse JSON from: {json_str}")
            
            # Use fallback method if API fails to return correct format
            return self._generate_fallback_repo_info(prompt, goals)
        except Exception as e:
            print(f"Error generating repository info: {str(e)}")
            # Use fallback method if API fails
            return self._generate_fallback_repo_info(prompt, goals)
        
    def _generate_fallback_repo_info(self, prompt, goals):
        """Generate fallback repository info when the API fails."""
        print("Using fallback repository info generation")
        
        # Extract potential keywords from the goals and prompt
        words = []
        if goals:
            words = goals.lower().replace('\n', ' ').split(' ')
        elif prompt:
            words = prompt.lower().split(' ')
        
        # Filter out common words and keep only alphanum
        import re
        words = [re.sub(r'[^a-z0-9]', '', word) for word in words if len(word) > 3 and word.lower() not in 
                 ['with', 'the', 'and', 'that', 'this', 'for', 'from']]
        
        # Generate a repo name from the first few meaningful words
        repo_name = "-".join(words[:2]) if len(words) >= 2 else "github-project"
        
        # Clean up repo name (remove any non-alphanumeric chars except dash)
        repo_name = re.sub(r'[^a-z0-9\-]', '', repo_name.lower())
        
        # Generate a simple description based on the prompt
        description = prompt[:60] + "..." if len(prompt) > 60 else prompt
        
        return {
            "repo_name": repo_name,
            "description": description
        }
    
    def _get_mock_repo_info(self):
        """Generate mock repository info."""
        return {
            "repo_name": "github-project-manager",
            "description": "A tool to manage GitHub projects by breaking down ideas into actionable goals."
        }
    
    def _get_mock_small_goals(self, broad_goal_id):
        """Generate mock small goals for a broad goal."""
        base_id = broad_goal_id * 100 + 1
        return [
            {"id": base_id, "title": "Research and requirements", "description": "Gather requirements and conduct initial research"},
            {"id": base_id + 1, "title": "Design implementation", "description": "Create detailed design and architecture for the implementation"},
            {"id": base_id + 2, "title": "Implementation", "description": "Implement the code and functionality according to design"},
            {"id": base_id + 3, "title": "Testing and validation", "description": "Test the implementation thoroughly and validate against requirements"}
        ]

    def transcribe_audio(self, audio_file):
        """
        Transcribe audio file to text using Azure Speech Services.
        """
        try:
            # Save the file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
                audio_file.save(temp_audio.name)
                
                try:
                    # Convert to proper WAV format using pydub
                    audio = AudioSegment.from_file(temp_audio.name)
                    
                    # Export as proper WAV file with correct parameters
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as proper_wav:
                        audio.export(proper_wav.name, format='wav', 
                                   parameters=[
                                       "-acodec", "pcm_s16le",  # 16-bit PCM
                                       "-ac", "1",              # mono
                                       "-ar", "16000"           # 16kHz sample rate
                                   ])
                        
                        # Configure audio input
                        audio_config = AudioConfig(filename=proper_wav.name)
                        speech_recognizer = SpeechRecognizer(
                            speech_config=self.speech_config,
                            audio_config=audio_config
                        )
                        
                        # Perform transcription
                        result = speech_recognizer.recognize_once_async().get()
                        
                        # Clean up temporary files
                        os.unlink(proper_wav.name)
                        os.unlink(temp_audio.name)
                        
                        if result.reason == ResultReason.RecognizedSpeech:
                            return result.text
                        elif result.reason == ResultReason.NoMatch:
                            print("No speech could be recognized. Please speak more clearly or check your microphone.")
                            return "I couldn't hear what you said. Please try again by speaking clearly."
                        elif result.reason == ResultReason.Canceled:
                            cancellation = CancellationDetails.from_result(result)
                            
                            if cancellation.reason == CancellationReason.Error:
                                print(f"Speech recognition canceled due to error: {cancellation.error_details}")
                                if "401" in cancellation.error_details:
                                    return "Speech recognition failed: Authentication error. Please check your Azure credentials."
                                elif "network" in cancellation.error_details.lower():
                                    return "Speech recognition failed: Network error. Please check your internet connection."
                                else:
                                    return f"Speech recognition failed: {cancellation.error_details}"
                            else:
                                print(f"Speech recognition canceled: {cancellation.reason}")
                                return "Speech recognition was canceled. Please try again."
                        else:
                            print(f"Speech recognition result: {result.reason}")
                            return "There was an issue understanding your speech."
                        
                except Exception as e:
                    # Clean up temporary files in case of error
                    if os.path.exists(temp_audio.name):
                        os.unlink(temp_audio.name)
                    print(f"Error in speech recognition: {str(e)}")
                    return "There was an error processing your speech. Please try again."
                
        except Exception as e:
            print(f"Error transcribing audio: {str(e)}")
            return "Failed to process audio. Please try again."

    def process_voice_chat(self, transcription, task_id, conversation):
        """
        Process voice chat input and return updated task information using Azure OpenAI.
        
        Args:
            transcription (str): The transcribed text from audio
            task_id (str): The ID of the task being modified
            conversation (list): List of previous conversation messages
            
        Returns:
            dict: Response containing message and updated task information
        """
        try:
            # Prepare the prompt for the OpenAI API
            system_prompt = "You are an AI assistant helping to update task information based on voice input. " \
                          "You have access to a task and its sub-tasks. The user may ask to modify, add, or remove " \
                          "tasks and sub-tasks. Your responses should be helpful, concise, and focused on the task."
            
            # Include the task ID and existing conversation
            user_prompt = f"I'm currently looking at task #{task_id}. " \
                         f"The user said: \"{transcription}\"\n\n" \
                         f"Here is our conversation so far: {json.dumps(conversation)}"
            
            # Make the API call
            response = self._call_openai_api(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                deployment_name=self.openai_deployment
            )
            
            # Process the response
            return {
                "message": response.get("message", ""),
                "updatedTask": response.get("updatedTask"),
                "updatedSubTasks": response.get("updatedSubTasks")
            }
            
        except Exception as e:
            print(f"Error processing voice chat: {str(e)}")
            raise Exception(f"Failed to process voice chat: {str(e)}")
    
    def modify_tasks_voice(self, transcription, current_tasks):
        """
        Modify tasks based on voice input using Azure OpenAI.
        
        Args:
            transcription (str): The transcribed text from audio
            current_tasks (list): The current tasks and subtasks
            
        Returns:
            list: Updated tasks based on voice input
        """
        try:
            # Check if transcription is an error message
            if transcription.startswith(("I couldn't hear", "There was an", "Failed to process")):
                print(f"Transcription error: {transcription}")
                return current_tasks
                
            # Prepare the prompt for the OpenAI API
            system_prompt = "You are an AI assistant helping to update tasks based on voice input. " \
                           "You have access to the complete list of tasks and sub-tasks. Based on the user's voice input, " \
                           "you should determine if any changes are needed to any tasks in the list. " \
                           "Make changes only based on the voice input provided."
            
            # Format current tasks for the prompt
            task_json = json.dumps(current_tasks, indent=2)
            
            user_prompt = f"""
            Below is a set of tasks and sub-tasks for each task. 
            The user wants to modify the task list using their voice input.
            Figure out if any changes are needed to any tasks based on the voice input.
            MAKE ONLY CHANGES BASED ON THE VOICE INPUT: "{transcription}"

            Below is the current JSON:
            {task_json}
            
            Return the modified tasks in the exact same JSON format. If no changes are needed, 
            return the original tasks unchanged.
            """
            
            # Make the API call
            response = self._call_openai_api(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=4000,
                deployment_name=self.openai_deployment
            )
            
            # Process the response to extract the updated tasks JSON
            message = response.get("content", "")
            
            try:
                # Try to extract JSON from the message
                import re
                json_match = re.search(r'```json\s*([\s\S]*?)\s*```', message)
                if json_match:
                    json_str = json_match.group(1).strip()
                    updated_tasks = json.loads(json_str)
                else:
                    # If no JSON code block, try to parse the entire message as JSON
                    updated_tasks = json.loads(message)
                
                return updated_tasks
            except Exception as json_error:
                print(f"Error parsing updated tasks JSON: {str(json_error)}")
                print(f"Original message: {message}")
                # If parsing fails, return the original tasks
                return current_tasks
            
        except Exception as e:
            print(f"Error modifying tasks with voice: {str(e)}")
            raise Exception(f"Failed to modify tasks with voice: {str(e)}") 