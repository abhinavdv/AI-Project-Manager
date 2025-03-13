// GitHub Manager Application

// State management
const state = {
    prompt: '',
    bigGoals: [],
    smallGoals: {},
    repository: null,
    issues: [],
    activeStep: 1,
    loading: false,
    // Track completion status of each step
    stepsCompleted: {
        1: false, // Voice Input
        2: false, // Instructions
        3: false, // High-Level Tasks
        4: false, // Sub-Tasks
        5: false, // Repository
        6: false  // Issues
    },
    // Save input state for each step
    savedInputs: {
        1: '', // Voice recording/transcription
        2: '', // Prompt text
        3: [], // High-level tasks
        4: {}, // Sub-tasks
        5: { name: '', description: '' } // Repository info
    },
    mediaRecorder: null,
    audioChunks: [],
    transcription: '',
};

// DOM Elements
const elements = {
    steps: document.querySelectorAll('.step'),
    stepContents: document.querySelectorAll('.step-content'),
    stepIndicator: document.getElementById('step-indicator'),
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingMessage: document.getElementById('loading-message'),
    loadingProgressBar: document.getElementById('loading-progress-bar'),
    loadingPercentage: document.getElementById('loading-percentage'),
    notification: document.getElementById('notification'),
    notificationMessage: document.getElementById('notification-message'),
    notificationClose: document.getElementById('notification-close'),
    
    // Graph
    graphToggle: document.getElementById('toggle-graph'),
    graphPopup: document.getElementById('graph-popup'),
    closeGraph: document.getElementById('close-graph'),
    graphContent: document.querySelector('.graph-content'),
    projectTree: document.querySelector('.project-tree'),
    treeRoot: document.querySelector('.tree-root'),
    treeViewToggle: document.getElementById('tree-view-toggle'),
    graphViewToggle: document.getElementById('graph-view-toggle'),
    
    // Step 1: Voice Input
    startRecordingBtn: document.getElementById('start-recording'),
    stopRecordingBtn: document.getElementById('stop-recording'),
    recordingIndicator: document.getElementById('recording-indicator'),
    audioPreview: document.getElementById('audio-preview'),
    audioPlayer: document.getElementById('audio-player'),
    transcriptionContainer: document.querySelector('.transcription-container'),
    transcriptionText: document.getElementById('transcription-text'),
    redoRecordingBtn: document.getElementById('redo-recording'),
    useTranscriptionBtn: document.getElementById('use-transcription'),
    skipToInstructionsBtn: document.getElementById('skip-to-instructions'),
    
    // Step 2: Instructions
    promptInput: document.getElementById('prompt-input'),
    analyzeBtn: document.getElementById('analyze-btn'),
    backToVoiceBtn: document.getElementById('back-to-voice-btn'),
    
    // Step 3: Big Goals
    bigGoalsContainer: document.getElementById('big-goals-container'),
    backToPromptBtn: document.getElementById('back-to-prompt-btn'),
    proceedToSmallGoalsBtn: document.getElementById('proceed-to-small-goals-btn'),
    
    // Step 4: Small Goals
    smallGoalsContainer: document.getElementById('small-goals-container'),
    backToBigGoalsBtn: document.getElementById('back-to-big-goals-btn'),
    proceedToRepoBtn: document.getElementById('proceed-to-repo-btn'),
    
    // Step 5: Repository
    repoNameInput: document.getElementById('repo-name'),
    repoDescriptionInput: document.getElementById('repo-description'),
    repoInfoLoading: document.getElementById('repo-info-loading'),
    backToSmallGoalsBtn: document.getElementById('back-to-small-goals-btn'),
    createRepoBtn: document.getElementById('create-repo-btn'),
    
    // Step 6: Issues
    issuesPreviewContainer: document.getElementById('issues-preview-container'),
    backToRepoBtn: document.getElementById('back-to-repo-btn'),
    createIssuesBtn: document.getElementById('create-issues-btn'),
    
    // Results
    resultsContainer: document.getElementById('results-container'),
    startOverBtn: document.getElementById('start-over-btn'),
    
    // Templates
    goalTemplate: document.getElementById('goal-template'),
};

// Debug log to check initialization of key elements
console.log('DOM Elements initialization check:');
console.log('- repoNameInput:', elements.repoNameInput);
console.log('- repoDescriptionInput:', elements.repoDescriptionInput);
console.log('- repoInfoLoading:', elements.repoInfoLoading);
console.log('- promptInput:', elements.promptInput);
console.log('- bigGoalsContainer:', elements.bigGoalsContainer);

// Utility functions
function showLoading(message = 'Processing...', initialPercentage = 0) {
    state.loading = true;
    elements.loadingMessage.textContent = message;
    updateLoadingPercentage(initialPercentage);
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    state.loading = false;
    elements.loadingOverlay.classList.add('hidden');
    // Reset progress for next time
    updateLoadingPercentage(0);
}

function updateLoadingPercentage(percentage) {
    // Ensure percentage is between 0 and 100
    percentage = Math.max(0, Math.min(100, percentage));
    
    // Update the progress bar and text
    elements.loadingProgressBar.style.width = percentage + '%';
    elements.loadingPercentage.textContent = Math.round(percentage) + '%';
}

// Function to simulate loading progress between steps
function simulateStepTransition(fromStep, toStep, callback, duration = 1000) {
    const message = `Moving from ${getStepName(fromStep)} to ${getStepName(toStep)}...`;
    showLoading(message, 0);
    
    let progress = 0;
    const interval = 30; // Update every 30ms
    const increment = 100 * interval / duration;
    
    const timer = setInterval(() => {
        progress += increment;
        updateLoadingPercentage(progress);
        
        if (progress >= 100) {
            clearInterval(timer);
            setTimeout(() => {
                hideLoading();
                if (callback) callback();
            }, 200); // Small delay at 100% for visual confirmation
        }
    }, interval);
}

// Get step name for loading message
function getStepName(stepNumber) {
    const stepNames = {
        1: 'Voice Input',
        2: 'Instructions',
        3: 'High-Level Tasks',
        4: 'Sub-Tasks',
        5: 'Repository',
        6: 'Issues'
    };
    return stepNames[stepNumber] || `Step ${stepNumber}`;
}

// Show notification with auto-hide
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
            // Get the element's position relative to the viewport
            const rect = activeStep.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Calculate position to scroll to (centered in viewport)
            const targetY = rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);
            
            // Smooth scroll to target
            window.scrollTo({
                top: targetY,
                behavior: 'smooth'
            });
            
            // Highlight the active step in the navigation
            highlightActiveStepIndicator();
        }
    }, 100);
}

function highlightActiveStepIndicator() {
    // Find the active step content
    const activeStepContent = document.querySelector('.step-content.active');
    if (!activeStepContent) return;
    
    // Get the step number from the ID (e.g., "step-2" -> 2)
    const stepId = activeStepContent.id;
    const stepNumber = parseInt(stepId.split('-')[1]);
    
    // Highlight the corresponding step in the navigation
    const stepIndicators = document.querySelectorAll('.step');
    stepIndicators.forEach((step, index) => {
        step.classList.remove('active');
        if (index + 1 === stepNumber) {
            step.classList.add('active');
        }
    });
}

// Add a scroll event listener to highlight steps based on scroll position
function setupScrollHighlighting() {
    window.addEventListener('scroll', function() {
        const stepContents = document.querySelectorAll('.step-content');
        const viewportHeight = window.innerHeight;
        const scrollPosition = window.scrollY;
        
        // Find which step is most visible in the viewport
        let maxVisibleArea = 0;
        let mostVisibleStepNumber = state.activeStep;
        
        stepContents.forEach((content, index) => {
            const rect = content.getBoundingClientRect();
            
            // Calculate how much of the element is visible
            const visibleTop = Math.max(0, rect.top);
            const visibleBottom = Math.min(viewportHeight, rect.bottom);
            const visibleArea = visibleBottom > visibleTop ? visibleBottom - visibleTop : 0;
            
            if (visibleArea > maxVisibleArea) {
                maxVisibleArea = visibleArea;
                mostVisibleStepNumber = index + 1;
            }
        });
        
        // Update the active step if it's different
        if (mostVisibleStepNumber !== state.activeStep) {
            updateActiveStep(mostVisibleStepNumber);
        }
    }, { passive: true });
}

function updateActiveStep(stepNumber) {
    // Update state
    state.activeStep = stepNumber;
    
    // Update step indicators
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) === stepNumber) {
            step.classList.add('active');
        }
    });

    // Update content sections with transition
    document.querySelectorAll('.step-content').forEach(section => {
        section.classList.remove('active');
        section.style.opacity = '0';
    });

    // Show active section with transition
    const activeSection = document.getElementById(`step-${stepNumber}`);
    if (activeSection) {
        setTimeout(() => {
            activeSection.classList.add('active');
            activeSection.style.opacity = '1';
            activeSection.classList.add('highlight-transition');
            setTimeout(() => {
                activeSection.classList.remove('highlight-transition');
            }, 1000);
        }, 100);
    }

    // Update URL hash
    window.location.hash = `#step${stepNumber}`;

    // Scroll to active section
    scrollToActiveStep(stepNumber);
}

function goToStep(stepNumber) {
    if (stepNumber === state.activeStep) return;
    
    console.log(`Navigating from step ${state.activeStep} to step ${stepNumber}`);
    
    // Save inputs from current step
    saveStepInputs(state.activeStep);
    
    // Show loading transition between steps
    simulateStepTransition(state.activeStep, stepNumber, () => {
        // Update active step after loading completes
        updateActiveStep(stepNumber);
        
        // Load inputs for the new step
        loadStepInputs(stepNumber);
        
        // Perform step-specific actions
        if (stepNumber === 5) {
            console.log('Checking if repository info needs to be auto-populated');
            console.log(`Saved inputs for step 5: ${JSON.stringify(state.savedInputs[5])}`);
            
            if (!state.savedInputs[5].name || !state.savedInputs[5].description) {
                console.log('No saved repo info found, calling generateRepositoryInfo()');
                // Auto-populate repository info when reaching Step 5 if not already populated
                generateRepositoryInfo();
            } else {
                console.log('Repository info already exists, skipping auto-population');
            }
        }
        
        // Scroll to the active step
        scrollToActiveStep();
    });
}

// API functions
async function fetchAPI(endpoint, method = 'GET', data = null) {
    // Start with 30% progress to indicate the request is being sent
    let currentProgress = 30;
    const progressInterval = setInterval(() => {
        // Simulate gradual progress during waiting for API response
        // but never reach 100% until complete
        if (currentProgress < 80) {
            currentProgress += 1;
            updateLoadingPercentage(currentProgress);
        }
    }, 150);
    
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
        
        // Got response - move to 85%
        clearInterval(progressInterval);
        updateLoadingPercentage(85);
        
        const result = await response.json();
        
        // Parsing complete - move to 95%
        updateLoadingPercentage(95);
        
        if (!response.ok) {
            throw new Error(result.error || 'Something went wrong');
        }
        
        // Success - move to 100%
        updateLoadingPercentage(100);
        
        return result;
    } catch (error) {
        clearInterval(progressInterval);
        console.error('API Error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// Element creation/rendering functions
function createGoalElement(goal, isSmall = false) {
    const template = elements.goalTemplate.content.cloneNode(true);
    const goalElement = template.querySelector('.goal-item');
    
    goalElement.dataset.goalId = goal.id;
    
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
        updateGraph();
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
        updateGraph();
    });
    
    const deleteBtn = goalElement.querySelector('.delete-goal');
    deleteBtn.addEventListener('click', () => {
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
            updateGraph();
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

function createSmallGoalElement(goal, index) {
    return createGoalElement(goal, true);
}

function createBigGoalSection(goal) {
    const section = document.createElement('div');
    section.className = 'big-goal-section';
    section.dataset.id = goal.id;
    
    const header = document.createElement('h3');
    header.innerHTML = `<i class="material-icons">assignment</i> High-Level Task: ${goal.title}`;
    
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
    addButton.innerHTML = '<i class="material-icons">add</i> Add High-Level Task';
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
        addButton.innerHTML = '<i class="material-icons">add_task</i> Add Sub-Task';
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
    const promptInput = document.getElementById('prompt-input').value.trim();
    if (!promptInput) {
        showNotification('Please enter a project description', 'error');
        return;
    }

    showLoading('Analyzing prompt and generating high-level tasks...', 5);
    
    try {
        // Show initial preparation phase
        const phases = [
            { percentage: 15, message: 'Analyzing project description...' },
            { percentage: 30, message: 'Identifying key requirements...' },
            { percentage: 45, message: 'Generating high-level tasks...' }
        ];
        
        // Simulate phase progress
        for (const phase of phases) {
            await new Promise(resolve => {
                setTimeout(() => {
                    elements.loadingMessage.textContent = phase.message;
                    updateLoadingPercentage(phase.percentage);
                    resolve();
                }, 500);
            });
        }
        
        // Now make the actual API call
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptInput })
        });

        elements.loadingMessage.textContent = 'Processing task data...';
        updateLoadingPercentage(75);

        if (!response.ok) throw new Error('Failed to analyze prompt');
        
        const data = await response.json();
        updateLoadingPercentage(85);
        elements.loadingMessage.textContent = 'Finalizing task organization...';
        
        if (!data.big_goals || data.big_goals.length === 0) {
            hideLoading();
            showNotification('No goals were generated. Please try again with a more detailed description.', 'error');
            return;
        }

        // Update big goals container
        const container = document.getElementById('big-goals-container');
        container.innerHTML = ''; // Clear existing goals
        
        updateLoadingPercentage(90);
        
        data.big_goals.forEach((goal, index) => {
            container.appendChild(createGoalElement(goal, index + 1));
        });

        // Save step data and update state
        state.bigGoals = data.big_goals;
        saveStepInputs(3, { goals: data.big_goals });
        
        elements.loadingMessage.textContent = 'Tasks created successfully!';
        updateLoadingPercentage(100);
        
        // Hide loading and transition to next step
        setTimeout(() => {
            hideLoading();
            updateActiveStep(3);
            showNotification('Tasks generated successfully!', 'success');
        }, 500);
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showNotification('Failed to analyze prompt. Please try again.', 'error');
    }
}

async function breakDownGoals() {
    showLoading('Preparing to break down tasks...', 5);
    
    try {
        const bigGoals = Array.from(document.querySelectorAll('.goal-item'))
            .map(el => ({
                id: parseInt(el.dataset.goalId),
                title: el.querySelector('.goal-title').value,
                description: el.querySelector('.goal-description').value
            }));
            
        if (bigGoals.length === 0) {
            hideLoading();
            showNotification('No high-level tasks found to break down', 'error');
            return;
        }

        elements.loadingMessage.textContent = 'Analyzing high-level tasks...';
        updateLoadingPercentage(15);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Process each big goal sequentially with progress updates
        const totalGoals = bigGoals.length;
        const baseProgressPerGoal = 70 / totalGoals; // 70% of the progress bar dedicated to processing goals
        
        for (let i = 0; i < totalGoals; i++) {
            const bigGoal = bigGoals[i];
            const basePercentage = 20 + (i * baseProgressPerGoal);
            
            // Update loading message for each goal
            elements.loadingMessage.textContent = `Breaking down: "${bigGoal.title}"`;
            updateLoadingPercentage(basePercentage);
            
            // Allow UI to update
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const response = await fetch('/api/break-down-goal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    goal_id: bigGoal.id,
                    goal_title: bigGoal.title,
                    goal_description: bigGoal.description
                })
            });

            // Update progress for each goal processed
            updateLoadingPercentage(basePercentage + baseProgressPerGoal * 0.7);

            if (!response.ok) throw new Error('Failed to break down goals');
            
            const data = await response.json();
            if (!data.smaller_goals || data.smaller_goals.length === 0) {
                showNotification(`No sub-tasks were generated for "${bigGoal.title}". Skipping.`, 'warning');
                continue;
            }

            // Initialize the array for this big goal if it doesn't exist
            if (!state.smallGoals[bigGoal.id]) {
                state.smallGoals[bigGoal.id] = [];
            }

            // Add the smaller goals to the state
            state.smallGoals[bigGoal.id] = data.smaller_goals;
            
            updateLoadingPercentage(basePercentage + baseProgressPerGoal);
        }

        elements.loadingMessage.textContent = 'Organizing sub-tasks...';
        updateLoadingPercentage(90);
        
        // Render all small goals after processing
        renderSmallGoals();

        // Save step data and update state
        saveStepInputs(4, { small_goals: state.smallGoals });
        
        elements.loadingMessage.textContent = 'Sub-tasks created successfully!';
        updateLoadingPercentage(100);
        
        // Hide loading with a slight delay for visual feedback
        setTimeout(() => {
            hideLoading();
            updateActiveStep(4);
            showNotification('Tasks broken down successfully!', 'success');
        }, 500);
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showNotification('Failed to break down tasks. Please try again.', 'error');
    }
}

async function createRepository() {
    const repoName = elements.repoNameInput.value.trim();
    const repoDescription = elements.repoDescriptionInput.value.trim();
    
    if (!repoName) {
        showNotification('Repository name is required', 'warning');
        return;
    }
    
    // Save repo info to state
    state.savedInputs[5] = {
        name: repoName,
        description: repoDescription
    };
    saveStateToLocalStorage();
    
    try {
        showLoading('Creating GitHub repository...', 10);
        
        // Simulate preparing repository creation
        updateLoadingPercentage(30);
        
        const result = await fetchAPI('create-repository', 'POST', {
            repo_name: repoName,
            repo_description: repoDescription
        });
        
        updateLoadingPercentage(80);
        
        state.repository = result.repository;
        updateStepCompletion(5, true);
        saveStateToLocalStorage();
        
        renderIssuesPreview();
        updateLoadingPercentage(100);
        
        // Hide loading with a small delay for visual feedback
        setTimeout(() => {
            hideLoading();
            goToStep(6);
            showNotification('Repository created successfully!', 'success');
        }, 200);
    } catch (error) {
        // Error is already handled in fetchAPI
        hideLoading();
    }
}

async function createIssues() {
    if (!state.repository) {
        showNotification('Repository not created yet', 'warning');
        return;
    }
    
    try {
        showLoading('Creating GitHub issues...', 10);
        
        let allSmallGoals = [];
        
        // Collect all small goals
        state.bigGoals.forEach(bigGoal => {
            const smallGoals = state.smallGoals[bigGoal.id] || [];
            allSmallGoals = allSmallGoals.concat(smallGoals);
        });
        
        updateLoadingPercentage(20);
        
        // If we have many goals, simulate incremental progress
        if (allSmallGoals.length > 5) {
            updateLoadingPercentage(30);
            await new Promise(resolve => setTimeout(resolve, 300));
            updateLoadingPercentage(40);
        }
        
        const result = await fetchAPI('create-issues', 'POST', {
            repo_name: state.repository.name,
            goals: allSmallGoals
        });
        
        updateLoadingPercentage(80);
        
        state.issues = result.issues;
        updateStepCompletion(6, true);
        saveStateToLocalStorage();
        
        renderResults();
        updateLoadingPercentage(100);
        
        // Hide loading with a small delay for visual feedback
        setTimeout(() => {
            hideLoading();
            goToStep(7); // Move to results view
            showNotification('Issues created successfully!', 'success');
        }, 200);
    } catch (error) {
        // Error is already handled in fetchAPI
        hideLoading();
    }
}

function addNewBigGoal() {
    const newId = state.bigGoals.length > 0 
        ? Math.max(...state.bigGoals.map(g => g.id)) + 1 
        : 1;
    
    const newGoal = {
        id: newId,
        title: 'New High-Level Task',
        description: 'Describe this task'
    };
    
    state.bigGoals.push(newGoal);
    state.smallGoals[newId] = [];
    
    renderBigGoals();
    updateGraph();
    
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
        title: 'New Sub-Task',
        description: 'Describe this sub-task'
    };
    
    state.smallGoals[bigGoalId].push(newGoal);
    
    renderSmallGoals();
    updateGraph();
    
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
    // Stop any ongoing recording
    if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
        stopRecording();
    }
    
    // Reset audio-related state
    state.audioChunks = [];
    state.transcription = '';
    elements.audioPreview.classList.add('hidden');
    elements.startRecordingBtn.classList.remove('hidden');
    elements.stopRecordingBtn.classList.add('hidden');
    elements.recordingIndicator.classList.add('hidden');
    elements.transcriptionContainer.classList.add('hidden');
    
    // Reset state
    state.prompt = '';
    state.bigGoals = [];
    state.smallGoals = {};
    state.repository = null;
    state.issues = [];
    state.activeStep = 1;
    state.stepsCompleted = {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false
    };
    state.savedInputs = {
        1: '',
        2: '',
        3: [],
        4: {},
        5: { name: '', description: '' }
    };
    
    // Reset form inputs
    elements.promptInput.value = '';
    elements.repoNameInput.value = '';
    elements.repoDescriptionInput.value = '';
    
    // Clear local storage
    localStorage.removeItem('githubManagerState');
    localStorage.removeItem('sidebarCollapsed');
    
    // Reset UI
    renderBigGoals();
    renderSmallGoals();
    updateGraph();
    updateStepIndicators();
    
    // Go back to first step
    goToStep(1);
    
    // Show notification
    showNotification('Application has been reset', 'success');
}

// Setup event listeners
function setupEventListeners() {
    // Add refresh button listener
    const refreshButton = document.getElementById('refresh-app');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the application? All progress will be lost.')) {
                resetApplication();
            }
        });
    }
    
    // Update button texts with icons
    elements.analyzeBtn.innerHTML = '<i class="material-icons">auto_awesome</i> Analyze & Create Tasks';
    elements.backToPromptBtn.innerHTML = '<i class="material-icons">arrow_back</i> Back';
    elements.proceedToSmallGoalsBtn.innerHTML = 'Break Down Tasks <i class="material-icons">arrow_forward</i>';
    elements.backToBigGoalsBtn.innerHTML = '<i class="material-icons">arrow_back</i> Back';
    elements.proceedToRepoBtn.innerHTML = 'Create Repository <i class="material-icons">arrow_forward</i>';
    elements.backToSmallGoalsBtn.innerHTML = '<i class="material-icons">arrow_back</i> Back';
    elements.createRepoBtn.innerHTML = '<i class="material-icons">add_circle</i> Create Repository';
    elements.backToRepoBtn.innerHTML = '<i class="material-icons">arrow_back</i> Back';
    elements.createIssuesBtn.innerHTML = '<i class="material-icons">assignment_turned_in</i> Create Issues';
    elements.startOverBtn.innerHTML = '<i class="material-icons">refresh</i> Start New Project';

    // Voice input and instructions navigation
    const skipToInstructionsBtn = document.getElementById('skip-to-instructions');
    if (skipToInstructionsBtn) {
        skipToInstructionsBtn.addEventListener('click', () => {
            // Mark step 1 as completed even if skipped
            updateStepCompletion(1, true);
            goToStep(2);
        });
    }
    
    const backToVoiceBtn = document.getElementById('back-to-voice-btn');
    if (backToVoiceBtn) {
        backToVoiceBtn.addEventListener('click', () => goToStep(1));
    }

    // Navigation between steps
    elements.analyzeBtn.addEventListener('click', analyzePrompt);
    elements.backToPromptBtn.addEventListener('click', () => goToStep(2));
    elements.proceedToSmallGoalsBtn.addEventListener('click', breakDownGoals);
    elements.backToBigGoalsBtn.addEventListener('click', () => goToStep(3));
    elements.proceedToRepoBtn.addEventListener('click', () => goToStep(5));
    elements.backToSmallGoalsBtn.addEventListener('click', () => goToStep(4));
    elements.createRepoBtn.addEventListener('click', createRepository);
    elements.backToRepoBtn.addEventListener('click', () => goToStep(5));
    elements.createIssuesBtn.addEventListener('click', createIssues);
    elements.startOverBtn.addEventListener('click', resetApplication);
    
    // Step indicator navigation - allow clicking on any step with data
    elements.steps.forEach((step, index) => {
        step.addEventListener('click', () => {
            const targetStep = index + 1;
            
            // Allow navigation if the step is already completed, has data, or is a previous step
            if (state.stepsCompleted[targetStep] || hasDataForStep(targetStep) || targetStep < state.activeStep) {
                goToStep(targetStep);
            } else {
                // Animate the step to indicate it's not available yet
                step.classList.add('unavailable');
                setTimeout(() => {
                    step.classList.remove('unavailable');
                }, 800);
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

    // Add audio recording listeners
    elements.startRecordingBtn.addEventListener('click', startRecording);
    elements.stopRecordingBtn.addEventListener('click', stopRecording);
    elements.redoRecordingBtn.addEventListener('click', redoRecording);
    elements.useTranscriptionBtn.addEventListener('click', useTranscription);
}

function setupScrollProgress() {
    function updateScrollProgress() {
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
        
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            // For mobile (horizontal scrollbar) we use width instead of height
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                progressBar.style.setProperty('--scroll-percent', scrollPercentage + '%');
            } else {
                progressBar.style.setProperty('--scroll-percent', scrollPercentage + '%');
            }
        }
    }
    
    window.addEventListener('scroll', updateScrollProgress);
    window.addEventListener('resize', updateScrollProgress);
    
    // Initial update
    updateScrollProgress();
}

// Graph functionality
function setupGraph() {
    elements.graphToggle.addEventListener('click', toggleGraph);
    elements.closeGraph.addEventListener('click', toggleGraph);
    
    // Setup view toggles
    elements.treeViewToggle.addEventListener('click', () => switchView('tree'));
    elements.graphViewToggle.addEventListener('click', () => switchView('graph'));
    
    // Update graph/tree when steps change
    document.addEventListener('stepComplete', updateProgress);
    document.addEventListener('dataChange', updateProgress);
}

function toggleGraph() {
    elements.graphPopup.classList.toggle('hidden');
    if (!elements.graphPopup.classList.contains('hidden')) {
        updateProgress();
    }
}

function switchView(viewType) {
    if (viewType === 'tree') {
        elements.graphContent.classList.add('hidden');
        elements.projectTree.classList.remove('hidden');
        elements.treeViewToggle.classList.add('active');
        elements.graphViewToggle.classList.remove('active');
    } else {
        elements.graphContent.classList.remove('hidden');
        elements.projectTree.classList.add('hidden');
        elements.treeViewToggle.classList.remove('active');
        elements.graphViewToggle.classList.add('active');
    }
    updateProgress();
}

function updateProgress() {
    // Update both graph and tree views
    updateGraph();
    updateTree();
}

function updateGraph() {
    const graphContent = elements.graphContent;
    graphContent.innerHTML = ''; // Clear existing content
    
    // Voice Input node
    if (state.transcription) {
        const voiceNode = createGraphNode('1. Voice Input', state.transcription, 'voice');
        graphContent.appendChild(voiceNode);
    }
    
    // Instructions node
    if (state.prompt) {
        const instructionsNode = createGraphNode('2. Instructions', state.prompt, 'instructions');
        graphContent.appendChild(instructionsNode);
    }
    
    // High-level tasks node
    if (state.bigGoals && state.bigGoals.length > 0) {
        const tasksNode = createGraphNode('3. High-Level Tasks', '', 'big-goal');
        graphContent.appendChild(tasksNode);
        
        // Add high-level tasks as child nodes
        state.bigGoals.forEach((goal, index) => {
            const taskNode = createGraphNode(goal.title, goal.description, 'task');
            graphContent.appendChild(taskNode);
        });
    }
    
    // Broken down tasks node
    if (state.smallGoals && Object.keys(state.smallGoals).length > 0) {
        const subTasksNode = createGraphNode('4. Sub-Tasks', '', 'big-goal');
        graphContent.appendChild(subTasksNode);
        
        // Add sub-tasks as child nodes
        Object.values(state.smallGoals).forEach(goalGroup => {
            goalGroup.forEach(task => {
                const subTaskNode = createGraphNode(task.title, task.description, 'small-goal');
                graphContent.appendChild(subTaskNode);
            });
        });
    }
}

function updateTree() {
    const treeRoot = elements.treeRoot;
    treeRoot.innerHTML = ''; // Clear existing content
    
    // Create the project root node
    const projectNode = createTreeNode('GitHub Project', 'Project overview and progress', 'project');
    treeRoot.appendChild(projectNode);
    
    // Create the children container for project node
    const projectChildren = document.createElement('div');
    projectChildren.className = 'tree-children';
    projectNode.appendChild(projectChildren);
    
    // Voice Input node (Level 1)
    if (state.transcription) {
        const voiceNode = createTreeNode('1. Voice Input', state.transcription, 'voice');
        projectChildren.appendChild(voiceNode);
    }
    
    // Instructions node (Level 1)
    if (state.prompt) {
        const instructionsNode = createTreeNode('2. Instructions', state.prompt, 'instructions');
        projectChildren.appendChild(instructionsNode);
    }
    
    // High-level tasks node (Level 1)
    if (state.bigGoals && state.bigGoals.length > 0) {
        const tasksNode = createTreeNode('3. High-Level Tasks', 'Overview of main project tasks', 'big-goal');
        projectChildren.appendChild(tasksNode);
        
        // Create children container for high-level tasks
        const tasksChildren = document.createElement('div');
        tasksChildren.className = 'tree-children';
        tasksNode.appendChild(tasksChildren);
        
        // Add high-level tasks as child nodes (Level 2)
        state.bigGoals.forEach((goal, index) => {
            const taskNode = createTreeNode(goal.title, goal.description, 'task');
            tasksChildren.appendChild(taskNode);
            
            // If this goal has small goals, add them as children
            if (state.smallGoals && state.smallGoals[goal.id] && state.smallGoals[goal.id].length > 0) {
                // Create children container for this task
                const taskChildren = document.createElement('div');
                taskChildren.className = 'tree-children';
                taskNode.appendChild(taskChildren);
                
                // Add small goals as child nodes (Level 3)
                state.smallGoals[goal.id].forEach(smallGoal => {
                    const smallGoalNode = createTreeNode(smallGoal.title, smallGoal.description, 'small-goal');
                    smallGoalNode.classList.add('leaf'); // These are leaf nodes
                    taskChildren.appendChild(smallGoalNode);
                });
            } else {
                taskNode.classList.add('leaf'); // Mark as leaf if no children
            }
        });
    }
    
    // Add repository node if created
    if (state.repository) {
        const repoNode = createTreeNode('5. Repository', `Repository: ${state.repository.name}`, 'repository');
        projectChildren.appendChild(repoNode);
        
        // Add issues as children if created
        if (state.issues && state.issues.length > 0) {
            const repoChildren = document.createElement('div');
            repoChildren.className = 'tree-children';
            repoNode.appendChild(repoChildren);
            
            const issuesNode = createTreeNode('6. Issues', `${state.issues.length} issues created`, 'issues');
            repoChildren.appendChild(issuesNode);
            
            // Create children container for issues
            const issuesChildren = document.createElement('div');
            issuesChildren.className = 'tree-children';
            issuesNode.appendChild(issuesChildren);
            
            // Add issues as leaf nodes
            state.issues.forEach(issue => {
                const issueNode = createTreeNode(issue.title, issue.body || 'No description', 'issue');
                issueNode.classList.add('leaf');
                issuesChildren.appendChild(issueNode);
            });
        } else {
            repoNode.classList.add('leaf');
        }
    }
    
    // Add expander functionality for tree nodes
    addTreeExpanderFunctionality();
}

function createTreeNode(title, description, type) {
    const node = document.createElement('div');
    node.className = `tree-node ${type}`;
    
    const nodeContent = document.createElement('div');
    nodeContent.className = `tree-node-content ${type}`;
    nodeContent.innerHTML = `
        <div class="node-title">${title}</div>
        ${description ? `<div class="node-description">${description}</div>` : ''}
    `;
    
    // Add expandable indicator if not a leaf node
    if (!node.classList.contains('leaf')) {
        const expander = document.createElement('div');
        expander.className = 'tree-expander';
        expander.innerHTML = '<i class="material-icons">expand_more</i>';
        nodeContent.appendChild(expander);
    }
    
    node.appendChild(nodeContent);
    
    // Add click handler to navigate to the corresponding step
    nodeContent.addEventListener('click', (e) => {
        if (e.target.closest('.tree-expander')) {
            return; // Don't navigate if clicking on expander
        }
        
        let stepNumber;
        switch (type) {
            case 'voice':
                stepNumber = 1;
                break;
            case 'instructions':
                stepNumber = 2;
                break;
            case 'big-goal':
            case 'task':
                stepNumber = 3;
                break;
            case 'small-goal':
                stepNumber = 4;
                break;
            case 'repository':
                stepNumber = 5;
                break;
            case 'issues':
            case 'issue':
                stepNumber = 6;
                break;
        }
        
        if (stepNumber) {
            goToStep(stepNumber);
            toggleGraph(); // Close the graph
        }
    });
    
    return node;
}

function addTreeExpanderFunctionality() {
    document.querySelectorAll('.tree-expander').forEach(expander => {
        expander.addEventListener('click', (e) => {
            const treeNode = e.target.closest('.tree-node');
            treeNode.classList.toggle('collapsed');
            e.stopPropagation(); // Prevent navigation
        });
    });
}

function createGraphNode(title, description, type) {
    const node = document.createElement('div');
    node.className = `graph-node ${type}`;
    node.innerHTML = `
        <div class="node-title">${title}</div>
        ${description ? `<div class="node-description">${description}</div>` : ''}
    `;
    
    // Add click handler to navigate to the corresponding step
    node.addEventListener('click', () => {
        let stepNumber;
        switch (type) {
            case 'voice':
                stepNumber = 1;
                break;
            case 'instructions':
                stepNumber = 2;
                break;
            case 'big-goal':
            case 'task':
                stepNumber = 3;
                break;
            case 'small-goal':
                stepNumber = 4;
                break;
        }
        
        if (stepNumber) {
            goToStep(stepNumber);
            toggleGraph(); // Close the graph
        }
    });
    
    return node;
}

// Initialize
function init() {
    setupEventListeners();
    setupScrollProgress();
    setupSidebar();
    setupGraph();
    
    // Show tree view by default
    switchView('tree');
    
    // Load saved state from localStorage
    loadStateFromLocalStorage();
    
    // If no saved state, start at step 1
    if (!hasDataForStep(1)) {
        goToStep(1);
    } else {
        // Find the furthest step with data
        let furthestStep = 1;
        for (let i = 6; i >= 1; i--) {
            if (state.stepsCompleted[i] || hasDataForStep(i)) {
                furthestStep = i;
                break;
            }
        }
        goToStep(furthestStep);
    }
    
    // Add some pleasant animations
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-3px)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
    
    // Update completion indicators
    updateStepIndicators();
}

// Set up sidebar toggle functionality
function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const appContent = document.querySelector('.app-content');
    
    // Check if sidebar state is saved in localStorage
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        appContent.classList.add('expanded');
    }
    
    // Add toggle event
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        appContent.classList.toggle('expanded');
        
        // Save state to localStorage
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });
}

// Initialize the app when the DOM is loaded
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
        console.log('Showing repo info loading indicator');
    }
    
    try {
        console.log('About to call API endpoint: generate-repo-info');
        
        const result = await fetchAPI('generate-repo-info', 'POST', {
            prompt: state.prompt,
            goals: goals
        });
        
        console.log('Received repository info:', result);
        console.log('Result type:', typeof result);
        console.log('Result keys:', Object.keys(result));
        
        // Auto-populate repository fields
        console.log('About to set input values with repo_name:', result.repo_name);
        console.log('About to set input values with description:', result.description);
        
        elements.repoNameInput.value = result.repo_name || '';
        elements.repoDescriptionInput.value = result.description || '';
        
        console.log('Updated repository fields:', {
            name: elements.repoNameInput.value,
            description: elements.repoDescriptionInput.value
        });
        
        // Check if the DOM elements exist and if values were set correctly
        console.log('DOM element repoNameInput exists:', !!elements.repoNameInput);
        console.log('DOM element repoDescriptionInput exists:', !!elements.repoDescriptionInput);
        console.log('Current value of repoNameInput:', elements.repoNameInput.value);
        console.log('Current value of repoDescriptionInput:', elements.repoDescriptionInput.value);
    } catch (error) {
        // Error is already handled in fetchAPI
        console.warn('Failed to generate repository info:', error);
    } finally {
        // Hide loading indicator
        if (elements.repoInfoLoading) {
            elements.repoInfoLoading.classList.add('hidden');
            console.log('Hiding repo info loading indicator');
        }
    }
}

// Update step completion status
function updateStepCompletion(stepNum, isCompleted = true) {
    state.stepsCompleted[stepNum] = isCompleted;
    
    // Update UI to reflect completion status
    updateStepIndicators();
    
    // Save to local storage for persistence
    saveStateToLocalStorage();
}

// Update step indicators based on completion status
function updateStepIndicators() {
    elements.steps.forEach((step, index) => {
        const stepNum = index + 1;
        const isCompleted = state.stepsCompleted[stepNum];
        
        step.classList.remove('active', 'completed');
        
        if (stepNum === state.activeStep) {
            step.classList.add('active');
        } else if (isCompleted) {
            step.classList.add('completed');
        }
        
        // Add a visual cue for steps with data but not completed
        if (!isCompleted && hasDataForStep(stepNum)) {
            step.classList.add('has-data');
        } else {
            step.classList.remove('has-data');
        }
    });
}

// Check if a step has any data entered
function hasDataForStep(stepNum) {
    switch (stepNum) {
        case 1:
            return state.transcription.trim() !== '';
        case 2:
            return state.prompt.trim() !== '';
        case 3:
            return state.bigGoals.length > 0;
        case 4:
            return Object.values(state.smallGoals).some(goals => goals.length > 0);
        case 5:
            return state.savedInputs[5].name.trim() !== '' || state.savedInputs[5].description.trim() !== '';
        case 6:
            return state.issues.length > 0;
        default:
            return false;
    }
}

// Save current step inputs
function saveStepInputs(stepNum, data) {
    switch (stepNum) {
        case 1:
            // Save voice transcription
            state.savedInputs[1] = state.transcription;
            break;
        case 2:
            // Save text instructions
            state.prompt = elements.promptInput.value.trim();
            state.savedInputs[2] = state.prompt;
            break;
        case 3:
            // Save big goals
            if (data && data.goals) {
                state.savedInputs[3] = data.goals;
            } else {
                state.savedInputs[3] = [...state.bigGoals];
            }
            break;
        case 4:
            // Save small goals
            if (data && data.small_goals) {
                state.savedInputs[4] = data.small_goals;
            } else {
                state.savedInputs[4] = { ...state.smallGoals };
            }
            break;
        case 5:
            // Save repo info
            state.savedInputs[5] = {
                name: elements.repoNameInput.value.trim(),
                description: elements.repoDescriptionInput.value.trim()
            };
            break;
    }
    
    // If the step has valid data, mark it as having data
    if (hasDataForStep(stepNum)) {
        updateStepCompletion(stepNum, true);
    }
    
    // Save state to local storage
    saveStateToLocalStorage();
}

// Load saved inputs for a step
function loadStepInputs(stepNum) {
    switch (stepNum) {
        case 1:
            // No need to load anything here as audio is not saved between sessions
            break;
        case 2:
            if (state.savedInputs[2]) {
                elements.promptInput.value = state.savedInputs[2];
            }
            break;
        case 3:
            renderBigGoals();
            break;
        case 4:
            renderSmallGoals();
            break;
        case 5:
            console.log('Loading saved inputs for step 5:', state.savedInputs[5]);
            if (state.savedInputs[5]) {
                if (state.savedInputs[5].name) {
                    console.log('Setting repo name input to:', state.savedInputs[5].name);
                    elements.repoNameInput.value = state.savedInputs[5].name;
                }
                if (state.savedInputs[5].description) {
                    console.log('Setting repo description input to:', state.savedInputs[5].description);
                    elements.repoDescriptionInput.value = state.savedInputs[5].description;
                }
            } else {
                console.log('No saved inputs for step 5 found');
            }
            
            // Force auto-populate if fields are empty
            if (!elements.repoNameInput.value || !elements.repoDescriptionInput.value) {
                console.log('Repository fields are empty, triggering generateRepositoryInfo');
                generateRepositoryInfo();
            }
            break;
        case 6:
            renderIssuesPreview();
            break;
    }
}

// Save state to localStorage
function saveStateToLocalStorage() {
    try {
        const stateToSave = {
            prompt: state.prompt,
            bigGoals: state.bigGoals,
            smallGoals: state.smallGoals,
            repository: state.repository,
            stepsCompleted: state.stepsCompleted,
            savedInputs: state.savedInputs,
            transcription: state.transcription
        };
        
        localStorage.setItem('githubManagerState', JSON.stringify(stateToSave));
    } catch (error) {
        console.error('Error saving state to localStorage:', error);
    }
}

// Load state from localStorage
function loadStateFromLocalStorage() {
    try {
        const savedState = localStorage.getItem('githubManagerState');
        
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            
            // Restore state properties
            state.prompt = parsedState.prompt || '';
            state.bigGoals = parsedState.bigGoals || [];
            state.smallGoals = parsedState.smallGoals || {};
            state.repository = parsedState.repository || null;
            state.stepsCompleted = parsedState.stepsCompleted || { 
                1: false, 2: false, 3: false, 4: false, 5: false, 6: false 
            };
            state.savedInputs = parsedState.savedInputs || { 
                1: '', 2: '', 3: [], 4: {}, 5: { name: '', description: '' } 
            };
            state.transcription = parsedState.transcription || '';
            
            // If we have a transcription, mark step 1 as completed
            if (state.transcription.trim() !== '') {
                state.stepsCompleted[1] = true;
            }
            
            // If we have a prompt, mark step 2 as completed
            if (state.prompt.trim() !== '') {
                state.stepsCompleted[2] = true;
            }
            
            // If we have big goals, mark step 3 as completed
            if (state.bigGoals.length > 0) {
                state.stepsCompleted[3] = true;
            }
            
            // Update UI
            updateStepIndicators();
        }
    } catch (error) {
        console.error('Error loading state from localStorage:', error);
    }
}

// Audio Recording Functions
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.mediaRecorder = new MediaRecorder(stream);
        state.audioChunks = [];

        state.mediaRecorder.addEventListener('dataavailable', event => {
            state.audioChunks.push(event.data);
        });

        state.mediaRecorder.addEventListener('stop', () => {
            const audioBlob = new Blob(state.audioChunks, { type: 'audio/wav' });
            elements.audioPlayer.src = URL.createObjectURL(audioBlob);
            elements.audioPreview.classList.remove('hidden');
            transcribeAudio(audioBlob);
        });

        state.mediaRecorder.start();
        elements.startRecordingBtn.classList.add('hidden');
        elements.stopRecordingBtn.classList.remove('hidden');
        elements.recordingIndicator.classList.remove('hidden');
    } catch (error) {
        showNotification('Microphone access denied. Please allow microphone access and try again.', 'error');
    }
}

function stopRecording() {
    if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
        state.mediaRecorder.stop();
        state.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        elements.stopRecordingBtn.classList.add('hidden');
        elements.recordingIndicator.classList.add('hidden');
    }
}

async function transcribeAudio(audioBlob) {
    try {
        showLoading('Transcribing audio...', 10);
        
        // Create form data with the audio file
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        
        // Indicate progress before sending request
        updateLoadingPercentage(20);
        
        // Send to your backend endpoint that handles Azure Speech-to-Text
        const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
        });
        
        // Got response
        updateLoadingPercentage(70);
        
        if (!response.ok) {
            throw new Error('Transcription failed');
        }
        
        const result = await response.json();
        
        // Processing finished
        updateLoadingPercentage(90);
        
        state.transcription = result.text;
        
        // Save voice input to state
        state.savedInputs[1] = state.transcription;
        updateStepCompletion(1, true);
        
        // Display transcription
        elements.transcriptionText.textContent = state.transcription;
        elements.transcriptionContainer.classList.remove('hidden');
        
        // Completed
        updateLoadingPercentage(100);
        setTimeout(() => {
            hideLoading();
        }, 200);
        
    } catch (error) {
        showNotification('Failed to transcribe audio. Please try again.', 'error');
        hideLoading();
    }
}

function useTranscription() {
    if (state.transcription) {
        // Transfer the transcription to the instructions step
        elements.promptInput.value = state.transcription;
        state.savedInputs[2] = state.transcription;
        updateStepCompletion(2, true);
        
        // Go to instructions step
        goToStep(2);
        showNotification('Transcription added to instructions', 'success');
    }
}

function redoRecording() {
    elements.audioPreview.classList.add('hidden');
    elements.startRecordingBtn.classList.remove('hidden');
    elements.transcriptionContainer.classList.add('hidden');
    state.audioChunks = [];
    state.transcription = '';
    state.savedInputs[1] = '';
} 