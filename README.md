# GitHub Manager

A powerful web application that intelligently breaks down project requirements into GitHub issues using AI. GitHub Manager streamlines the project planning process by automatically generating structured tasks from your requirements and seamlessly integrating with GitHub.

## Features

### Core Functionality
- **Voice Input**: Record and transcribe your project requirements directly through your microphone
- **Interactive Step-by-Step Process**: Guide users through a structured workflow from requirements to GitHub issues
- **Intelligent Text Analysis**: Analyze project requirements using Azure AI and OpenAI LLM
- **AI-Powered Goal Generation**: Leverage Azure OpenAI to intelligently create project goals
- **Goal Breakdown**: Break big goals into smaller, actionable tasks using AI

### GitHub Integration
- **Repository Management**: Create new repositories or work with existing ones
- **Automated Issue Creation**: Generate GitHub issues from your tasks with a single click
- **Issue Management**: Update, delete, and track issues directly from the application
- **Issue Synchronization**: Keep your local tasks and GitHub issues in sync

### Visualization & UI
- **Tree Visualization**: View your project structure in an intuitive hierarchical tree format
- **Graph Visualization**: Alternative visualization showing relationships between tasks
- **Gantt Chart**: Plan and visualize project timelines with interactive Gantt charts
- **Real-time Feedback**: Loading indicators and progress updates during processing
- **Responsive UI**: Works on desktop and mobile devices
- **Dark Mode Support**: Easy on the eyes during late-night planning sessions

### Project Management
- **Local Storage**: Save your progress and continue later
- **Editable Goals**: Modify AI-generated tasks to fit your exact requirements
- **Step Navigation**: Easily move between different stages of your project planning
- **Task Prioritization**: Assign priorities to tasks for better workflow management
- **Work in Progress Tracking**: Monitor ongoing tasks and their status

## User Journeys

### 1. Meeting Note Taker & PBI Creator

**Scenario**: Product team meeting to discuss new feature requirements

1. During the meeting, the team discusses requirements for a new feature
2. The scrum master opens GitHub Manager and uses voice recording to capture the conversation
3. After the meeting, the transcribed text is automatically analyzed to identify high-level tasks
4. The application breaks these down into specific, actionable Product Backlog Items (PBIs)
5. The scrum master reviews and adjusts the PBIs as needed
6. With a single click, a new GitHub repository is created with all PBIs as issues
7. The team can immediately start development with a well-organized backlog

### 2. Solo Developer Project Kickoff

**Scenario**: Independent developer starting a new side project

1. Developer has a new app idea but struggles to organize where to begin
2. They input their app concept through text or voice into GitHub Manager
3. The application analyzes the requirements and generates structured high-level goals
4. Each goal is automatically broken down into smaller, achievable tasks
5. The developer reviews the generated hierarchy in the tree visualization
6. They adjust any tasks that don't match their vision
7. GitHub Manager creates a new repository with all the tasks as issues
8. The developer can now start coding with a clear roadmap

### 3. Technical Documentation Creation

**Scenario**: Technical writer creating documentation for a complex system

1. The technical writer interviews engineers about a system that needs documentation
2. They record the conversation through GitHub Manager's voice input
3. The system transcribes and analyzes the technical details
4. GitHub Manager generates a hierarchical structure of documentation topics
5. The writer reviews the tree view to ensure the documentation structure is logical
6. They modify headings and descriptions to match documentation standards
7. A repository is created with issues representing each documentation section
8. The writing team can now collaborate efficiently with a clear documentation plan

## Architecture

- **Backend**: Python with Flask
- **Frontend**: HTML, CSS, JavaScript
- **APIs**: GitHub API, Azure AI Text Analytics API, Azure OpenAI API

## Setup Instructions

### Prerequisites

- **Python**: Version 3.7 or higher
- **GitHub Account**: With personal access token that has repo and user permissions
- **Azure Account**: With the following services set up:
  - Azure Cognitive Services (Text Analytics)
  - Azure OpenAI Service
  - Azure Speech Service (for voice input functionality)

### Detailed Installation Guide

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/github-manager.git
cd github-manager
```

#### 2. Set Up a Python Virtual Environment (Recommended)

```bash
# For macOS/Linux
python3 -m venv venv
source venv/bin/activate

# For Windows
python -m venv venv
venv\Scripts\activate
```

#### 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials. Here's how to obtain each required key:

- **GitHub Token**:
  1. Go to GitHub → Settings → Developer settings → Personal access tokens → Generate new token
  2. Select the following scopes: `repo` (all), `user`, `admin:org` (read:org is sufficient)
  3. Copy the generated token to `GITHUB_TOKEN` in your `.env` file

- **Azure Cognitive Services**:
  1. Create a Cognitive Services resource in Azure Portal
  2. Navigate to Keys and Endpoint section
  3. Copy Key 1 to `AZURE_KEY` and Endpoint to `AZURE_ENDPOINT` in your `.env` file

- **Azure OpenAI**:
  1. Create an Azure OpenAI resource in Azure Portal
  2. Deploy the required models in Azure OpenAI Studio (gpt-4o and gpt-4o-mini-audio-preview)
  3. Copy the API key to `AZURE_OPENAI_KEY` and endpoint to `ENDPOINT_URL` in your `.env` file

- **Azure Speech Service**:
  1. Create a Speech resource in Azure Portal
  2. Copy the key to `SPEECH_KEY` and region to `SPEECH_REGION` in your `.env` file

#### 5. Run the Application

```bash
python app.py
```

#### 6. Access the Application

Open your web browser and navigate to:
```
http://localhost:5000
```

### Troubleshooting Common Setup Issues

- **Port Conflicts**: If port 5000 is already in use, you can change the port in the `.env` file
- **API Rate Limits**: GitHub API has rate limits. If you encounter them, wait or use a different token
- **Model Availability**: Ensure you have deployed the correct models in Azure OpenAI Studio
- **CORS Issues**: If you're developing locally, you might need to configure CORS settings
- **Dependencies**: If you encounter dependency errors, try `pip install -r requirements.txt --upgrade`

## Usage Flow

### New Project Workflow

1. **Start a New Project**:
   - Click on the "New Project" button in the sidebar
   - You'll be guided through a step-by-step process

2. **Enter Project Instructions**:
   - Type your project requirements in the text area, or
   - Use the voice recording feature to dictate your requirements
   - Click "Next" when you're satisfied with your input

3. **Review Big Goals**:
   - The system will analyze your requirements and generate high-level goals
   - Review and edit these goals as needed
   - Add, delete, or modify goals to match your vision
   - Click "Next" to proceed

4. **Review Small Goals**:
   - Each big goal is broken down into smaller, actionable tasks
   - Review and adjust these tasks
   - Drag and drop to reorder tasks if needed
   - Click "Next" to continue

5. **Create Repository**:
   - Enter a name for your GitHub repository
   - Optionally add a description
   - Choose whether to make it public or private
   - Click "Create Repository" to set it up on GitHub

6. **Create Issues**:
   - Review the tasks that will be converted to GitHub issues
   - Click "Create Issues" to generate them in your repository
   - Wait for confirmation that all issues have been created

7. **View Results**:
   - See a summary of all created issues
   - Click on any issue to view it directly on GitHub
   - Explore the tree or graph visualization of your project structure

### Existing Project Workflow (Work in Progress)

1. **Select Existing Project**:
   - Click on the "Existing Project" button in the sidebar
   - Search for and select your GitHub repository

2. **Manage Issues**:
   - View, update, and delete existing issues
   - Create new issues as needed
   - Synchronize changes between the application and GitHub

## Development

### Project Structure

```
github-manager/
├── backend/
│   ├── services/
│   │   ├── azure_service.py      # Azure AI services integration
│   │   ├── github_service.py     # GitHub API integration
│   │   ├── openai_service.py     # Azure OpenAI integration
│   │   ├── speech_service.py     # Azure Speech Service integration
│   │   └── __init__.py
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css        # Main stylesheet
│   │   ├── js/
│   │   │   ├── app.js            # Main application logic
│   │   │   ├── gantt-chart-bundle.js  # Gantt chart functionality
│   │   │   └── audio-recorder.js # Voice recording functionality
│   │   └── images/               # Application images and icons
│   ├── templates/
│   │   └── index.html            # Single page application template
│   ├── app.py                    # Flask application entry point
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Example environment variables
│   └── .env                      # Actual environment variables (not in repo)
├── docs/                         # Documentation
└── README.md                     # Project documentation
```

### Key Components

- **Flask Backend**: Handles API requests, authentication, and service integration
- **GitHub Service**: Manages repository and issue operations through the GitHub API
- **Azure Services**: Integrates with Azure AI for text analysis and language processing
- **Frontend Application**: Single-page application with modern UI components
- **Voice Processing**: Records and transcribes voice input for project requirements

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
