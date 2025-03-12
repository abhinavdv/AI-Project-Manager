import os
import json
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential
import requests
from typing import List, Dict, Any

class AzureService:
    def __init__(self):
        # Text Analytics credentials
        key = os.getenv('AZURE_KEY', 'YOUR_AZURE_KEY')
        endpoint = os.getenv('AZURE_ENDPOINT', 'YOUR_AZURE_ENDPOINT')
        self.text_client = self._create_text_client(key, endpoint)
        
        # Azure OpenAI credentials
        self.openai_key = os.getenv('AZURE_OPENAI_KEY', 'YOUR_AZURE_OPENAI_KEY')
        self.openai_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT', 'YOUR_AZURE_OPENAI_ENDPOINT')
        self.openai_deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'YOUR_AZURE_OPENAI_DEPLOYMENT')
        self.openai_api_version = os.getenv('AZURE_OPENAI_API_VERSION', '2023-05-15')
    
    def _create_text_client(self, key, endpoint):
        """Create an Azure Text Analytics client."""
        try:
            credential = AzureKeyCredential(key)
            return TextAnalyticsClient(endpoint=endpoint, credential=credential)
        except Exception as e:
            print(f"Error creating Azure Text client: {str(e)}")
            # Return None to allow the application to run with mock data
            return None
    
    def _call_openai_api(self, prompt: str, max_tokens: int = 1000, temperature: float = 0.5, default_response=None) -> Dict[str, Any]:
        """Call the OpenAI API using Azure endpoint."""
        try:
            if not self.openai_key or not self.openai_endpoint:
                print("Azure OpenAI credentials not properly configured")
                raise Exception("Azure OpenAI credentials not properly configured. Please set AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT environment variables.")
            
            headers = {
                "Content-Type": "application/json",
                "api-key": self.openai_key
            }
            
            # Add more explicit instructions to the system message
            system_message = "You are a helpful assistant that specializes in project management and breaking down tasks. Your responses should be in valid JSON format only, without any additional text, explanations, or markdown formatting. Always structure your response exactly as requested in the user's prompt."
            
            payload = {
                "messages": [
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": max_tokens,
                "temperature": temperature,
                "response_format": {"type": "json_object"}  # Request JSON response format
            }
            
            url = f"{self.openai_endpoint}/openai/deployments/{self.openai_deployment}/chat/completions?api-version={self.openai_api_version}"
            
            # Print debugging info
            print(f"Calling Azure OpenAI API at: {self.openai_endpoint}")
            
            response = requests.post(url, headers=headers, json=payload)
            
            if response.status_code == 200:
                response_json = response.json()
                content = response_json["choices"][0]["message"]["content"]
                
                try:
                    # Try to parse the JSON content directly
                    content_json = json.loads(content)
                    return content_json
                except json.JSONDecodeError:
                    print(f"Error parsing JSON response: {content}")
                    raise Exception(f"Failed to parse JSON from API response: {content}")
            else:
                print(f"Azure OpenAI API error: {response.status_code} - {response.text}")
                raise Exception(f"Azure OpenAI API returned error status code: {response.status_code}, message: {response.text}")
                
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
        Generate big goals based on project description.
        
        Args:
            text (str): Project description
            
        Returns:
            list: List of goals
        """
        prompt = f"""
        Based on the following project description, generate 3-5 broad project goals.
        Each goal should represent a significant part of the project that can be broken down further.
        
        PROJECT DESCRIPTION:
        {text}
        
        Provide the goals in the following JSON format:
        {{
            "goals": [
                {{
                    "id": 1,
                    "title": "Goal title",
                    "description": "Detailed description of the goal"
                }},
                ...
            ]
        }}
        
        Include only the JSON in your response.
        """
        
        response = self._call_openai_api(prompt)
        
        try:
            # Try to extract JSON if it's wrapped in other text
            if isinstance(response, str) and not response.startswith('{'):
                # Look for JSON-like patterns
                import re
                json_match = re.search(r'(\{.*\})', response, re.DOTALL)
                if json_match:
                    content = json_match.group(1)
                    response = json.loads(content)
                else:
                    raise Exception("Cannot find JSON object in response")
            
            # Ensure response is a dictionary
            if not isinstance(response, dict):
                raise Exception(f"Expected dictionary response, got {type(response)}")
                
            # Extract goals array
            if "goals" in response and isinstance(response["goals"], list):
                # Ensure all goals have the required fields
                valid_goals = []
                for i, goal in enumerate(response["goals"]):
                    if isinstance(goal, dict) and "title" in goal:
                        # Ensure each goal has an id and description
                        valid_goal = {
                            "id": goal.get("id", i + 1),
                            "title": goal["title"],
                            "description": goal.get("description", "")
                        }
                        valid_goals.append(valid_goal)
                
                if valid_goals:
                    return valid_goals
            
            raise Exception("Unexpected JSON structure in LLM response")
        except Exception as e:
            print(f"Error parsing LLM response: {str(e)}")
            raise
    
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
        prompt = f"""
        Break down the following broad goal into 3-5 specific, actionable goals.
        Each specific goal should be focused and achievable.
        
        BROAD GOAL: {goal_title}
        DESCRIPTION: {goal_description}
        
        Provide the specific goals in the following JSON format:
        {{
            "specificGoals": [
                {{
                    "id": {goal_id * 100 + 1},
                    "title": "First specific goal title",
                    "description": "Detailed description of the first specific goal"
                }},
                {{
                    "id": {goal_id * 100 + 2},
                    "title": "Second specific goal title",
                    "description": "Detailed description of the second specific goal"
                }},
                ... (and so on for 3-5 goals)
            ]
        }}
        
        Start IDs from {goal_id * 100 + 1} for tracking purposes. Include only the JSON in your response.
        """
        
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
        
        api_prompt = f"""
        Based on the following project description and its goals, generate a suitable GitHub repository name and description.
        
        PROJECT DESCRIPTION:
        {prompt}
        
        PROJECT GOALS:
        {goals}
        
        Provide your response in the following JSON format:
        {{
            "repo_name": "repository-name-with-dashes",
            "description": "A concise description of the project in one sentence."
        }}
        
        The repository name should be lowercase, use dashes instead of spaces, and be concise but descriptive.
        The description should briefly explain what the project does in one sentence.
        Include only the JSON in your response.
        """
        
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
                        else:
                            raise Exception(f"Response missing required fields: {repo_info}")
                    except json.JSONDecodeError:
                        print(f"Failed to parse JSON from: {json_str}")
                        raise Exception(f"Failed to parse JSON from API response: {json_str}")
            
            raise Exception(f"Failed to extract valid repository info from response: {response}")
        except Exception as e:
            print(f"Error generating repository info: {str(e)}")
            raise
            
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