"""
This module contains all the prompts used in the application.
Each prompt is a template that can be formatted with specific values.
"""

# System prompts
SYSTEM_PROMPT = """You are a helpful assistant that specializes in project management and breaking down tasks. 
Your responses should be in valid JSON format only, without any additional text, explanations, or markdown formatting. 
Always structure your response exactly as requested in the user's prompt."""

AUDIO_TRANSCRIPTION_PROMPT = """You are an scrummaster that listens to a conversation and understands what the project is about and summarizes the key details talked about in that conversation. Be sure to include all the details and context of the conversation in the summary."""

# User prompts
GENERATE_GOALS_PROMPT = """
Based on the following project description, generate 3-5 broad project goals and their specific sub-tasks.
Each broad goal should be broken down into 2-4 specific, actionable sub-tasks.

1. From Idea to Single Issue
a) Clear and Concise Title: Use a brief, descriptive title summarizing the idea or problem.
b) Detailed Description: Explain the context and rationale behind the idea.
c) State the desired outcome and any specific scenarios that prompted the idea.
d) Steps to Reproduce (if applicable): For bug-related ideas, list clear, step-by-step instructions to reproduce the issue.
e) Environment and Context: Provide software versions, operating systems, dependencies, or any conditions affecting the issue.
f) Expected vs. Actual Behavior: Define what should happen versus what is currently occurring.
g) Visual Aids and Logs: Attach screenshots, error logs, or code snippets to illustrate the problem or concept.
h) Labeling and Categorization: Use consistent labels (e.g., bug, enhancement, documentation) to streamline issue tracking.
i) Priority and Impact: Indicate the issue's priority and its impact on the project or business operations.
j) Assigning Ownership: Suggest or assign the issue to a relevant team or individual.
k) Reference Related Work: Link to related issues, pull requests, or documentation for context.

2. Breaking Down an Idea into Multiple Features
a) Idea Analysis and Brainstorming:
Think Broadly: Start with a brainstorming session to explore the idea from all angles.
Consider the primary goal, user needs, and business outcomes.
b) 
For instance, if the idea is a "User Dashboard," think of features like user profile management, analytics display, notifications, and customization options.
c) List Possible Features: Write down every potential feature that could enhance the idea, even if some seem secondary at first.
d) Mapping Out Features: Prioritize Based on Impact:
Evaluate features based on user value, technical feasibility, and business impact.
e) Consider Dependencies: Identify if certain features depend on the completion of others.
f) Edge Cases and Scenarios: Think about how the features will work under different user scenarios, including edge cases (e.g., handling error states, offline functionality, scalability).
g) Creating Multiple GitHub Issues: Create individual GitHub issues for each feature to keep them isolated, making it easier to track progress and assign responsibilities.
h) Separate Issues for Each Feature: Create individual GitHub issues for each feature to keep them isolated, making it easier to track progress and assign responsibilities.
i) Link Related Issues: Use references to connect related issues, indicating which issues are sub-tasks or depend on others.
j) Define Clear Acceptance Criteria: For each feature, set clear success criteria to determine when the feature meets the desired outcomes.
k) Iterate and Refine: Review and adjust the list of features periodically as new insights emerge from development and testing.
l) Iterate and Refine: Review and adjust the list of features periodically as new insights emerge from development and testing.
m) Holistic Consideration of All Scenarios: Visualize the end-to-end experience to ensure all potential user interactions and flows are covered.
n) Stakeholder Input: Gather feedback from team members, product managers, and even users to validate that all relevant features are captured.
o) Risk and Impact Analysis: Analyze which features are critical and which might require more refinement, ensuring that the solution is robust under various scenarios.
p) User Journey Mapping: Visualize the end-to-end experience to ensure all potential user interactions and flows are covered.

PROJECT DESCRIPTION:
{text}

Provide the goals and their sub-tasks in the following JSON format:
{{
    "goals": [
        {{
            "id": 1,
            "title": "Main goal title",
            "description": "Detailed description of the main goal",
            "sub_tasks": [
                {{
                    "id": 101,
                    "title": "Sub-task title",
                    "description": "Detailed description of the sub-task"
                }},
                ...
            ]
        }},
        ...
    ]
}}

Include only the JSON in your response.
"""

BREAK_DOWN_GOAL_PROMPT = """
Break down the following broad goal into 3-5 specific, actionable goals.
Each specific goal should be focused and achievable.

BROAD GOAL: {goal_title}
DESCRIPTION: {goal_description}

Provide the specific goals in the following JSON format:
{{
    "specificGoals": [
        {{
            "id": {goal_id_start},
            "title": "First specific goal title",
            "description": "Detailed description of the first specific goal"
        }},
        {{
            "id": {goal_id_start_plus_one},
            "title": "Second specific goal title",
            "description": "Detailed description of the second specific goal"
        }},
        ... (and so on for 3-5 goals)
    ]
}}

Start IDs from {goal_id_start} for tracking purposes. Include only the JSON in your response.
"""

GENERATE_REPO_INFO_PROMPT = """
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

MODIFY_TASKS_VOICE_PROMPT = """
below is a set of tasks and sub-tasks for each task based on the conversation, figure out if any changes are needed to any task based on the conversation. MAKE ONLY CHANGES BASED ON THE CONVERSATION

Below is the current JSON
""" 