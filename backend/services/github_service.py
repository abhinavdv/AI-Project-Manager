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
        Create a new issue in the specified repository.
        
        Args:
            repo_name (str): The name of the repository
            title (str): The title of the issue
            body (str, optional): The body/description of the issue
            is_broad_goal (bool): Whether this is a high-level task
            is_specific_goal (bool): Whether this is a sub-task
            parent_issue_number (int, optional): The issue number of the parent task
            
        Returns:
            dict: The created issue data
        """
        username = self._get_username()
        url = f"{self.api_base_url}/repos/{username}/{repo_name}/issues"
        
        # Add parent reference to body if provided
        if parent_issue_number:
            parent_ref = f"\n\nParent Task: #{parent_issue_number}"
            body = f"{body or ''}{parent_ref}"
        
        # Prepare labels
        labels = []
        if is_broad_goal:
            labels.append("broad-goal")
        if is_specific_goal:
            labels.append("specific-goal")
        
        data = {
            "title": title,
            "body": body or "",
            "labels": labels
        }
        
        response = requests.post(
            url,
            headers=self.get_headers(),
            json=data
        )
        
        if response.status_code != 201:
            raise Exception(f"Failed to create issue: {response.json().get('message', 'Unknown error')}")
        
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
            issue_number_map = {}  # Map of goal ID to issue number
            
            # First create all broad goals (parent issues)
            for goal in goals:
                if goal.get('is_broad_goal', False):
                    issue = self.create_issue(
                        repo_name, 
                        goal['title'], 
                        goal['description'], 
                        is_broad_goal=True,
                        is_specific_goal=False
                    )
                    
                    created_issues.append({
                        "id": issue['number'],
                        "title": issue['title'],
                        "description": issue['body'],
                        "url": issue['html_url']
                    })
                    
                    # Store the mapping of goal ID to issue number
                    issue_number_map[goal['id']] = issue['number']
            
            # Then create all specific goals (child issues) with correct parent references
            for goal in goals:
                if goal.get('is_specific_goal', False):
                    parent_id = goal.get('parent_issue_number')
                    parent_number = issue_number_map.get(parent_id)
                    
                    issue = self.create_issue(
                        repo_name, 
                        goal['title'], 
                        goal['description'], 
                        is_broad_goal=False,
                        is_specific_goal=True,
                        parent_issue_number=parent_number
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

    def get_user_repositories(self):
        """Get list of repositories for the authenticated user."""
        endpoint = f'{self.api_base_url}/user/repos'
        
        response = requests.get(
            endpoint,
            headers=self.get_headers(),
            params={'sort': 'updated', 'direction': 'desc'}
        )
        
        if response.status_code != 200:
            error_msg = f"Failed to get repositories: {response.status_code} - {response.text}"
            print(error_msg)
            raise Exception(error_msg)
        
        repos = response.json()
        return [{
            'name': repo['name'],
            'description': repo['description'],
            'url': repo['html_url'],
            'updated_at': repo['updated_at']
        } for repo in repos]

    def get_repository_issues(self, repo_name, state='all'):
        """
        Get all issues for a repository.
        
        Args:
            repo_name (str): The name of the repository
            state (str): State of issues to fetch ('open', 'closed', or 'all')
            
        Returns:
            list: List of issues with their details
        """
        username = self._get_username()
        endpoint = f'{self.api_base_url}/repos/{username}/{repo_name}/issues'
        
        response = requests.get(
            endpoint,
            headers=self.get_headers(),
            params={'state': state, 'per_page': 100}
        )
        
        if response.status_code != 200:
            error_msg = f"Failed to get issues: {response.status_code} - {response.text}"
            print(error_msg)
            raise Exception(error_msg)
        
        issues = response.json()
        return [{
            'id': issue['number'],
            'title': issue['title'],
            'description': issue['body'],
            'url': issue['html_url'],
            'state': issue['state'],
            'labels': [label['name'] for label in issue['labels']],
            'is_broad_goal': any(label['name'] == 'broad-goal' for label in issue['labels']),
            'is_specific_goal': any(label['name'] == 'specific-goal' for label in issue['labels'])
        } for issue in issues]

    def update_issue(self, repo_name, issue_number, title=None, body=None, state=None):
        """
        Update an existing issue.
        
        Args:
            repo_name (str): The name of the repository
            issue_number (int): The issue number to update
            title (str, optional): New title for the issue
            body (str, optional): New body/description for the issue
            state (str, optional): New state for the issue ('open' or 'closed')
            
        Returns:
            dict: Updated issue information
        """
        username = self._get_username()
        endpoint = f'{self.api_base_url}/repos/{username}/{repo_name}/issues/{issue_number}'
        
        data = {}
        if title is not None:
            data['title'] = title
        if body is not None:
            data['body'] = body
        if state is not None:
            data['state'] = state
        
        response = requests.patch(
            endpoint,
            headers=self.get_headers(),
            json=data
        )
        
        if response.status_code != 200:
            error_msg = f"Failed to update issue: {response.status_code} - {response.text}"
            print(error_msg)
            raise Exception(error_msg)
        
        issue = response.json()
        return {
            'id': issue['number'],
            'title': issue['title'],
            'description': issue['body'],
            'url': issue['html_url'],
            'state': issue['state'],
            'labels': [label['name'] for label in issue['labels']]
        } 