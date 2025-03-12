import os
import requests
from dotenv import load_dotenv
from github import Github, GithubException

# Ensure environment variables are loaded
load_dotenv()

class GitHubService:
    def __init__(self):
        self.api_base_url = 'https://api.github.com'
        self.token = os.getenv('GITHUB_TOKEN')
        
        if not self.token:
            print("WARNING: GITHUB_TOKEN is not set in the environment variables")
        else:
            # Print first 4 chars of token for debugging
            print(f"GitHub token configured: {self.token[:4]}...")
    
    def get_headers(self):
        """Get the standard authorization headers."""
        return {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': f'token {self.token}',
            'Content-Type': 'application/json'
        }
    
    def create_repository(self, name, description=None, is_private=False):
        """
        Create a new GitHub repository.
        
        Args:
            name (str): The name of the repository
            description (str, optional): Description of the repository
            is_private (bool, optional): Whether the repository should be private
            
        Returns:
            dict: Repository information if successful
        """
        endpoint = f'{self.api_base_url}/user/repos'
        
        data = {
            'name': name,
            'private': is_private,
        }
        
        if description:
            data['description'] = description
        
        print(f"Creating repository: {name}")
        
        response = requests.post(
            endpoint,
            headers=self.get_headers(),
            json=data
        )
        
        if response.status_code != 201:
            error_msg = f"Failed to create repository: {response.status_code} - {response.text}"
            print(error_msg)
            raise Exception(error_msg)
        
        return response.json()
    
    def create_issue(self, repo_name, title, body=None, is_broad_goal=False, is_specific_goal=False, parent_issue_number=None):
        """
        Create a new GitHub issue for the repository.
        
        Args:
            repo_name (str): The name of the repository
            title (str): Issue title
            body (str, optional): Issue body/description
            is_broad_goal (bool): Whether this is a broad goal
            is_specific_goal (bool): Whether this is a specific goal
            parent_issue_number (int, optional): The issue number of the parent issue
            
        Returns:
            dict: Issue information if successful
        """
        # Get username from API if not set
        username = self._get_username()
        
        endpoint = f'{self.api_base_url}/repos/{username}/{repo_name}/issues'
        
        # Format the body with appropriate labels
        formatted_body = body or ""
        
        if is_broad_goal:
            if not formatted_body.strip():
                formatted_body = "## Broad Goal\n\nThis is a main project goal."
            labels = ["broad-goal"]
        elif is_specific_goal:
            if parent_issue_number:
                if not formatted_body.strip():
                    formatted_body = f"## Specific Goal\n\nSub-task of #{parent_issue_number}"
                else:
                    formatted_body = f"{formatted_body}\n\n---\n_Sub-task of #{parent_issue_number}_"
            labels = ["specific-goal"]
        else:
            labels = []
        
        data = {
            'title': title,
            'body': formatted_body,
            'labels': labels
        }
        
        print(f"Creating issue: {title} in {repo_name}")
        
        response = requests.post(
            endpoint,
            headers=self.get_headers(),
            json=data
        )
        
        if response.status_code != 201:
            error_msg = f"Failed to create issue: {response.status_code} - {response.text}"
            print(error_msg)
            raise Exception(error_msg)
        
        return response.json()
    
    def _get_username(self):
        """Get the authenticated user's username."""
        endpoint = f'{self.api_base_url}/user'
        
        response = requests.get(
            endpoint,
            headers=self.get_headers()
        )
        
        if response.status_code != 200:
            error_msg = f"Failed to get user info: {response.status_code} - {response.text}"
            print(error_msg)
            raise Exception(error_msg)
        
        return response.json()['login']
    
    def create_issues(self, repo_name, goals):
        """
        Create GitHub issues from goals.
        
        Args:
            repo_name (str): The name of the repository
            goals (list): List of goal objects with title, description, etc.
            
        Returns:
            list: List of created issues with their details
        """
        if not self.token:
            raise Exception("GitHub token is not configured. Please set GITHUB_TOKEN environment variable.")
        
        try:
            user = self._get_username()
            
            created_issues = []
            for goal in goals:
                title = goal.get('title', '')
                description = goal.get('description', '')
                
                issue = self.create_issue(
                    repo_name, 
                    title, 
                    description, 
                    is_broad_goal=goal.get('is_broad_goal', False), 
                    is_specific_goal=goal.get('is_specific_goal', False), 
                    parent_issue_number=goal.get('parent_issue_number')
                )
                
                created_issues.append({
                    "id": issue['number'],
                    "title": issue['title'],
                    "description": issue['body'],
                    "url": issue['html_url']
                })
            
            return created_issues
        except Exception as e:
            print(f"Error creating issues: {str(e)}")
            raise 