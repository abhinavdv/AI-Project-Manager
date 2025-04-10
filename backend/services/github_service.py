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
        
        # Prepare labels
        labels = []
        if is_broad_goal:
            labels.append("broad-goal")
        if is_specific_goal:
            labels.append("specific-goal")
        
        # Add parent reference to body if provided (for backward compatibility)
        if parent_issue_number:
            parent_ref = f"\n\nParent Task: #{parent_issue_number}"
            body = f"{body or ''}{parent_ref}"
        
        data = {
            "title": title,
            "body": body or "",
            "labels": labels
        }
        
        print(f"Creating issue '{title}' in repo {repo_name}")
        print(f"URL: {url}")
        print(f"Data: {data}")
        
        response = requests.post(
            url,
            headers=self.get_headers(),
            json=data
        )
        
        if response.status_code != 201:
            error_message = response.text
            try:
                error_json = response.json()
                if 'message' in error_json:
                    error_message = error_json['message']
            except:
                pass
            raise Exception(f"Failed to create issue: {error_message}")
        
        created_issue = response.json()
        print(f"Created issue #{created_issue['number']}: {created_issue['title']}")
        
        # If this is a sub-task and parent_issue_number is provided, add it as a sub-issue
        if parent_issue_number and is_specific_goal:
            try:
                print(f"Adding issue #{created_issue['number']} as sub-issue to parent #{parent_issue_number}")
                # Make sure parent_issue_number and created_issue['number'] are integers
                parent_num = int(parent_issue_number)
                sub_issue_num = int(created_issue['number'])
                self.add_sub_issue(repo_name, parent_num, sub_issue_num)
                print(f"Successfully added issue #{sub_issue_num} as sub-issue to parent #{parent_num}")
            except Exception as e:
                print(f"Warning: Failed to add as sub-issue: {str(e)}")
        
        return created_issue
    
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

    def add_sub_issue(self, repo_name, parent_issue_number, sub_issue_id):
        """
        Add an issue as a sub-issue to a parent issue.
        
        Args:
            repo_name (str): The name of the repository
            parent_issue_number (int): The issue number of the parent
            sub_issue_id (int): The issue number of the sub-issue to add
            
        Returns:
            dict: Response from the GitHub API
        """
        username = self._get_username()
        url = f"{self.api_base_url}/repos/{username}/{repo_name}/issues/{parent_issue_number}/sub_issues"
        
        data = {
            "sub_issue_id": sub_issue_id
        }
        
        # Add the GitHub API preview header for sub-issues feature
        headers = self.get_headers()
        headers['Accept'] = 'application/vnd.github+json'
        headers['X-GitHub-Api-Version'] = '2022-11-28'
        
        print(f"Adding sub-issue {sub_issue_id} to parent {parent_issue_number} in repo {repo_name}")
        print(f"URL: {url}")
        print(f"Headers: {headers}")
        print(f"Data: {data}")
        
        response = requests.post(
            url,
            headers=headers,
            json=data
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code != 201:
            error_message = response.text
            try:
                error_json = response.json()
                if 'message' in error_json:
                    error_message = error_json['message']
            except:
                pass
            raise Exception(f"Failed to add sub-issue: {error_message}")
        
        return response.json()
    
    def list_sub_issues(self, repo_name, parent_issue_number):
        """
        List all sub-issues for a parent issue.
        
        Args:
            repo_name (str): The name of the repository
            parent_issue_number (int): The issue number of the parent
            
        Returns:
            list: List of sub-issues
        """
        username = self._get_username()
        url = f"{self.api_base_url}/repos/{username}/{repo_name}/issues/{parent_issue_number}/sub_issues"
        
        # Add the GitHub API preview header for sub-issues feature
        headers = self.get_headers()
        headers['Accept'] = 'application/vnd.github+json'
        headers['X-GitHub-Api-Version'] = '2022-11-28'
        
        response = requests.get(
            url,
            headers=headers
        )
        
        if response.status_code != 200:
            error_message = response.json().get('message', 'Unknown error')
            raise Exception(f"Failed to list sub-issues: {error_message}")
        
        return response.json()
    
    def delete_issue(self, repo_name, issue_number):
        """
        Delete an existing issue.
        
        Args:
            repo_name (str): The name of the repository
            issue_number (int): The issue number to delete
            
        Returns:
            bool: True if deletion was successful
        """
        username = self._get_username()
        endpoint = f'{self.api_base_url}/repos/{username}/{repo_name}/issues/{issue_number}'
        
        # GitHub API doesn't allow true deletion of issues, so we'll close it with a specific label
        data = {
            'state': 'closed',
            'labels': ['deleted']
        }
        
        response = requests.patch(
            endpoint,
            headers=self.get_headers(),
            json=data
        )
        
        if response.status_code != 200:
            error_msg = f"Failed to delete issue: {response.status_code} - {response.text}"
            print(error_msg)
            raise Exception(error_msg)
        
        return True
        
    def update_issue(self, repo_name, issue_number, title=None, body=None, state=None, is_broad_goal=False, is_specific_goal=False):
        """
        Update an existing issue.
        
        Args:
            repo_name (str): The name of the repository
            issue_number (int): The issue number to update
            title (str, optional): New title for the issue
            body (str, optional): New body/description for the issue
            state (str, optional): New state for the issue ('open' or 'closed')
            is_broad_goal (bool): Whether this is a high-level task
            is_specific_goal (bool): Whether this is a sub-task
            
        Returns:
            dict: Updated issue information
        """
        username = self._get_username()
        endpoint = f'{self.api_base_url}/repos/{username}/{repo_name}/issues/{issue_number}'
        
        # First, get the current issue to preserve existing labels
        current_issue_response = requests.get(
            endpoint,
            headers=self.get_headers()
        )
        
        if current_issue_response.status_code != 200:
            error_msg = f"Failed to get current issue: {current_issue_response.status_code} - {current_issue_response.text}"
            print(error_msg)
            raise Exception(error_msg)
            
        current_issue = current_issue_response.json()
        current_labels = [label['name'] for label in current_issue['labels']]
        
        # Prepare labels - keep existing ones and add/ensure our special labels
        labels = current_labels.copy()
        
        # Remove existing broad-goal or specific-goal labels if they exist
        if 'broad-goal' in labels:
            labels.remove('broad-goal')
        if 'specific-goal' in labels:
            labels.remove('specific-goal')
            
        # Add appropriate labels based on parameters
        if is_broad_goal:
            labels.append('broad-goal')
        if is_specific_goal:
            labels.append('specific-goal')
        
        # Prepare data for update
        data = {}
        if title is not None:
            data['title'] = title
        if body is not None:
            data['body'] = body
        if state is not None:
            data['state'] = state
        
        # Only include labels if we're changing them
        if set(labels) != set(current_labels):
            data['labels'] = labels
        
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