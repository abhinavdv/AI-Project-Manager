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
Based on the following project description, generate broad project goals and their specific actionable sub-tasks.
Each broad goal should be broken down into specific, actionable sub-tasks.

Create tasks in an time ordered manner. In a normal project, the tasks are completed in a linear manner. So this should be linear too. If there are any dependencies, they should be handled in the sub-tasks.

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

MODIFY_GANTT_VOICE_PROMPT = """
Below is a Gantt chart JSON structure containing task assignments with developer names, dates, and estimated hours. Based on the voice input, make appropriate modifications to the Gantt chart data. Modifications might include:

1. Changing start or end dates for tasks
2. Reassigning tasks to different developers
3. Adjusting estimated hours for tasks
4. Reordering task dependencies
5. Adding or removing tasks

Make ONLY changes based on the voice input. Return the ENTIRE updated JSON structure, preserving the overall format.

Below is the current JSON:
"""