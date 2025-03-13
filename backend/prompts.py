"""
This module contains all the prompts used in the application.
Each prompt is a template that can be formatted with specific values.
"""

# System prompts
SYSTEM_PROMPT = """You are a helpful assistant that specializes in project management and breaking down tasks. 
Your responses should be in valid JSON format only, without any additional text, explanations, or markdown formatting. 
Always structure your response exactly as requested in the user's prompt."""

AUDIO_TRANSCRIPTION_PROMPT = """You are an scrummaster that listens to a conversation and understands what the project is about and summarizes the key details talked about in that conversation."""

# User prompts
GENERATE_GOALS_PROMPT = """
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