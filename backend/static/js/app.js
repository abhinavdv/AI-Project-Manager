// GitHub Manager Application

// State management
const state = {
    prompt: '',
    bigGoals: [],
    smallGoals: {},
    repository: null,
    issues: [],
    activeStep: 1,
    loading: false
};

// DOM Elements
const elements = {
    steps: document.querySelectorAll('.step'),
    stepContents: document.querySelectorAll('.step-content'),
    stepIndicator: document.getElementById('step-indicator'),
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingMessage: document.getElementById('loading-message'),
    notification: document.getElementById('notification'),
    notificationMessage: document.getElementById('notification-message'),
    notificationClose: document.getElementById('notification-close'),
    
    // Step 1: Prompt
    promptInput: document.getElementById('prompt-input'),
    analyzeBtn: document.getElementById('analyze-btn'),
    
    // Step 2: Big Goals
    bigGoalsContainer: document.getElementById('big-goals-container'),
    backToPromptBtn: document.getElementById('back-to-prompt-btn'),
    proceedToSmallGoalsBtn: document.getElementById('proceed-to-small-goals-btn'),
    
    // Step 3: Small Goals
    smallGoalsContainer: document.getElementById('small-goals-container'),
    backToBigGoalsBtn: document.getElementById('back-to-big-goals-btn'),
    proceedToRepoBtn: document.getElementById('proceed-to-repo-btn'),
    
    // Step 4: Repository
    repoNameInput: document.getElementById('repo-name'),
    repoDescriptionInput: document.getElementById('repo-description'),
    repoInfoLoading: document.getElementById('repo-info-loading'),
    backToSmallGoalsBtn: document.getElementById('back-to-small-goals-btn'),
    createRepoBtn: document.getElementById('create-repo-btn'),
    
    // Step 5: Issues
    issuesPreviewContainer: document.getElementById('issues-preview-container'),
    backToRepoBtn: document.getElementById('back-to-repo-btn'),
    createIssuesBtn: document.getElementById('create-issues-btn'),
    
    // Results
    resultsContainer: document.getElementById('results-container'),
    startOverBtn: document.getElementById('start-over-btn'),
    
    // Templates
    goalTemplate: document.getElementById('goal-template')
};

// Utility functions
function showLoading(message = 'Processing...') {
    state.loading = true;
    elements.loadingMessage.textContent = message;
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    state.loading = false;
    elements.loadingOverlay.classList.add('hidden');
}

function showNotification(message, type = 'success') {
    elements.notificationMessage.textContent = message;
    elements.notification.className = 'notification ' + type;
    elements.notification.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        elements.notification.classList.add('hidden');
    }, 5000);
}

function scrollToActiveStep() {
    // Scroll to the active step with smooth behavior
    setTimeout(() => {
        const activeStep = document.querySelector('.step-content.active');
        if (activeStep) {
            activeStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

function goToStep(stepNumber) {
    // Update state
    state.activeStep = stepNumber;
    
    // Update step indicators
    elements.steps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum === state.activeStep) {
            step.classList.add('active');
        } else if (stepNum < state.activeStep) {
            step.classList.add('completed');
        }
    });
    
    // Update content sections
    elements.stepContents.forEach((content, index) => {
        const stepNum = index + 1;
        content.classList.remove('active');
        
        if (stepNum === state.activeStep) {
            content.classList.add('active');
        }
    });
    
    // Perform step-specific actions
    if (stepNumber === 4) {
        // Auto-populate repository info when reaching Step 4
        generateRepositoryInfo();
    }
    
    // Scroll to the active step
    scrollToActiveStep();
}

// API functions
async function fetchAPI(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`/api/${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Something went wrong');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// Element creation/rendering functions
function createGoalElement(goal, isSmall = false) {
    const template = elements.goalTemplate.content.cloneNode(true);
    const goalElement = template.querySelector('.goal-item');
    
    goalElement.dataset.id = goal.id;
    
    const toggleBtn = goalElement.querySelector('.toggle-goal');
    toggleBtn.addEventListener('click', () => {
        goalElement.classList.toggle('collapsed');
    });
    
    const titleInput = goalElement.querySelector('.goal-title');
    titleInput.value = goal.title;
    titleInput.addEventListener('change', (e) => {
        if (isSmall) {
            const bigGoalId = goalElement.closest('.big-goal-section').dataset.id;
            const smallGoalIndex = state.smallGoals[bigGoalId].findIndex(g => g.id === parseInt(goal.id));
            state.smallGoals[bigGoalId][smallGoalIndex].title = e.target.value;
        } else {
            const goalIndex = state.bigGoals.findIndex(g => g.id === parseInt(goal.id));
            state.bigGoals[goalIndex].title = e.target.value;
        }
    });
    
    const descTextarea = goalElement.querySelector('.goal-description');
    descTextarea.value = goal.description;
    descTextarea.addEventListener('change', (e) => {
        if (isSmall) {
            const bigGoalId = goalElement.closest('.big-goal-section').dataset.id;
            const smallGoalIndex = state.smallGoals[bigGoalId].findIndex(g => g.id === parseInt(goal.id));
            state.smallGoals[bigGoalId][smallGoalIndex].description = e.target.value;
        } else {
            const goalIndex = state.bigGoals.findIndex(g => g.id === parseInt(goal.id));
            state.bigGoals[goalIndex].description = e.target.value;
        }
    });
    
    const deleteBtn = goalElement.querySelector('.delete-goal');
    deleteBtn.addEventListener('click', () => {
        // Add confirmation
        if (confirm('Are you sure you want to delete this goal?')) {
            if (isSmall) {
                const bigGoalId = goalElement.closest('.big-goal-section').dataset.id;
                state.smallGoals[bigGoalId] = state.smallGoals[bigGoalId].filter(g => g.id !== parseInt(goal.id));
                renderSmallGoals();
            } else {
                state.bigGoals = state.bigGoals.filter(g => g.id !== parseInt(goal.id));
                delete state.smallGoals[goal.id];
                renderBigGoals();
                renderSmallGoals();
            }
        }
    });
    
    // Add animation effect
    goalElement.style.opacity = '0';
    goalElement.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        goalElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        goalElement.style.opacity = '1';
        goalElement.style.transform = 'translateY(0)';
    }, 50);
    
    return goalElement;
}

function createBigGoalSection(goal) {
    const section = document.createElement('div');
    section.className = 'big-goal-section';
    section.dataset.id = goal.id;
    
    const header = document.createElement('h3');
    header.innerHTML = `<i class="material-icons">assignment</i> Big Goal: ${goal.title}`;
    
    const smallGoalsContainer = document.createElement('div');
    smallGoalsContainer.className = 'small-goals-container';
    
    section.appendChild(header);
    section.appendChild(smallGoalsContainer);
    
    return section;
}

function renderBigGoals() {
    elements.bigGoalsContainer.innerHTML = '';
    
    state.bigGoals.forEach(goal => {
        const goalElement = createGoalElement(goal);
        elements.bigGoalsContainer.appendChild(goalElement);
    });
    
    // Add "Add Goal" button
    const addButton = document.createElement('button');
    addButton.className = 'btn secondary';
    addButton.innerHTML = '<i class="material-icons">add</i> Add Goal';
    addButton.addEventListener('click', addNewBigGoal);
    
    elements.bigGoalsContainer.appendChild(addButton);
}

function renderSmallGoals() {
    elements.smallGoalsContainer.innerHTML = '';
    
    state.bigGoals.forEach(bigGoal => {
        const section = createBigGoalSection(bigGoal);
        const container = section.querySelector('.small-goals-container');
        
        // Get small goals for this big goal
        const smallGoals = state.smallGoals[bigGoal.id] || [];
        
        smallGoals.forEach(smallGoal => {
            const goalElement = createGoalElement(smallGoal, true);
            container.appendChild(goalElement);
        });
        
        // Add "Add Small Goal" button
        const addButton = document.createElement('button');
        addButton.className = 'btn secondary';
        addButton.innerHTML = '<i class="material-icons">add_task</i> Add Small Goal';
        addButton.dataset.bigGoalId = bigGoal.id;
        addButton.addEventListener('click', (e) => {
            const bigGoalId = parseInt(e.currentTarget.dataset.bigGoalId);
            addNewSmallGoal(bigGoalId);
        });
        
        container.appendChild(addButton);
        elements.smallGoalsContainer.appendChild(section);
    });
}

function renderIssuesPreview() {
    elements.issuesPreviewContainer.innerHTML = '';
    
    let allSmallGoals = [];
    
    // Collect all small goals
    state.bigGoals.forEach(bigGoal => {
        const smallGoals = state.smallGoals[bigGoal.id] || [];
        allSmallGoals = allSmallGoals.concat(smallGoals.map(goal => ({
            ...goal,
            bigGoalTitle: bigGoal.title
        })));
    });
    
    // Render each issue preview
    allSmallGoals.forEach(goal => {
        const issueElement = document.createElement('div');
        issueElement.className = 'goal-item';
        
        const issueHeader = document.createElement('div');
        issueHeader.className = 'goal-header';
        
        const issueTitle = document.createElement('div');
        issueTitle.className = 'goal-title';
        issueTitle.innerHTML = `<i class="material-icons">label</i> ${goal.title}`;
        
        const issueBody = document.createElement('div');
        issueBody.className = 'goal-body';
        
        const issueDescription = document.createElement('div');
        issueDescription.className = 'issue-description';
        issueDescription.innerHTML = `${goal.description} <br><br><small><i class="material-icons" style="font-size: 16px; vertical-align: middle;">category</i> Part of: ${goal.bigGoalTitle}</small>`;
        
        issueHeader.appendChild(issueTitle);
        issueBody.appendChild(issueDescription);
        
        issueElement.appendChild(issueHeader);
        issueElement.appendChild(issueBody);
        
        elements.issuesPreviewContainer.appendChild(issueElement);
    });
}

function renderResults() {
    elements.resultsContainer.innerHTML = '';
    
    // Repository info
    const repoSection = document.createElement('div');
    repoSection.className = 'result-section';
    
    const repoHeader = document.createElement('h3');
    repoHeader.innerHTML = '<i class="material-icons">code</i> Repository Created';
    
    const repoUrl = document.createElement('a');
    repoUrl.href = state.repository.url;
    repoUrl.textContent = state.repository.url;
    repoUrl.target = '_blank';
    
    repoSection.appendChild(repoHeader);
    repoSection.appendChild(repoUrl);
    
    // Issues info
    const issuesSection = document.createElement('div');
    issuesSection.className = 'result-section';
    
    const issuesHeader = document.createElement('h3');
    issuesHeader.innerHTML = '<i class="material-icons">task_alt</i> Issues Created';
    
    const issuesList = document.createElement('ul');
    issuesList.className = 'issues-list';
    
    state.issues.forEach(issue => {
        const issueItem = document.createElement('li');
        
        const issueLink = document.createElement('a');
        issueLink.href = issue.url;
        issueLink.innerHTML = `<i class="material-icons" style="font-size: 16px; vertical-align: middle;">task</i> ${issue.title}`;
        issueLink.target = '_blank';
        
        issueItem.appendChild(issueLink);
        issuesList.appendChild(issueItem);
    });
    
    issuesSection.appendChild(issuesHeader);
    issuesSection.appendChild(issuesList);
    
    elements.resultsContainer.appendChild(repoSection);
    elements.resultsContainer.appendChild(issuesSection);
}

// Actions
async function analyzePrompt() {
    const prompt = elements.promptInput.value.trim();
    
    if (!prompt) {
        showNotification('Please enter project instructions', 'warning');
        return;
    }
    
    state.prompt = prompt;
    
    try {
        showLoading('Analyzing prompt and generating goals...');
        
        const result = await fetchAPI('analyze', 'POST', { prompt });
        state.bigGoals = result.big_goals;
        
        // Initialize smallGoals objects for each big goal
        state.bigGoals.forEach(goal => {
            state.smallGoals[goal.id] = [];
        });
        
        renderBigGoals();
        goToStep(2);
        showNotification('Goals generated successfully!', 'success');
    } catch (error) {
        // Error is already handled in fetchAPI
    } finally {
        hideLoading();
    }
}

async function breakDownGoals() {
    if (state.bigGoals.length === 0) {
        showNotification('No big goals to break down', 'warning');
        return;
    }
    
    try {
        showLoading('Breaking down goals...');
        
        // Process each big goal
        for (const bigGoal of state.bigGoals) {
            const result = await fetchAPI('break-down-goal', 'POST', {
                goal_id: bigGoal.id,
                goal_title: bigGoal.title,
                goal_description: bigGoal.description
            });
            
            state.smallGoals[bigGoal.id] = result.smaller_goals;
        }
        
        renderSmallGoals();
        goToStep(3);
        showNotification('Goals broken down successfully!', 'success');
    } catch (error) {
        // Error is already handled in fetchAPI
    } finally {
        hideLoading();
    }
}

async function createRepository() {
    const repoName = elements.repoNameInput.value.trim();
    const repoDescription = elements.repoDescriptionInput.value.trim();
    
    if (!repoName) {
        showNotification('Repository name is required', 'warning');
        return;
    }
    
    try {
        showLoading('Creating GitHub repository...');
        
        const result = await fetchAPI('create-repository', 'POST', {
            repo_name: repoName,
            repo_description: repoDescription
        });
        
        state.repository = result.repository;
        renderIssuesPreview();
        goToStep(5);
        showNotification('Repository created successfully!', 'success');
    } catch (error) {
        // Error is already handled in fetchAPI
    } finally {
        hideLoading();
    }
}

async function createIssues() {
    if (!state.repository) {
        showNotification('Repository not created yet', 'warning');
        return;
    }
    
    try {
        showLoading('Creating GitHub issues...');
        
        let allSmallGoals = [];
        
        // Collect all small goals
        state.bigGoals.forEach(bigGoal => {
            const smallGoals = state.smallGoals[bigGoal.id] || [];
            allSmallGoals = allSmallGoals.concat(smallGoals);
        });
        
        const result = await fetchAPI('create-issues', 'POST', {
            repo_name: state.repository.name,
            goals: allSmallGoals
        });
        
        state.issues = result.issues;
        renderResults();
        goToStep(6); // Move to results view
        showNotification('Issues created successfully!', 'success');
    } catch (error) {
        // Error is already handled in fetchAPI
    } finally {
        hideLoading();
    }
}

function addNewBigGoal() {
    const newId = state.bigGoals.length > 0 
        ? Math.max(...state.bigGoals.map(g => g.id)) + 1 
        : 1;
    
    const newGoal = {
        id: newId,
        title: 'New Goal',
        description: 'Describe this goal'
    };
    
    state.bigGoals.push(newGoal);
    state.smallGoals[newId] = [];
    
    renderBigGoals();
    
    // Scroll to the new element
    setTimeout(() => {
        const lastGoal = elements.bigGoalsContainer.querySelector('.goal-item:last-of-type');
        if (lastGoal) {
            lastGoal.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

function addNewSmallGoal(bigGoalId) {
    if (!state.smallGoals[bigGoalId]) {
        state.smallGoals[bigGoalId] = [];
    }
    
    const newId = state.smallGoals[bigGoalId].length > 0 
        ? Math.max(...state.smallGoals[bigGoalId].map(g => g.id)) + 1 
        : 101;
    
    const newGoal = {
        id: newId,
        title: 'New Small Goal',
        description: 'Describe this small goal'
    };
    
    state.smallGoals[bigGoalId].push(newGoal);
    
    renderSmallGoals();
    
    // Scroll to the new element
    setTimeout(() => {
        const sections = elements.smallGoalsContainer.querySelectorAll('.big-goal-section');
        sections.forEach(section => {
            if (section.dataset.id == bigGoalId) {
                const lastGoal = section.querySelector('.goal-item:last-of-type');
                if (lastGoal) {
                    lastGoal.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }, 100);
}

function resetApplication() {
    // Reset state
    state.prompt = '';
    state.bigGoals = [];
    state.smallGoals = {};
    state.repository = null;
    state.issues = [];
    
    // Reset form inputs
    elements.promptInput.value = '';
    elements.repoNameInput.value = '';
    elements.repoDescriptionInput.value = '';
    
    // Go back to first step
    goToStep(1);
}

// Event listeners
function setupEventListeners() {
    // Update button texts with icons
    elements.analyzeBtn.innerHTML = '<i class="material-icons">auto_awesome</i> Analyze & Create Goals';
    elements.backToPromptBtn.innerHTML = '<i class="material-icons">arrow_back</i> Back';
    elements.proceedToSmallGoalsBtn.innerHTML = 'Break Down Into Small Goals <i class="material-icons">arrow_forward</i>';
    elements.backToBigGoalsBtn.innerHTML = '<i class="material-icons">arrow_back</i> Back';
    elements.proceedToRepoBtn.innerHTML = 'Create Repository <i class="material-icons">arrow_forward</i>';
    elements.backToSmallGoalsBtn.innerHTML = '<i class="material-icons">arrow_back</i> Back';
    elements.createRepoBtn.innerHTML = '<i class="material-icons">add_circle</i> Create Repository';
    elements.backToRepoBtn.innerHTML = '<i class="material-icons">arrow_back</i> Back';
    elements.createIssuesBtn.innerHTML = '<i class="material-icons">assignment_turned_in</i> Create Issues';
    elements.startOverBtn.innerHTML = '<i class="material-icons">refresh</i> Start New Project';

    // Navigation between steps
    elements.analyzeBtn.addEventListener('click', analyzePrompt);
    elements.backToPromptBtn.addEventListener('click', () => goToStep(1));
    elements.proceedToSmallGoalsBtn.addEventListener('click', breakDownGoals);
    elements.backToBigGoalsBtn.addEventListener('click', () => goToStep(2));
    elements.proceedToRepoBtn.addEventListener('click', () => goToStep(4));
    elements.backToSmallGoalsBtn.addEventListener('click', () => goToStep(3));
    elements.createRepoBtn.addEventListener('click', createRepository);
    elements.backToRepoBtn.addEventListener('click', () => goToStep(4));
    elements.createIssuesBtn.addEventListener('click', createIssues);
    elements.startOverBtn.addEventListener('click', resetApplication);
    
    // Step indicator navigation
    elements.steps.forEach((step, index) => {
        step.addEventListener('click', () => {
            const targetStep = index + 1;
            if (targetStep < state.activeStep) {
                goToStep(targetStep);
            }
        });
    });
    
    // Notification close
    elements.notificationClose.addEventListener('click', () => {
        elements.notification.classList.add('hidden');
    });
    
    // Add Enter key support for inputs
    elements.promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            analyzePrompt();
        }
    });
    
    elements.repoNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            elements.repoDescriptionInput.focus();
        }
    });
    
    elements.repoDescriptionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            createRepository();
        }
    });
}

function setupScrollProgress() {
    function updateScrollProgress() {
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
        
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.height = scrollPercentage + '%';
        }
    }
    
    window.addEventListener('scroll', updateScrollProgress);
    window.addEventListener('resize', updateScrollProgress);
    
    updateScrollProgress();
}

// Initialize
function init() {
    setupEventListeners();
    setupScrollProgress();
    
    goToStep(1);
    
    // Add some pleasant animations
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-3px)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}

// Start the application
document.addEventListener('DOMContentLoaded', init);

async function generateRepositoryInfo() {
    // Only proceed if we have a prompt and big goals
    if (!state.prompt || state.bigGoals.length === 0) {
        console.log('Cannot generate repository info: missing prompt or goals', {
            prompt: state.prompt,
            bigGoals: state.bigGoals
        });
        return;
    }
    
    // Format goals for API request
    const goals = state.bigGoals.map(goal => goal.title).join('\n');
    
    console.log('Generating repository info with:', {
        prompt: state.prompt,
        goals: goals
    });
    
    // Show loading indicator
    if (elements.repoInfoLoading) {
        elements.repoInfoLoading.classList.remove('hidden');
    }
    
    try {
        const result = await fetchAPI('generate-repo-info', 'POST', {
            prompt: state.prompt,
            goals: goals
        });
        
        console.log('Received repository info:', result);
        
        // Auto-populate repository fields
        elements.repoNameInput.value = result.repo_name || '';
        elements.repoDescriptionInput.value = result.description || '';
        
        console.log('Updated repository fields:', {
            name: elements.repoNameInput.value,
            description: elements.repoDescriptionInput.value
        });
    } catch (error) {
        // Error is already handled in fetchAPI
        console.warn('Failed to generate repository info:', error);
    } finally {
        // Hide loading indicator
        if (elements.repoInfoLoading) {
            elements.repoInfoLoading.classList.add('hidden');
        }
    }
} 