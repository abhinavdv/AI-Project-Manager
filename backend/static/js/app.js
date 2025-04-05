// GitHub Manager Application

// Initialize state object
const state = {
    // Core state
    currentStep: 1,
    prompt: '',
    bigGoals: [],
    smallGoals: {},
    repository: null,
    selectedRepository: null,
    issues: [],
    loading: false,
    activeStep: 1,
    
    // Theme
    theme: 'dark', // Default theme
    
    // Mode
    isNewProjectMode: true,
    
    // Step tracking
    stepsCompleted: {
        1: false, // Voice Input
        2: false, // Instructions
        3: false, // Tasks
        4: false  // Repository
    },
    
    // Input state
    savedInputs: {
        1: '', // Voice recording/transcription
        2: '', // Prompt text
        3: { bigGoals: [], smallGoals: {} }, // Combined tasks
        4: { name: '', description: '' } // Repository info
    },
    
    // Voice/audio state
    mediaRecorder: null,
    audioChunks: [],
    transcription: '',
    voiceChat: {
        isActive: false,
        activeTaskId: null,
        mediaRecorder: null,
        audioChunks: [],
        conversation: {} // Map of taskId to conversation history
    },
    taskModification: {
        isActive: false,
        mediaRecorder: null,
        audioChunks: []
    },
    
    // Work allocation state
    workAllocation: {
        developers: [],
        taskAssignments: []
    }
};

// Mode switching functionality
const initModeSwitching = () => {
    const newProjectBtn = document.getElementById('new-project-mode');
    const existingProjectBtn = document.getElementById('existing-project-mode');
    const stepIndicator = document.getElementById('step-indicator');
    const stepsContainer = document.getElementById('steps-container');
    const repoSelector = document.querySelector('.repository-selector');

    newProjectBtn.addEventListener('click', function() {
        state.isNewProjectMode = true;
        this.classList.add('active');
        existingProjectBtn.classList.remove('active');
        
        stepIndicator.classList.remove('hidden');
        stepsContainer.classList.remove('hidden');
        repoSelector.classList.add('hidden');
        
        showStep(1);
    });

    existingProjectBtn.addEventListener('click', function() {
        state.isNewProjectMode = false;
        this.classList.add('active');
        newProjectBtn.classList.remove('active');
        
        // Only hide step indicator, not the steps container
        stepIndicator.classList.add('hidden');
        repoSelector.classList.remove('hidden');
        
        // Hide all steps but don't hide the container
        document.querySelectorAll('.step-content').forEach(step => {
            step.classList.remove('active');
        });
        
        loadRepositories();
    });
};

// Call initModeSwitching after DOM is loaded
document.addEventListener('DOMContentLoaded', initModeSwitching);

// Add theme toggle functionality
function toggleTheme() {
    const isDarkTheme = document.body.classList.contains('light-theme');
    
    if (isDarkTheme) {
        // Switch to dark theme
        document.body.classList.remove('light-theme');
        elements.themeToggle.querySelector('i').textContent = 'dark_mode';
        state.theme = 'dark';
    } else {
        // Switch to light theme
        document.body.classList.add('light-theme');
        elements.themeToggle.querySelector('i').textContent = 'light_mode';
        state.theme = 'light';
    }
    
    saveStateToLocalStorage();
}

function applyStoredTheme() {
    const html = document.documentElement;
    const themeIcon = document.querySelector('#theme-toggle i');
    const storedTheme = localStorage.getItem('theme') || 'dark';
    
    if (storedTheme === 'light') {
        html.classList.remove('dark-mode');
        html.classList.add('light-mode');
        themeIcon.textContent = 'light_mode';
    } else {
        html.classList.remove('light-mode');
        html.classList.add('dark-mode');
        themeIcon.textContent = 'dark_mode';
    }
}

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
    graphToggle: document.getElementById('graph-toggle'),
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
    
    // Step 3: Tasks
    tasksContainer: document.getElementById('tasks-container'),
    backToPromptBtn: document.getElementById('back-to-prompt-btn'),
    proceedToRepoBtn: document.getElementById('proceed-to-repo-btn'),
    
    // Step 4: Repository
    repoNameInput: document.getElementById('repo-name'),
    repoDescriptionInput: document.getElementById('repo-description'),
    repoInfoLoading: document.getElementById('repo-info-loading'),
    createRepoBtn: document.getElementById('create-repo-btn'),
    
    // Results
    resultsContainer: document.getElementById('results-container'),
    startOverBtn: document.getElementById('start-over-btn'),
    
    // Templates
    goalTemplate: document.getElementById('goal-template'),
    themeToggle: document.getElementById('theme-toggle'),
    createIssuesBtn: document.getElementById('create-issues-btn'),
    repoSelector: document.querySelector('.repository-selector'),
    repoSearch: document.getElementById('repo-search'),
    loadReposBtn: document.getElementById('load-repositories'),
    reposList: document.getElementById('repositories-list'),
    newProjectMode: document.getElementById('new-project-mode'),
    existingProjectMode: document.getElementById('existing-project-mode'),
    backToIssuesBtn: document.getElementById('back-to-issues-btn'),
    refreshIssuesBtn: document.getElementById('refresh-issues-btn'),
    createNewIssueBtn: document.getElementById('create-new-issue-btn'),
    issuesContainer: document.getElementById('issues-container'),
    
    // Work allocation
    allocateWorkBtn: document.getElementById('allocate-work-btn'),
    developerModal: document.getElementById('developer-modal'),
    closeModalBtn: document.querySelector('.close-modal'),
    developerCount: document.getElementById('developer-count'),
    developerInputsContainer: document.getElementById('developer-inputs-container'),
    cancelAllocationBtn: document.getElementById('cancel-allocation-btn'),
    allocateTasksBtn: document.getElementById('allocate-tasks-btn'),
    ganttChartContainer: document.getElementById('gantt-chart-container'),
    ganttChart: document.getElementById('gantt-chart'),
};

// Debug log to check initialization of key elements
console.log('DOM Elements initialization check:');
console.log('- repoNameInput:', elements.repoNameInput, document.getElementById('repo-name'));
console.log('- repoNameInput ID:', elements.repoNameInput ? elements.repoNameInput.id : 'not found');
console.log('- repoNameInput exists:', !!document.getElementById('repo-name'));
console.log('- repoDescriptionInput:', elements.repoDescriptionInput);
console.log('- repoInfoLoading:', elements.repoInfoLoading);
console.log('- promptInput:', elements.promptInput);
console.log('- tasksContainer:', elements.tasksContainer);

// Utility functions
function showLoading(message = 'Processing...', initialPercentage = 0) {
    state.loading = true;
    elements.loadingMessage.textContent = message;
    updateLoadingPercentage(initialPercentage);
    elements.loadingOverlay.classList.remove('hidden');
    
    // Add entrance animation classes
    requestAnimationFrame(() => {
        elements.loadingOverlay.style.opacity = '1';
        elements.loadingOverlay.style.visibility = 'visible';
    });
}

function hideLoading() {
    if (!state.loading) return;
    
    // Add exit animation
    elements.loadingOverlay.style.opacity = '0';
    elements.loadingOverlay.style.visibility = 'hidden';
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
        state.loading = false;
        elements.loadingOverlay.classList.add('hidden');
        // Reset progress for next time
        updateLoadingPercentage(0);
    }, 300);
}

function updateLoadingPercentage(targetPercentage) {
    // Ensure percentage is between 0 and 100
    targetPercentage = Math.max(0, Math.min(100, targetPercentage));
    
    // Get current percentage
    const currentPercentage = parseInt(elements.loadingPercentage.textContent) || 0;
    
    // Animate from current to target percentage
    animateProgress(currentPercentage, targetPercentage);
}

function animateProgress(start, end) {
    const duration = 500; // Animation duration in ms
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easeInOutCubic for smooth animation
        const easing = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        const current = start + (end - start) * easing;
        
        // Update progress bar and text
        elements.loadingProgressBar.style.width = `${current}%`;
        elements.loadingPercentage.textContent = `${Math.round(current)}%`;
        
        // Continue animation if not complete
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
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
            }, 300); // Match the hideLoading animation duration
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
function showNotification(message, type = 'success', duration = 3000) {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create a new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // For transcription responses, truncate if too long but provide full content on hover
    let displayMessage = message;
    let fullMessage = message;
    
    if (message.startsWith("Transcription:") && message.length > 150) {
        const prefix = "Transcription: ";
        const truncatedContent = message.substring(prefix.length, prefix.length + 147) + "...";
        displayMessage = prefix + truncatedContent;
        fullMessage = message;
        notification.title = message; // Show full message on hover
    }
    
    notification.textContent = displayMessage;
    
    // Add view full button for longer messages
    if (message.length > 150) {
        notification.style.cursor = 'pointer';
        notification.addEventListener('click', () => {
            alert(fullMessage);
        });
    }
    
    document.body.appendChild(notification);
    
    // Auto-hide after duration
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, duration);
}

function scrollToActiveStep() {
    // Find the active step based on the current path
    const activePath = router.currentPath;
    const activeSectionId = activePath.substring(1); // Remove the leading slash
    const activeSection = document.getElementById(activeSectionId);
    
    if (activeSection) {
        const headerOffset = 80; // Adjust based on your header height
        const elementPosition = activeSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

function highlightActiveStepIndicator() {
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
        const path = step.dataset.path;
        if (path === router.currentPath) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
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
    
    // Find the path for this step number
    const path = Object.entries(router.routes).find(([_, route]) => route.step === stepNumber)?.[0];
    
    // Update step indicators (now using data-path instead of data-step)
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
        if (step.dataset.path === path) {
            step.classList.add('active');
        }
    });

    // Update content sections with transition
    document.querySelectorAll('.step-content').forEach(section => {
        section.classList.remove('active');
        section.style.opacity = '0';
    });

    // Show active section with transition - using the path-based ID now
    const activeSectionId = path?.substring(1); // Remove the leading slash
    const activeSection = document.getElementById(activeSectionId);
    
    if (activeSection) {
        setTimeout(() => {
            activeSection.classList.add('active');
            activeSection.style.opacity = '1';
            activeSection.classList.add('highlight-transition');
            
            // Special handling for step 1 - make sure recording UI is visible
            if (stepNumber === 1) {
                elements.audioPreview.classList.add('hidden');
                elements.startRecordingBtn.classList.remove('hidden');
                elements.stopRecordingBtn.classList.add('hidden');
                elements.recordingIndicator.classList.add('hidden');
                elements.transcriptionContainer.classList.add('hidden');
            }
            
            setTimeout(() => {
                activeSection.classList.remove('highlight-transition');
            }, 1000);
        }, 100);
    } else {
        console.error(`Could not find section with ID: ${activeSectionId}`);
    }

    // Update URL without triggering a new navigation
    if (path && router.currentPath !== path) {
        window.history.replaceState({}, '', path);
        router.currentPath = path;
    }

    // Scroll to active section
    scrollToActiveStep();
    
    // Update completion indicators
    updateStepIndicators();
}

function goToStep(stepNumber) {
    // Find the path for the given step number
    const path = Object.entries(router.routes).find(([_, route]) => route.step === stepNumber)?.[0];
    if (path) {
        router.navigate(path);
    }
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
    console.log('Rendering big goals:', state.bigGoals);
    
    const tasksContainer = elements.tasksContainer;
    if (!tasksContainer) {
        console.error('Tasks container not found');
        return;
    }
    
    tasksContainer.innerHTML = '';
    
    if (!state.bigGoals || state.bigGoals.length === 0) {
        tasksContainer.innerHTML = '<p class="no-goals-message">No high-level tasks available.</p>';
        return;
    }

    state.bigGoals.forEach(goal => {
        const section = document.createElement('div');
        section.className = 'goal-item';
        section.dataset.goalId = goal.id;
        
        section.innerHTML = `
            <div class="goal-header">
                <h3>${goal.title}</h3>
            </div>
            <div class="goal-description">${goal.description || ''}</div>
        `;
        
        tasksContainer.appendChild(section);
    });
}

function renderSmallGoals() {
    console.log('Rendering small goals:', state.smallGoals);
    
    const smallGoalsContainer = document.getElementById('small-goals-container');
    if (!smallGoalsContainer) {
        console.error('Could not find small-goals-container');
        return;
    }

    // Clear existing content
    smallGoalsContainer.innerHTML = '';

    // If there are no big goals, show a message
    if (!state.bigGoals || state.bigGoals.length === 0) {
        console.log('No big goals found in state');
        smallGoalsContainer.innerHTML = '<p class="no-goals-message">No tasks available.</p>';
        return;
    }

    // Create sections for each big goal and its sub-tasks
    state.bigGoals.forEach((bigGoal) => {
        console.log(`Processing big goal:`, bigGoal);
        
        const section = document.createElement('div');
        section.className = 'big-goal-section';
        section.dataset.id = bigGoal.id;
        
        // Add the big goal as a card
        const bigGoalCard = document.createElement('div');
        bigGoalCard.className = 'big-goal-card';
        bigGoalCard.innerHTML = `
            <div class="goal-header">
                <h3>${bigGoal.title}</h3>
                <span class="goal-type">High-Level Task</span>
            </div>
            ${bigGoal.description ? `<div class="goal-description">${bigGoal.description}</div>` : ''}
        `;
        section.appendChild(bigGoalCard);
        
        // Create container for small goals
        const smallGoalsWrapper = document.createElement('div');
        smallGoalsWrapper.className = 'small-goals-wrapper';
        
        // Add small goals if they exist
        const smallGoals = state.smallGoals[bigGoal.id] || [];
        console.log(`Small goals for big goal ${bigGoal.id}:`, smallGoals);
        
        if (smallGoals.length > 0) {
            smallGoals.forEach(smallGoal => {
                const smallGoalCard = document.createElement('div');
                smallGoalCard.className = 'small-goal-card';
                smallGoalCard.dataset.id = smallGoal.id;
                
                smallGoalCard.innerHTML = `
                    <div class="goal-header">
                        <h4>${smallGoal.title}</h4>
                        <div class="goal-meta">
                            <span class="goal-type">Sub-Task</span>
                            <span class="goal-id">#${smallGoal.id}</span>
                        </div>
                    </div>
                    ${smallGoal.description ? `<div class="goal-description">${smallGoal.description}</div>` : ''}
                `;
                
                smallGoalsWrapper.appendChild(smallGoalCard);
            });
        } else {
            const noTasksMsg = document.createElement('p');
            noTasksMsg.className = 'no-tasks-message';
            noTasksMsg.textContent = 'No sub-tasks available.';
            smallGoalsWrapper.appendChild(noTasksMsg);
        }
        
        // Add a single modify using voice button at the top
        const topControlsContainer = document.createElement('div');
        topControlsContainer.className = 'top-task-controls';
        topControlsContainer.innerHTML = `
            <button class="btn modify-tasks-voice" title="Modify tasks using voice">
                <i class="material-icons">mic</i> Modify with Voice
            </button>
        `;
        smallGoalsWrapper.appendChild(topControlsContainer);
        
        section.appendChild(smallGoalsWrapper);
        smallGoalsContainer.appendChild(section);
    });
}

function renderIssuesPreview() {
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
    const promptInput = elements.promptInput.value.trim();
    
    if (!promptInput) {
        showNotification('Please enter a project description', 'warning');
        return;
    }
    
    showLoading('Analyzing your project description...', 10);
    
    try {
        console.log('Sending prompt for analysis:', promptInput);
        
        // Make API request to analyze the prompt
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptInput })
        });
        
        if (!response.ok) {
            throw new Error('Failed to analyze prompt');
        }
        
        const data = await response.json();
        console.log('API Response data:', data);

        // Update taskState with the response data
        taskState.updateTasks(data);
        
        // Navigate to the tasks page
        router.navigate('/tasks');
        showNotification('Tasks generated successfully!', 'success');
        
        hideLoading();
    } catch (error) {
        console.error('Error in analyzePrompt:', error);
        hideLoading();
        showNotification(`Failed to analyze prompt: ${error.message}`, 'error');
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
    console.log('Starting repository creation...');
    console.log('Elements:', elements);
    
    // Check if elements are available
    if (!elements.repoNameInput) {
        console.error('Repository name input element not found!');
        showNotification('Error: Repository name input element not found', 'error');
        return;
    }
    
    const repoName = elements.repoNameInput.value.trim();
    const repoDesc = elements.repoDescriptionInput ? elements.repoDescriptionInput.value.trim() : '';
    
    console.log('Inputs:', { repoName, repoDesc });
    
    if (!repoName) {
        console.warn('Repository name is empty');
        showNotification('Please enter a repository name', 'warning');
        return;
    }
    
    showLoading('Creating GitHub repository...', 10);
    
    try {
        const payload = {
            repo_name: repoName,
            repo_description: repoDesc
        };
        console.log('Sending repository creation payload:', payload);
        
        const result = await fetchAPI('create-repository', 'POST', payload);
        
        console.log('Repository created successfully:', result);
        state.repository = result.repository;
        updateStepCompletion(4, true);
        saveStateToLocalStorage();
        
        // Navigate to create issues page
        router.navigate('/create-issues');
        showNotification('Repository created successfully!', 'success');
    } catch (error) {
        console.error('Repository creation error:', error);
        hideLoading();
        showNotification('Failed to create repository: ' + error.message, 'error');
    }
}

async function createIssues() {
    if (!state.repository) {
        showNotification('Repository not created yet', 'warning');
        return;
    }
    
    try {
        showLoading('Creating GitHub issues...', 10);
        
        // Get tasks from taskState
        const tasks = taskState.getTasks();
        if (!tasks || tasks.length === 0) {
            throw new Error('No tasks available to create issues');
        }

        console.log('Creating issues for tasks:', tasks);
        
        // Process each task sequentially
        const totalTasks = tasks.length;
        const progressPerTask = 80 / totalTasks; // 80% of progress bar for task processing
        
        for (let i = 0; i < totalTasks; i++) {
            const task = tasks[i];
            const baseProgress = 10 + (i * progressPerTask);
            
            // Update loading message
            elements.loadingMessage.textContent = `Creating issue for: "${task.title}"`;
            updateLoadingPercentage(baseProgress);
            
            // Create parent issue
            const repoName = state.repository.name;
            const parentIssue = await fetch(`/api/repository/${repoName}/issues`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: task.title,
                    body: task.description 
                })
            }).then(res => res.json());
            
            if (!parentIssue || parentIssue.error) {
                throw new Error(`Failed to create parent issue: ${parentIssue?.error || 'Unknown error'}`);
            }
            
            console.log('Created parent issue:', parentIssue);
            
            // Create sub-task issues
            if (task.sub_tasks && task.sub_tasks.length > 0) {
                for (const subTask of task.sub_tasks) {
                    elements.loadingMessage.textContent = `Creating sub-task: "${subTask.title}"`;
                    
                    const subTaskIssue = await fetch(`/api/repository/${repoName}/issues`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: subTask.title,
                            body: `${subTask.description}\n\nParent: #${parentIssue.number}`
                        })
                    }).then(res => res.json());
                    
                    if (!subTaskIssue || subTaskIssue.error) {
                        showNotification(`Failed to create sub-task: ${subTask.title}`, 'warning');
                    }
                    
                    console.log('Created sub-task issue:', subTaskIssue);
                }
            }
            
            updateLoadingPercentage(baseProgress + progressPerTask);
        }
        
        elements.loadingMessage.textContent = 'Finalizing issue creation...';
        updateLoadingPercentage(95);
        
        // Update UI and show success message
        setTimeout(() => {
            hideLoading();
            router.navigate('/results');
            showNotification('All issues created successfully!', 'success');
        }, 500);
        
    } catch (error) {
        console.error('Error creating issues:', error);
        hideLoading();
        showNotification(error.message || 'Failed to create issues', 'error');
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
        const lastGoal = elements.tasksContainer.querySelector('.goal-item:last-of-type');
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
        const sections = elements.tasksContainer.querySelectorAll('.big-goal-section');
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
        3: { bigGoals: [], smallGoals: {} },
        4: { name: '', description: '' },
        5: { name: '', description: '' }
    };
    
    // Reset work allocation
    state.workAllocation = {
        developers: [],
        taskAssignments: []
    };
    
    // Hide gantt chart
    if (elements.ganttChartContainer) {
        elements.ganttChartContainer.classList.add('hidden');
        elements.ganttChartContainer.classList.remove('show');
    }
    
    // Reset form inputs
    elements.promptInput.value = '';
    elements.repoNameInput.value = '';
    elements.repoDescriptionInput.value = '';
    
    // Clear local storage
    localStorage.removeItem('githubManagerState');
    localStorage.removeItem('sidebarCollapsed');
    localStorage.removeItem('workAllocationData');
    
    // Reset UI
    renderBigGoals();
    renderSmallGoals();
    updateGraph();
    updateStepIndicators();
    
    // Make sure New Project mode is active
    elements.newProjectMode.classList.add('active');
    elements.existingProjectMode.classList.remove('active');
    elements.repoSelector.classList.add('hidden');
    
    // Show notification
    showNotification('Application has been reset', 'success');
    
    // Navigate to first step - use router.navigate directly to avoid circular reference
    window.history.pushState({}, '', '/new-proj');
    router.currentPath = '/new-proj';
    updateActiveStep(1);
    highlightActiveStepIndicator();
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
    
    // Voice input and instructions navigation
    elements.skipToInstructionsBtn.addEventListener('click', () => router.navigate('/instructions'));
    elements.backToVoiceBtn.addEventListener('click', () => router.navigate('/new-proj'));

    // Navigation between steps
    elements.analyzeBtn.addEventListener('click', async () => {
        await analyzePrompt();
        router.navigate('/tasks');
    });
    elements.backToPromptBtn.addEventListener('click', () => router.navigate('/instructions'));
    elements.proceedToRepoBtn.addEventListener('click', () => router.navigate('/new-repo'));
    elements.createRepoBtn.addEventListener('click', async () => {
        await createRepository();
        router.navigate('/create-issues');
    });
    elements.createIssuesBtn.addEventListener('click', createIssues);
    elements.startOverBtn.addEventListener('click', resetApplication);
    
    // Step indicator navigation
    elements.steps.forEach((step, index) => {
        step.addEventListener('click', (e) => {
            const path = e.currentTarget.dataset.path;
            if (path) {
                router.navigate(path);
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

    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Add ripple effect to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.classList.add('btn-ripple');
        button.addEventListener('click', createRippleEffect);
    });

    // Mode selector event listeners
    elements.newProjectMode.addEventListener('click', () => {
        elements.newProjectMode.classList.add('active');
        elements.existingProjectMode.classList.remove('active');
        elements.repoSelector.classList.add('hidden');
        hideAllSteps();
        showStep(1);
    });

    elements.existingProjectMode.addEventListener('click', () => {
        elements.existingProjectMode.classList.add('active');
        elements.newProjectMode.classList.remove('active');
        elements.repoSelector.classList.remove('hidden');
        hideAllSteps();
        loadRepositories();
    });

    // Repository search functionality
    elements.repoSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        elements.reposList.querySelectorAll('.repository-item').forEach(item => {
            const repoName = item.querySelector('.repository-name').textContent.toLowerCase();
            const repoDesc = item.querySelector('.repository-description').textContent.toLowerCase();
            item.style.display = repoName.includes(searchTerm) || repoDesc.includes(searchTerm) ? '' : 'none';
        });
    });

    // Load repositories button
    elements.loadReposBtn.addEventListener('click', loadRepositories);

    // Create repository event listener
    const createRepoBtn = document.getElementById('create-repo-btn');
    if (createRepoBtn) {
        console.log('Setting up create-repo-btn event listener');
        createRepoBtn.addEventListener('click', async () => {
            console.log('Create repository button clicked');
            // Validate form fields
            const repoName = document.getElementById('repo-name').value.trim();
            const repoDesc = document.getElementById('repo-description').value.trim();
            
            console.log('Form values:', { repoName, repoDesc });
            
            if (!repoName) {
                showNotification('Please enter a repository name', 'warning');
                return;
            }
            
            try {
                await createRepository();
            } catch (error) {
                console.error('Error in create repo handler:', error);
                showNotification('Failed to create repository: ' + error.message, 'error');
            }
        });
    } else {
        console.error('Create repository button not found!');
    }
}

function createRippleEffect(event) {
    const button = event.currentTarget;
    
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    
    const rect = button.getBoundingClientRect();
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    button.appendChild(ripple);
    
    // Remove ripple after animation completes
    setTimeout(() => {
        ripple.remove();
    }, 1000);
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
    
    // Initialize work allocation
    setupWorkAllocation();
    
    // Initialize router
    router.init();
    
    // Show tree view by default
    switchView('tree');
    
    // Load saved state from localStorage
    loadStateFromLocalStorage();
    
    // Load saved work allocation data
    loadWorkAllocationData();
    
    // Debug repository form when it's shown
    router.routes['/new-repo'].onEnter = () => {
        updateActiveStep(4);
        console.log('Repository form shown - checking elements:');
        console.log('repo-name element:', document.getElementById('repo-name'));
        console.log('repo-description element:', document.getElementById('repo-description'));
        console.log('create-repo-btn element:', document.getElementById('create-repo-btn'));
    };
}

// Set up sidebar toggle functionality
function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const toggleIcon = toggleBtn.querySelector('i');
    const appContent = document.querySelector('.app-content');
    const mainContent = document.querySelector('.main-content');
    
    // Check if sidebar state is saved in localStorage
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    // Update toggle icon based on sidebar state
    function updateToggleIcon() {
        if (sidebar.classList.contains('collapsed')) {
            toggleIcon.textContent = 'menu';
        } else {
            toggleIcon.textContent = 'menu_open';
        }
    }
    
    // Function to check if we're on mobile view
    function checkMobileView() {
        const isMobile = window.innerWidth <= 1024;
        
        if (isMobile) {
            sidebar.classList.add('collapsed');
            if (mainContent) mainContent.classList.add('expanded');
            if (appContent) appContent.classList.add('expanded');
        } else {
            // Only apply saved state if we're not on mobile
            if (!sidebarCollapsed) {
                sidebar.classList.remove('collapsed');
                if (mainContent) mainContent.classList.remove('expanded');
                if (appContent) appContent.classList.remove('expanded');
            } else {
                sidebar.classList.add('collapsed');
                if (mainContent) mainContent.classList.add('expanded');
                if (appContent) appContent.classList.add('expanded');
            }
        }
        
        // Update icon after sidebar state changes
        updateToggleIcon();
    }
    
    // Initial mobile check
    checkMobileView();
    
    // Check mobile view on window resize
    window.addEventListener('resize', checkMobileView);
    
    // Add toggle event
    toggleBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent propagation to document click handler
        
        sidebar.classList.toggle('collapsed');
        if (mainContent) mainContent.classList.toggle('expanded');
        if (appContent) appContent.classList.toggle('expanded');
        
        // Update icon after toggling
        updateToggleIcon();
        
        // Close mobile sidebar when clicking elsewhere on mobile
        if (window.innerWidth <= 1024 && !sidebar.classList.contains('collapsed')) {
            sidebar.classList.add('mobile-visible');
        } else {
            sidebar.classList.remove('mobile-visible');
        }
        
        // Save state to localStorage
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });
    
    // Close mobile sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        const isMobile = window.innerWidth <= 1024;
        if (isMobile && 
            !sidebar.contains(event.target) && 
            !toggleBtn.contains(event.target) &&
            sidebar.classList.contains('mobile-visible')) {
            sidebar.classList.add('collapsed');
            sidebar.classList.remove('mobile-visible');
            if (mainContent) mainContent.classList.add('expanded');
            if (appContent) appContent.classList.add('expanded');
            
            // Update icon after closing sidebar
            updateToggleIcon();
        }
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
            if (data && data.bigGoals) {
                state.savedInputs[3] = data.bigGoals;
            } else {
                state.savedInputs[3] = [...state.bigGoals];
            }
            break;
        case 4:
            // Save small goals
            if (data && data.smallGoals) {
                state.savedInputs[4] = data.smallGoals;
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
            // Render results if we have repository and issues
            if (state.repository && state.issues && state.issues.length > 0) {
                renderResults();
            }
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
            issues: state.issues,
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
            state.issues = parsedState.issues || [];
            state.stepsCompleted = parsedState.stepsCompleted || { 
                1: false, 2: false, 3: false, 4: false, 5: false, 6: false 
            };
            state.savedInputs = parsedState.savedInputs || { 
                1: '', 2: '', 3: { bigGoals: [], smallGoals: {} }, 4: { name: '', description: '' }, 5: { name: '', description: '' } 
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
            
            // If we have a repository, mark step 5 as completed
            if (state.repository) {
                state.stepsCompleted[5] = true;
            }
            
            // If we have issues, mark step 6 as completed
            if (state.issues && state.issues.length > 0) {
                state.stepsCompleted[6] = true;
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

function renderTasks() {
    const container = document.getElementById('tasks-container');
    container.innerHTML = '';
    
    // Render high-level tasks
    state.bigGoals.forEach(goal => {
        const section = document.createElement('div');
        section.className = 'task-section';
        section.dataset.id = goal.id;
        
        // Create high-level task header
        const header = document.createElement('div');
        header.className = 'task-header';
        header.innerHTML = `
            <div class="task-input-group">
                <input type="text" class="task-title" value="${goal.title}" placeholder="Task title">
                <textarea class="task-description" placeholder="Task description">${goal.description}</textarea>
            </div>
            <div class="task-actions">
                <button class="btn-icon voice-ai" title="Voice AI Chat">
                    <i class="material-icons">mic</i>
                </button>
                <button class="btn-icon generate-subtasks" title="Generate Sub-tasks with AI">
                    <i class="material-icons">auto_awesome</i>
                </button>
                <button class="btn-icon add-subtask" title="Add Sub-task">
                    <i class="material-icons">add_task</i>
                </button>
                <button class="btn-icon delete-task" title="Delete Task">
                    <i class="material-icons">delete</i>
                </button>
            </div>
        `;
        
        // Create sub-tasks container
        const subTasksContainer = document.createElement('div');
        subTasksContainer.className = 'subtasks-container';
        
        // Render sub-tasks if they exist
        const subTasks = state.smallGoals[goal.id] || [];
        subTasks.forEach(subTask => {
            const subTaskElement = document.createElement('div');
            subTaskElement.className = 'subtask';
            subTaskElement.dataset.id = subTask.id;
            subTaskElement.innerHTML = `
                <div class="task-input-group">
                    <input type="text" class="task-title" value="${subTask.title}" placeholder="Sub-task title">
                    <textarea class="task-description" placeholder="Sub-task description">${subTask.description}</textarea>
                </div>
                <div class="task-actions">
                    <button class="btn-icon delete-subtask" title="Delete Sub-task">
                        <i class="material-icons">delete</i>
                    </button>
                </div>
            `;
            subTasksContainer.appendChild(subTaskElement);
        });
        
        section.appendChild(header);
        section.appendChild(subTasksContainer);
        container.appendChild(section);
    });
    
    // Add "Add Task" button
    const addButton = document.createElement('button');
    addButton.className = 'btn secondary add-task-btn';
    addButton.innerHTML = '<i class="material-icons">add</i> Add High-Level Task';
    addButton.addEventListener('click', addNewTask);
    container.appendChild(addButton);
    
    // Add event listeners
    addTaskEventListeners();
}

function addTaskEventListeners() {
    // Add voice AI button handlers
    document.querySelectorAll('.voice-ai').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            const taskSection = e.currentTarget.closest('.task-section');
            const taskId = parseInt(taskSection.dataset.id);
            
            if (e.currentTarget.classList.contains('active')) {
                stopVoiceChat(taskId);
            } else {
                startVoiceChat(taskId);
            }
        });
    });
    
    // Add modify tasks voice button handlers
    document.querySelectorAll('.modify-tasks-voice').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            if (e.currentTarget.classList.contains('recording')) {
                stopTaskModificationRecording();
            } else {
                startTaskModificationRecording();
            }
        });
    });
    
    // Add AI generation button handlers
    document.querySelectorAll('.generate-subtasks').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const taskSection = e.target.closest('.task-section');
            const taskId = parseInt(taskSection.dataset.id);
            await generateSubtasksForTask(taskId);
        });
    });
    
    // Add sub-task button handlers
    document.querySelectorAll('.add-subtask').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskSection = e.target.closest('.task-section');
            const taskId = parseInt(taskSection.dataset.id);
            addNewSubTask(taskId);
        });
    });
    
    // Delete task button handlers
    document.querySelectorAll('.delete-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskSection = e.target.closest('.task-section');
            const taskId = parseInt(taskSection.dataset.id);
            deleteTask(taskId);
        });
    });
    
    // Delete sub-task button handlers
    document.querySelectorAll('.delete-subtask').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const subtask = e.target.closest('.subtask');
            const taskSection = subtask.closest('.task-section');
            const taskId = parseInt(taskSection.dataset.id);
            const subtaskId = parseInt(subtask.dataset.id);
            deleteSubTask(taskId, subtaskId);
        });
    });
    
    // Input change handlers
    document.querySelectorAll('.task-title, .task-description').forEach(input => {
        input.addEventListener('change', saveTasksState);
    });
}

function addNewTask() {
    const newId = state.bigGoals.length > 0 
        ? Math.max(...state.bigGoals.map(g => g.id)) + 1 
        : 1;
    
    const newTask = {
        id: newId,
        title: 'New Task',
        description: 'Describe this task'
    };
    
    state.bigGoals.push(newTask);
    state.smallGoals[newId] = [];
    
    renderTasks();
}

function addNewSubTask(taskId) {
    if (!state.smallGoals[taskId]) {
        state.smallGoals[taskId] = [];
    }
    
    const newId = state.smallGoals[taskId].length > 0 
        ? Math.max(...state.smallGoals[taskId].map(g => g.id)) + 1 
        : 101;
    
    const newSubTask = {
        id: newId,
        title: 'New Sub-task',
        description: 'Describe this sub-task'
    };
    
    state.smallGoals[taskId].push(newSubTask);
    renderTasks();
}

function deleteTask(taskId) {
    state.bigGoals = state.bigGoals.filter(goal => goal.id !== taskId);
    delete state.smallGoals[taskId];
    renderTasks();
}

function deleteSubTask(taskId, subtaskId) {
    if (state.smallGoals[taskId]) {
        state.smallGoals[taskId] = state.smallGoals[taskId].filter(task => task.id !== subtaskId);
        renderTasks();
    }
}

function saveTasksState() {
    // Save high-level tasks
    state.bigGoals = Array.from(document.querySelectorAll('.task-section')).map(section => ({
        id: parseInt(section.dataset.id),
        title: section.querySelector('.task-header .task-title').value,
        description: section.querySelector('.task-header .task-description').value
    }));
    
    // Save sub-tasks
    state.smallGoals = {};
    document.querySelectorAll('.task-section').forEach(section => {
        const taskId = parseInt(section.dataset.id);
        state.smallGoals[taskId] = Array.from(section.querySelectorAll('.subtask')).map(subtask => ({
            id: parseInt(subtask.dataset.id),
            title: subtask.querySelector('.task-title').value,
            description: subtask.querySelector('.task-description').value
        }));
    });
    
    // Save to step inputs
    state.savedInputs[3] = {
        bigGoals: state.bigGoals,
        smallGoals: state.smallGoals
    };
}

// Add new function to generate subtasks for a single task
async function generateSubtasksForTask(taskId) {
    const task = state.bigGoals.find(goal => goal.id === taskId);
    if (!task) {
        showNotification('Task not found', 'error');
        return;
    }

    showLoading(`Generating sub-tasks for "${task.title}"...`, 5);
    
    try {
        elements.loadingMessage.textContent = 'Analyzing task...';
        updateLoadingPercentage(15);
        await new Promise(resolve => setTimeout(resolve, 500));

        const response = await fetch('/api/break-down-goal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                goal_id: task.id,
                goal_title: task.title,
                goal_description: task.description
            })
        });

        updateLoadingPercentage(75);

        if (!response.ok) throw new Error('Failed to break down task');
        
        const data = await response.json();
        if (!data.smaller_goals || data.smaller_goals.length === 0) {
            hideLoading();
            showNotification(`No sub-tasks were generated for "${task.title}". Please try again.`, 'warning');
            return;
        }

        // Initialize the array for this task if it doesn't exist
        if (!state.smallGoals[task.id]) {
            state.smallGoals[task.id] = [];
        }

        // Add the smaller goals to the state
        state.smallGoals[task.id] = data.smaller_goals;
        
        elements.loadingMessage.textContent = 'Organizing sub-tasks...';
        updateLoadingPercentage(90);
        
        // Render all tasks
        renderTasks();

        // Save step data
        saveTasksState();
        
        elements.loadingMessage.textContent = 'Sub-tasks created successfully!';
        updateLoadingPercentage(100);
        
        // Hide loading with a slight delay for visual feedback
        setTimeout(() => {
            hideLoading();
            showNotification('Sub-tasks generated successfully!', 'success');
        }, 500);
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showNotification('Failed to generate sub-tasks. Please try again.', 'error');
    }
}

// Add new function for real-time voice chat
async function startVoiceChat(taskId) {
    // If voice chat is active for this task, stop it
    if (state.voiceChat.isActive && state.voiceChat.activeTaskId === taskId) {
        stopVoiceChat(taskId);
        return;
    }

    // If voice chat is active for a different task, stop it first
    if (state.voiceChat.isActive) {
        stopVoiceChat(state.voiceChat.activeTaskId);
    }

    const taskSection = document.querySelector(`.task-section[data-id="${taskId}"]`);
    if (!taskSection) return;

    const voiceBtn = taskSection.querySelector('.voice-ai');
    voiceBtn.classList.add('active');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.voiceChat.mediaRecorder = new MediaRecorder(stream);
        state.voiceChat.audioChunks = [];
        state.voiceChat.isActive = true;
        state.voiceChat.activeTaskId = taskId;

        // Initialize conversation history if not exists
        if (!state.voiceChat.conversation[taskId]) {
            state.voiceChat.conversation[taskId] = [];
        }

        state.voiceChat.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                state.voiceChat.audioChunks.push(event.data);
            }
        };

        state.voiceChat.mediaRecorder.onstop = async () => {
            if (state.voiceChat.audioChunks.length > 0) {
                const audioBlob = new Blob(state.voiceChat.audioChunks, { type: 'audio/wav' });
                state.voiceChat.audioChunks = [];
                await processVoiceChatAudio(audioBlob, taskId);
                
                // Restart recording if still active
                if (state.voiceChat.isActive && state.voiceChat.activeTaskId === taskId) {
                    state.voiceChat.mediaRecorder.start();
                }
            }
        };

        // Start recording
        state.voiceChat.mediaRecorder.start();
        
        // Show recording started notification
        showNotification('Voice chat started - listening...', 'success');
        
        // Stop and restart recording every 5 seconds
        state.voiceChat.recordingInterval = setInterval(() => {
            if (state.voiceChat.isActive && 
                state.voiceChat.activeTaskId === taskId && 
                state.voiceChat.mediaRecorder.state === 'recording') {
                state.voiceChat.mediaRecorder.stop();
            }
        }, 5000);

    } catch (error) {
        console.error('Error accessing microphone:', error);
        showNotification('Could not access microphone', 'error');
        stopVoiceChat(taskId);
    }
}

async function stopVoiceChat(taskId) {
    if (!taskId) return;

    const taskSection = document.querySelector(`.task-section[data-id="${taskId}"]`);
    if (!taskSection) return;

    const voiceBtn = taskSection.querySelector('.voice-ai');
    voiceBtn.classList.remove('active');
    
    // Clear the recording interval
    if (state.voiceChat.recordingInterval) {
        clearInterval(state.voiceChat.recordingInterval);
        state.voiceChat.recordingInterval = null;
    }
    
    // Stop the media recorder if it exists
    if (state.voiceChat.mediaRecorder) {
        if (state.voiceChat.mediaRecorder.state === 'recording') {
            state.voiceChat.mediaRecorder.stop();
        }
        state.voiceChat.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    state.voiceChat.isActive = false;
    state.voiceChat.activeTaskId = null;
    state.voiceChat.mediaRecorder = null;
    state.voiceChat.audioChunks = [];
    
    // Show stopped notification
    showNotification('Voice chat stopped', 'info');
}

async function processVoiceChatAudio(audioBlob, taskId) {
    try {
        showLoading('Processing voice chat...', 10);
        
        // Create form data with audio
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('taskId', taskId);
        formData.append('conversation', JSON.stringify(state.voiceChat.conversation[taskId] || []));

        updateLoadingPercentage(30);

        // Send to backend for processing
        const response = await fetch('/api/voice-chat', {
            method: 'POST',
            body: formData
        });

        updateLoadingPercentage(60);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to process voice chat');
        }
        
        const data = await response.json();
        
        updateLoadingPercentage(80);
        
        // Add to conversation history
        if (!state.voiceChat.conversation[taskId]) {
            state.voiceChat.conversation[taskId] = [];
        }
        
        state.voiceChat.conversation[taskId].push({
            role: 'user',
            content: data.transcription
        });
        
        if (data.response) {
            state.voiceChat.conversation[taskId].push({
                role: 'assistant',
                content: data.response
            });
        }

        // Update tasks based on AI response
        if (data.updatedTask) {
            // Update high-level task
            const taskIndex = state.bigGoals.findIndex(g => g.id === parseInt(taskId));
            if (taskIndex !== -1) {
                state.bigGoals[taskIndex] = {
                    ...state.bigGoals[taskIndex],
                    ...data.updatedTask
                };
            }
            
            // Update sub-tasks if provided
            if (data.updatedSubTasks) {
                state.smallGoals[taskId] = data.updatedSubTasks;
            }
            
            // Re-render tasks to show updates
            renderTasks();
            addTaskEventListeners();
            
            // Save state
            saveTasksState();
            
            // Show success notification
            showNotification('Task updated successfully', 'success');
        }

        updateLoadingPercentage(100);
        hideLoading();

    } catch (error) {
        console.error('Error processing voice chat:', error);
        hideLoading();
        showNotification(error.message || 'Error processing voice chat', 'error');
        
        // Stop voice chat on error
        stopVoiceChat(taskId);
    }
}

let currentRepository = null;

async function loadRepositories() {
    try {
        elements.loadReposBtn.disabled = true;
        elements.loadReposBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Loading...';
        
        const response = await fetch('/api/repositories');
        if (!response.ok) throw new Error('Failed to fetch repositories');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Failed to load repositories');
        
        displayRepositories(data.repositories);
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        elements.loadReposBtn.disabled = false;
        elements.loadReposBtn.innerHTML = '<i class="material-icons">refresh</i> Load Repositories';
    }
}

function displayRepositories(repositories) {
    elements.reposList.innerHTML = repositories.map(repo => `
        <div class="repository-item" data-repo-name="${repo.name}">
            <div class="repository-info">
                <div class="repository-name">${repo.name}</div>
                <div class="repository-description">${repo.description || 'No description'}</div>
            </div>
            <button class="btn primary">Select</button>
        </div>
    `).join('');

    elements.reposList.querySelectorAll('.repository-item').forEach(item => {
        item.addEventListener('click', () => selectRepository(item.dataset.repoName));
    });
}

// Add this new function to combine tasks into a single structure
function getUnifiedTasksJson() {
    return {
        tasks: state.bigGoals.map(bigGoal => ({
            id: bigGoal.id,
            title: bigGoal.title,
            description: bigGoal.description,
            is_parent: true,
            sub_tasks: state.smallGoals[bigGoal.id] || []
        }))
    };
}

async function selectRepository(repoName) {
    try {
        currentRepository = repoName;
        elements.repoSelector.classList.add('hidden');
        
        showLoading('Loading repository data...', 10);
        
        const tasksResponse = await fetch(`/api/repository/${repoName}/tasks`);
        if (!tasksResponse.ok) {
            throw new Error('Failed to fetch repository tasks');
        }
        
        const data = await tasksResponse.json();
        console.log('Repository tasks data:', data);
        
        // Show steps container and hide tasks container
        document.getElementById('steps-container').classList.remove('hidden');
        document.getElementById('tasks-container').classList.add('hidden');
        document.getElementById('small-goals-container').classList.remove('hidden');
        
        if (!data || !data.tasks || !Array.isArray(data.tasks)) {
            throw new Error('Invalid response format');
        }

        // Update taskState with the repository tasks
        taskState.updateTasks(data.tasks);
        
        // Show the tasks step (step 3)
        const tasksStep = document.getElementById('step-3');
        if (tasksStep) {
            tasksStep.classList.add('active');
            tasksStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Update step indicators
        elements.steps.forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) === 3) {
                step.classList.add('active');
            }
        });
        
        hideLoading();
        showNotification('Repository loaded successfully', 'success');
    } catch (error) {
        console.error('Error in selectRepository:', error);
        hideLoading();
        showNotification(error.message, 'error');
    }
}

async function loadRepositoryIssues() {
    if (!currentRepository) return;

    try {
        elements.issuesContainer.innerHTML = '<div class="loading">Loading issues...</div>';
        
        const response = await fetch(`/api/repository/${currentRepository}/issues`);
        if (!response.ok) throw new Error('Failed to fetch issues');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Failed to load issues');
        
        displayIssues(data.issues);
    } catch (error) {
        showNotification('Failed to load issues: ' + error.message, 'error');
        showNotification('Failed to update issue: ' + error.message, 'error');
    }
}

async function toggleIssueState(issueNumber) {
    const issueItem = elements.issuesContainer.querySelector(`[data-issue-number="${issueNumber}"]`);
    const currentState = issueItem.querySelector('.issue-state').textContent;
    const newState = currentState === 'open' ? 'closed' : 'open';

    try {
        const response = await fetch(`/api/repository/${currentRepository}/issues/${issueNumber}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: newState })
        });

        if (!response.ok) throw new Error('Failed to update issue state');
        
        const updatedIssue = await response.json();
        showNotification(`Issue ${newState}`, 'success');
        await loadRepositoryIssues();
    } catch (error) {
        showNotification('Failed to update issue state: ' + error.message, 'error');
    }
}

// Add event listeners
elements.loadReposBtn.addEventListener('click', loadRepositories);
elements.repoSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    elements.reposList.querySelectorAll('.repository-item').forEach(item => {
        const repoName = item.querySelector('.repository-name').textContent.toLowerCase();
        const repoDesc = item.querySelector('.repository-description').textContent.toLowerCase();
        item.style.display = repoName.includes(searchTerm) || repoDesc.includes(searchTerm) ? '' : 'none';
    });
});

elements.newProjectMode.addEventListener('click', () => {
    elements.newProjectMode.classList.add('active');
    elements.existingProjectMode.classList.remove('active');
    elements.repoSelector.classList.add('hidden');
    showStep(1);
});

elements.existingProjectMode.addEventListener('click', () => {
    elements.existingProjectMode.classList.add('active');
    elements.newProjectMode.classList.remove('active');
    elements.repoSelector.classList.remove('hidden');
    hideAllSteps();
    loadRepositories();
});

// After the showStep function
function hideAllSteps() {
    elements.stepContents.forEach(step => {
        step.classList.remove('active');
    });
    
    // Also reset step indicators
    elements.steps.forEach(step => {
        step.classList.remove('active');
    });
}

// Add event listeners for repository management
elements.backToIssuesBtn.addEventListener('click', () => {
    elements.repoSelector.classList.remove('hidden');
    hideAllSteps();
});

elements.refreshIssuesBtn.addEventListener('click', loadRepositoryIssues);

elements.createNewIssueBtn.addEventListener('click', async () => {
    const title = prompt('Enter issue title:');
    if (!title) return;

    const body = prompt('Enter issue description:');
    if (body === null) return;

    try {
        const response = await fetch(`/api/repository/${currentRepository}/issues`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body })
        });

        if (!response.ok) throw new Error('Failed to create issue');
        
        showNotification('Issue created successfully', 'success');
        await loadRepositoryIssues();
    } catch (error) {
        showNotification('Failed to create issue: ' + error.message, 'error');
    }
});

function showStep(stepNumber) {
    // Hide all steps first
    elements.stepContents.forEach(step => {
        step.classList.remove('active');
    });
    
    // Show the requested step - map step numbers to IDs
    const stepIdMap = {
        1: 'new-proj',
        2: 'instructions',
        3: 'tasks',
        4: 'new-repo',
        5: 'create-issues',
        6: 'results'
    };
    
    const stepId = stepIdMap[stepNumber];
    if (stepId) {
        const stepContent = document.getElementById(stepId);
        if (stepContent) {
            stepContent.classList.add('active');
            
            // Update step indicators
            elements.steps.forEach(step => {
                step.classList.remove('active');
                if (step.dataset.path === `/${stepId}`) {
                    step.classList.add('active');
                }
            });
        }
    }
    
    // Special handling for step 1 - make sure recording UI is visible
    if (stepNumber === 1) {
        elements.audioPreview.classList.add('hidden');
        elements.startRecordingBtn.classList.remove('hidden');
        elements.stopRecordingBtn.classList.add('hidden');
        elements.recordingIndicator.classList.add('hidden');
        elements.transcriptionContainer.classList.add('hidden');
    }
}

function displayIssues(issues) {
    elements.issuesContainer.innerHTML = issues.map(issue => `
        <div class="issue-item" data-issue-number="${issue.number}">
            <div class="issue-header">
                <h3 class="issue-title">${issue.title}</h3>
                <span class="issue-state ${issue.state}">${issue.state}</span>
            </div>
            <div class="issue-description">${issue.body || 'No description'}</div>
            <div class="issue-actions">
                <button class="btn-icon" onclick="toggleIssueState(${issue.number})">
                    <i class="material-icons">${issue.state === 'open' ? 'check_circle' : 'radio_button_unchecked'}</i>
                </button>
                <button class="btn-icon" onclick="editIssue(${issue.number})">
                    <i class="material-icons">edit</i>
                </button>
            </div>
        </div>
    `).join('') || '<div class="no-issues">No issues found</div>';
}

async function editIssue(issueNumber) {
    const issueItem = elements.issuesContainer.querySelector(`[data-issue-number="${issueNumber}"]`);
    const currentTitle = issueItem.querySelector('.issue-title').textContent;
    const currentDescription = issueItem.querySelector('.issue-description').textContent;

    const newTitle = prompt('Edit issue title:', currentTitle);
    if (newTitle === null) return; // User cancelled

    const newDescription = prompt('Edit issue description:', currentDescription);
    if (newDescription === null) return; // User cancelled

    try {
        showLoading('Updating issue...', 10);
        
        const response = await fetch(`/api/repository/${currentRepository}/issues/${issueNumber}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: newTitle,
                body: newDescription
            })
        });

        if (!response.ok) throw new Error('Failed to update issue');
        
        hideLoading();
        showNotification('Issue updated successfully', 'success');
        await loadRepositoryIssues(); // Refresh the issues list
    } catch (error) {
        hideLoading();
        showNotification('Failed to update issue: ' + error.message, 'error');
    }
}

// Add unified state management for tasks
const taskState = {
    tasksJson: '', // Store tasks as JSON string

    // Update tasks from any source (voice input or GitHub)
    updateTasks: function(tasksData) {
        console.log('Updating tasks with:', tasksData);
        
        let processedTasks = [];

        // Handle direct array format (from modify-tasks-voice endpoint)
        if (Array.isArray(tasksData)) {
            console.log('Processing direct array format');
            processedTasks = tasksData.map(task => {
                // Ensure task has the expected structure
                return {
                    id: task.id || 0,
                    title: task.title || "Untitled task",
                    description: task.description || "",
                    is_parent: task.is_parent !== undefined ? task.is_parent : true,
                    sub_tasks: Array.isArray(task.sub_tasks) ? task.sub_tasks.map(subTask => ({
                        id: subTask.id || 0,
                        title: subTask.title || "Untitled subtask",
                        description: subTask.description || ""
                    })) : []
                };
            });
        }
        // Handle /analyze API format
        else if (tasksData.big_goals && tasksData.big_goals.goals) {
            console.log('Processing /analyze API format');
            processedTasks = tasksData.big_goals.goals.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description || '',
                is_parent: true,
                sub_tasks: (task.sub_tasks || []).map(subTask => ({
                    id: subTask.id,
                    title: subTask.title,
                    description: subTask.description || ''
                }))
            }));
        }
        // Handle /tasks API format
        else if (Array.isArray(tasksData.tasks)) {
            console.log('Processing /tasks API format');
            // First, separate parent and child tasks
            const parentTasks = tasksData.tasks.filter(task => task.is_parent && task.parent_id === null);
            const childTasks = tasksData.tasks.filter(task => !task.is_parent && task.parent_id !== null);
            
            console.log('Parent tasks:', parentTasks);
            console.log('Child tasks:', childTasks);

            // Create the hierarchical structure
            processedTasks = parentTasks.map(parentTask => ({
                id: parentTask.number,
                title: parentTask.title,
                description: parentTask.body || '',
                is_parent: true,
                sub_tasks: childTasks
                    .filter(child => child.parent_id === parentTask.number)
                    .map(child => ({
                        id: child.number,
                        title: child.title,
                        description: child.body || ''
                    }))
            }));
        }
        // Handle direct goals array
        else if (Array.isArray(tasksData.goals)) {
            console.log('Processing direct goals array');
            processedTasks = tasksData.goals;
        }

        // Sort tasks by ID (ascending order)
        processedTasks.sort((a, b) => a.id - b.id);
        
        // Store as JSON string
        this.tasksJson = JSON.stringify(processedTasks);
        console.log('Updated taskState JSON:', this.tasksJson);
        
        // Save to localStorage for persistence
        localStorage.setItem('taskState', this.tasksJson);
        
        this.renderTasks();
    },

    // Get tasks as parsed object
    getTasks: function() {
        try {
            return this.tasksJson ? JSON.parse(this.tasksJson) : [];
        } catch (error) {
            console.error('Error parsing tasks JSON:', error);
            return [];
        }
    },

    // Render tasks to UI
    renderTasks: function() {
        const tasks = this.getTasks();
        const smallGoalsContainer = document.getElementById('small-goals-container');
        if (!smallGoalsContainer) {
            console.error('Could not find small-goals-container');
            return;
        }

        // Clear existing content
        smallGoalsContainer.innerHTML = '';

        // If there are no tasks, show a message
        if (!tasks || tasks.length === 0) {
            smallGoalsContainer.innerHTML = '<p class="no-goals-message">No tasks available.</p>';
            return;
        }

        // Add a single modify using voice button at the top
        const topControlsContainer = document.createElement('div');
        topControlsContainer.className = 'top-task-controls';
        topControlsContainer.innerHTML = `
            <button class="btn modify-tasks-voice" title="Modify tasks using voice">
                <i class="material-icons">mic</i> Modify with Voice
            </button>
        `;
        smallGoalsContainer.appendChild(topControlsContainer);

        // Create sections for each task and its sub-tasks
        tasks.forEach((task) => {
            console.log(`Rendering task:`, task);
            
            const section = document.createElement('div');
            section.className = 'big-goal-section';
            section.dataset.id = task.id;
            
            // Add the main task as a card
            const taskCard = document.createElement('div');
            taskCard.className = 'big-goal-card';
            taskCard.innerHTML = `
                <div class="goal-header">
                    <h3>${task.title}</h3>
                    <div class="goal-meta">
                        <span class="goal-type">High-Level Task</span>
                        <span class="goal-id">#${task.id}</span>
                    </div>
                </div>
                ${task.description ? `<div class="goal-description">${task.description}</div>` : ''}
            `;
            section.appendChild(taskCard);
            
            // Create container for sub-tasks
            const subTasksWrapper = document.createElement('div');
            subTasksWrapper.className = 'small-goals-wrapper';
            
            // Add sub-tasks if they exist
            if (task.sub_tasks && task.sub_tasks.length > 0) {
                task.sub_tasks.forEach(subTask => {
                    const subTaskCard = document.createElement('div');
                    subTaskCard.className = 'small-goal-card';
                    subTaskCard.dataset.id = subTask.id;
                    
                    subTaskCard.innerHTML = `
                        <div class="goal-header">
                            <h4>${subTask.title}</h4>
                            <div class="goal-meta">
                                <span class="goal-type">Sub-Task</span>
                                <span class="goal-id">#${subTask.id}</span>
                            </div>
                        </div>
                        ${subTask.description ? `<div class="goal-description">${subTask.description}</div>` : ''}
                    `;
                    
                    subTasksWrapper.appendChild(subTaskCard);
                });
            } else {
                const noTasksMsg = document.createElement('p');
                noTasksMsg.className = 'no-tasks-message';
                noTasksMsg.textContent = 'No sub-tasks available.';
                subTasksWrapper.appendChild(noTasksMsg);
            }
            
            section.appendChild(subTasksWrapper);
            smallGoalsContainer.appendChild(section);
        });

        // Show the small-goals-container and hide the tasks-container
        const tasksContainer = document.getElementById('tasks-container');
        if (tasksContainer) {
            tasksContainer.classList.add('hidden');
        }
        smallGoalsContainer.classList.remove('hidden');
        
        // Add event listeners to the newly created buttons
        addTaskEventListeners();
    },

    // Initialize state from localStorage if available
    init: function() {
        const savedState = localStorage.getItem('taskState');
        if (savedState) {
            this.tasksJson = savedState;
            this.renderTasks();
        }
    }
};

// Initialize taskState when the page loads
document.addEventListener('DOMContentLoaded', () => {
    taskState.init();
});

// Add at the top of the file, after the elements declaration
const router = {
    currentPath: window.location.pathname,
    routes: {
        '/new-proj': {
            step: 1,
            onEnter: () => {
                // Only update the active step without resetting the application
                updateActiveStep(1);
            }
        },
        '/instructions': {
            step: 2,
            onEnter: () => updateActiveStep(2)
        },
        '/tasks': {
            step: 3,
            onEnter: () => updateActiveStep(3)
        },
        '/new-repo': {
            step: 4,
            onEnter: () => updateActiveStep(4)
        },
        '/create-issues': {
            step: 5,
            onEnter: () => updateActiveStep(5)
        },
        '/results': {
            step: 6,
            onEnter: () => updateActiveStep(6)
        }
    },
    
    navigate(path) {
        // Update URL without page reload
        window.history.pushState({}, '', path);
        this.currentPath = path;
        
        // Find and execute the route handler
        const route = this.routes[path];
        if (route) {
            route.onEnter();
            highlightActiveStepIndicator();
        }
    },
    
    init() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.currentPath = window.location.pathname;
            const route = this.routes[this.currentPath];
            if (route) {
                route.onEnter();
                highlightActiveStepIndicator();
            }
        });
        
        // Set initial route
        const initialPath = window.location.pathname;
        if (this.routes[initialPath]) {
            this.routes[initialPath].onEnter();
        } else {
            // Default to new project if no valid route
            this.navigate('/new-proj');
        }
    }
};

// Add functions for task modification with voice
async function startTaskModificationRecording() {
    // If already recording, stop it
    if (state.taskModification.isActive) {
        stopTaskModificationRecording();
        return;
    }
    
    // Mark as active and update UI
    state.taskModification.isActive = true;
    const modifyBtn = document.querySelector('.modify-tasks-voice');
    if (modifyBtn) {
        modifyBtn.classList.add('recording');
        modifyBtn.innerHTML = '<i class="material-icons">mic</i> Listening... (Click to Stop)';
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.taskModification.mediaRecorder = new MediaRecorder(stream);
        state.taskModification.audioChunks = [];
        
        state.taskModification.mediaRecorder.addEventListener('dataavailable', event => {
            if (event.data.size > 0) {
                state.taskModification.audioChunks.push(event.data);
            }
        });
        
        state.taskModification.mediaRecorder.addEventListener('stop', () => {
            if (state.taskModification.audioChunks.length > 0) {
                const audioBlob = new Blob(state.taskModification.audioChunks, { type: 'audio/wav' });
                processTaskModificationAudio(audioBlob);
            }
        });
        
        // Start recording
        state.taskModification.mediaRecorder.start();
        showNotification('Voice modification started - Speak to modify tasks...', 'info');
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        showNotification('Could not access microphone', 'error');
        stopTaskModificationRecording();
    }
}

function stopTaskModificationRecording() {
    // Reset UI
    const modifyBtn = document.querySelector('.modify-tasks-voice');
    if (modifyBtn) {
        modifyBtn.classList.remove('recording');
        modifyBtn.innerHTML = '<i class="material-icons">mic</i> Modify with Voice';
    }
    
    // Stop the media recorder if it exists
    if (state.taskModification.mediaRecorder && state.taskModification.mediaRecorder.state === 'recording') {
        state.taskModification.mediaRecorder.stop();
        state.taskModification.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    state.taskModification.isActive = false;
    showNotification('Voice modification stopped', 'info');
}

async function processTaskModificationAudio(audioBlob) {
    try {
        showLoading('Processing your voice modifications for all tasks...', 10);
        
        // Create form data with audio and current tasks
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('currentTasks', taskState.tasksJson);
        
        updateLoadingPercentage(30);
        
        // Send to backend for processing
        const response = await fetch('/api/modify-tasks-voice', {
            method: 'POST',
            body: formData
        });
        
        updateLoadingPercentage(60);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to process audio');
        }
        
        const data = await response.json();
        updateLoadingPercentage(80);
        
        // Show transcription in notification
        if (data.transcription) {
            showNotification(`Transcription: "${data.transcription}"`, 'info', 5000);
        }
        
        // Check if transcription was an error message or indicates no changes needed
        const isErrorTranscription = data.transcription && 
            (data.transcription.startsWith("I couldn't hear") || 
             data.transcription.startsWith("There was an") ||
             data.transcription.startsWith("Failed to process") ||
             data.transcription.startsWith("Speech recognition failed"));
        
        const noChangesNeeded = data.transcription && 
            (data.transcription.startsWith("No changes are needed") ||
             data.transcription.toLowerCase().includes("no changes needed") ||
             data.transcription.toLowerCase().includes("no changes are required") ||
             data.transcription.toLowerCase().includes("no modifications needed"));
        
        // Check if the tasks have actually changed by comparing with the original JSON
        let tasksHaveChanged = false;
        if (data.updatedTasks) {
            try {
                const currentTasks = JSON.parse(taskState.tasksJson);
                const updatedTasksStr = JSON.stringify(data.updatedTasks);
                const currentTasksStr = JSON.stringify(currentTasks);
                tasksHaveChanged = updatedTasksStr !== currentTasksStr;
            } catch (e) {
                console.error("Error comparing tasks:", e);
                tasksHaveChanged = true; // Assume changes if comparison fails
            }
        }
        
        // Update tasks with the response
        if (data.updatedTasks && tasksHaveChanged && !isErrorTranscription) {
            taskState.updateTasks(data.updatedTasks);
            showNotification('All tasks updated successfully!', 'success');
        } else if (isErrorTranscription) {
            showNotification(data.transcription, 'warning');
        } else if (noChangesNeeded || !tasksHaveChanged) {
            showNotification('No changes were needed to the tasks', 'info');
        } else {
            showNotification('Tasks processed successfully', 'success');
        }
        
        updateLoadingPercentage(100);
        hideLoading();
        
        // Start recording again to allow continuous voice modification
        if (state.taskModification.isActive) {
            // Clear previous audio chunks
            state.taskModification.audioChunks = [];
            
            // Start a new recording session
            if (state.taskModification.mediaRecorder) {
                state.taskModification.mediaRecorder.start();
                showNotification('Listening for more modifications...', 'info');
            }
        }
        
    } catch (error) {
        console.error('Error processing task modification audio:', error);
        hideLoading();
        showNotification(error.message || 'Error processing audio', 'error');
        
        // Even on error, restart recording to allow the user to try again
        if (state.taskModification.isActive) {
            // Clear previous audio chunks
            state.taskModification.audioChunks = [];
            
            // Start a new recording session
            if (state.taskModification.mediaRecorder) {
                state.taskModification.mediaRecorder.start();
                showNotification('Listening for more modifications...', 'info');
            }
        }
    }
}

// Work Allocation Functions
function setupWorkAllocation() {
    console.log('Setting up work allocation...');
    
    // Ensure all elements are initialized
    elements.allocateWorkBtn = document.getElementById('allocate-work-btn');
    elements.developerModal = document.getElementById('developer-modal');
    
    if (!elements.allocateWorkBtn) {
        console.error('Allocate work button not found!');
        return;
    }
    
    console.log('Allocate work button found:', elements.allocateWorkBtn);
    
    // Show modal when allocate work button is clicked
    elements.allocateWorkBtn.addEventListener('click', () => {
        console.log('Allocate work button clicked');
        
        // Verify we have tasks to allocate
        const tasks = taskState.getTasks();
        console.log('Tasks for allocation:', tasks);
        
        if (!tasks || tasks.length === 0) {
            showNotification('No tasks available to allocate', 'warning');
            return;
        }
        
        // Show the developer modal
        showDeveloperModal();
    });
    
    // Initialize modal elements if they exist
    if (elements.developerModal) {
        console.log('Developer modal found, initializing related elements');
        
        // Close modal buttons
        elements.closeModalBtn = document.querySelector('#developer-modal .close-modal');
        elements.cancelAllocationBtn = document.getElementById('cancel-allocation-btn');
        
        if (elements.closeModalBtn) {
            elements.closeModalBtn.addEventListener('click', hideDeveloperModal);
            console.log('Close modal button listener added');
        } else {
            console.error('Close modal button not found!');
        }
        
        if (elements.cancelAllocationBtn) {
            elements.cancelAllocationBtn.addEventListener('click', hideDeveloperModal);
            console.log('Cancel allocation button listener added');
        } else {
            console.error('Cancel allocation button not found!');
        }
        
        // Number of developers input change
        elements.developerCount = document.getElementById('developer-count');
        if (elements.developerCount) {
            elements.developerCount.addEventListener('input', updateDeveloperInputs);
            console.log('Developer count input listener added');
        } else {
            console.error('Developer count input not found!');
        }
        
        // Allocate tasks button
        elements.allocateTasksBtn = document.getElementById('allocate-tasks-btn');
        if (elements.allocateTasksBtn) {
            elements.allocateTasksBtn.addEventListener('click', allocateTasks);
            console.log('Allocate tasks button listener added');
        } else {
            console.error('Allocate tasks button not found!');
        }
        
        // Developer inputs container
        elements.developerInputsContainer = document.getElementById('developer-inputs-container');
        if (!elements.developerInputsContainer) {
            console.error('Developer inputs container not found!');
        }
    } else {
        console.error('Developer modal not found in the DOM!');
    }
}

function showDeveloperModal() {
    // Make sure the modal is initialized
    if (!elements.developerModal) {
        elements.developerModal = document.getElementById('developer-modal');
        elements.closeModalBtn = document.querySelector('#developer-modal .close-modal');
        elements.developerCount = document.getElementById('developer-count');
        elements.developerInputsContainer = document.getElementById('developer-inputs-container');
        elements.cancelAllocationBtn = document.getElementById('cancel-allocation-btn');
        elements.allocateTasksBtn = document.getElementById('allocate-tasks-btn');
    }
    
    if (!elements.developerModal) {
        console.error('Developer modal not found in the DOM');
        showNotification('Error showing developer modal', 'error');
        return;
    }
    
    // Make modal visible 
    elements.developerModal.classList.remove('hidden');
    elements.developerModal.style.display = 'flex';
    setTimeout(() => {
        elements.developerModal.classList.add('show');
    }, 10);
    
    // Reset inputs
    elements.developerCount.value = 1;
    updateDeveloperInputs();
}

function hideDeveloperModal() {
    if (elements.developerModal) {
        elements.developerModal.classList.remove('show');
        elements.developerModal.classList.add('hidden');
        setTimeout(() => {
            elements.developerModal.style.display = 'none';
        }, 300); // Match transition duration
    }
}

function updateDeveloperInputs() {
    const count = parseInt(elements.developerCount.value) || 1;
    elements.developerInputsContainer.innerHTML = '';
    
    for (let i = 1; i <= count; i++) {
        const developerInput = document.createElement('div');
        developerInput.className = 'developer-input';
        developerInput.dataset.id = i;
        
        developerInput.innerHTML = `
            <h4>Developer ${i}</h4>
            <div class="form-group">
                <label for="developer-name-${i}">Name:</label>
                <input type="text" id="developer-name-${i}" placeholder="Developer name" value="Developer ${i}">
            </div>
            <div class="form-group">
                <label for="developer-hours-${i}">Available Hours per Week:</label>
                <input type="number" id="developer-hours-${i}" min="1" max="80" value="40">
            </div>
        `;
        
        elements.developerInputsContainer.appendChild(developerInput);
    }
}

function collectDeveloperData() {
    const developerInputs = elements.developerInputsContainer.querySelectorAll('.developer-input');
    const developers = [];
    
    developerInputs.forEach(input => {
        const id = parseInt(input.dataset.id);
        const name = input.querySelector(`#developer-name-${id}`).value.trim() || `Developer ${id}`;
        const hoursPerWeek = parseInt(input.querySelector(`#developer-hours-${id}`).value) || 40;
        
        developers.push({
            id,
            name,
            hoursPerWeek,
            availableHours: hoursPerWeek, // Initially available hours equals total hours
            tasks: [] // Will hold assigned tasks
        });
    });
    
    return developers;
}

function estimateTaskDuration(task) {
    // Check if we should call Azure AI for estimations
    const useAzureAI = false; // Set to true if we want to use Azure AI
    
    if (useAzureAI) {
        // This would be the implementation for Azure AI
        // For now, we'll use a more sophisticated local estimation
        return estimateTaskDurationLocally(task);
    } else {
        return estimateTaskDurationLocally(task);
    }
}

function estimateTaskDurationLocally(task) {
    // More sophisticated estimation logic
    
    // Base hours depend on whether it's a task with or without subtasks
    let baseHours = 4; // Default base time for any task
    
    // Analyze description complexity
    const description = task.description || '';
    const title = task.title || '';
    const combinedText = `${title} ${description}`;
    
    // Complexity factors
    const lengthFactor = Math.log(combinedText.length + 1) / 4; // Logarithmic scaling for text length
    
    // Keyword-based complexity adjustment
    const complexityKeywords = [
        'complex', 'difficult', 'challenging', 'architecture', 'system', 
        'integrate', 'authentication', 'security', 'database', 'optimization',
        'algorithm', 'refactor', 'redesign', 'implement', 'create'
    ];
    
    const simplicityKeywords = [
        'simple', 'easy', 'basic', 'quick', 'small', 'minor', 'fix', 
        'update', 'change', 'modify', 'adjust', 'tweak'
    ];
    
    let keywordMultiplier = 1.0;
    
    // Check for complexity keywords
    complexityKeywords.forEach(keyword => {
        if (combinedText.toLowerCase().includes(keyword)) {
            keywordMultiplier += 0.15; // 15% increase per complexity keyword
        }
    });
    
    // Check for simplicity keywords
    simplicityKeywords.forEach(keyword => {
        if (combinedText.toLowerCase().includes(keyword)) {
            keywordMultiplier -= 0.1; // 10% decrease per simplicity keyword
        }
    });
    
    keywordMultiplier = Math.max(0.5, Math.min(2.5, keywordMultiplier)); // Limit range between 0.5x and 2.5x
    
    // Calculate base estimation
    let estimatedHours = baseHours * (1 + lengthFactor) * keywordMultiplier;
    
    // If it's a subtask, we generally estimate it smaller
    if (task.isSubtask) {
        estimatedHours *= 0.6; // Subtasks take about 60% of the time of main tasks
    }
    
    // If this task has subtasks, add their estimated time (if not already calculated)
    if (task.sub_tasks && task.sub_tasks.length > 0) {
        // Don't count subtasks if they're being independently allocated
        // Just use this task as a container/parent with minimal time
        estimatedHours = Math.max(estimatedHours, 2); // Minimum 2 hours for parent tasks
    }
    
    // Round to nearest half hour and set reasonable limits
    estimatedHours = Math.round(estimatedHours * 2) / 2;
    return Math.min(40, Math.max(1, estimatedHours)); // Between 1 and 40 hours
}

function allocateTasks() {
    // Get developers
    const developers = collectDeveloperData();
    
    // Get tasks from taskState
    const tasks = taskState.getTasks();
    
    if (!tasks || tasks.length === 0) {
        showNotification('No tasks available to allocate', 'warning');
        hideDeveloperModal();
        return;
    }
    
    // Prepare a flattened list of all tasks including subtasks
    const allTasks = [];
    
    // Process main tasks and their subtasks
    tasks.forEach(task => {
        // Add main task
        allTasks.push({
            id: task.id,
            title: task.title,
            description: task.description || '',
            estimatedHours: estimateTaskDuration(task),
            isSubtask: false,
            parentId: null
        });
        
        // Add subtasks if they exist
        if (task.sub_tasks && task.sub_tasks.length > 0) {
            task.sub_tasks.forEach(subtask => {
                allTasks.push({
                    id: `${task.id}-${subtask.id}`, // Create unique ID for subtask
                    title: subtask.title,
                    description: subtask.description || '',
                    estimatedHours: estimateTaskDuration(subtask) / 2, // Subtasks are typically smaller
                    isSubtask: true,
                    parentId: task.id,
                    parentTitle: task.title
                });
            });
        }
    });
    
    // Sort tasks by estimated hours (descending) but keep subtasks after their parent tasks
    allTasks.sort((a, b) => {
        // If one is a subtask and the other is not, non-subtask comes first
        if (a.isSubtask !== b.isSubtask) {
            return a.isSubtask ? 1 : -1;
        }
        
        // If both are subtasks, check if they have the same parent
        if (a.isSubtask && b.isSubtask && a.parentId !== b.parentId) {
            // Sort by parent ID to keep subtasks of the same parent together
            return a.parentId - b.parentId;
        }
        
        // Otherwise sort by estimated hours (descending)
        return b.estimatedHours - a.estimatedHours;
    });
    
    // Allocate tasks to developers
    let currentDate = new Date();
    currentDate.setHours(9, 0, 0, 0); // Start at 9 AM
    
    const taskAssignments = [];
    const workingDaysPerWeek = 5; // Mon-Fri
    const hoursPerDay = 8; // 8 hours per working day
    
    // Track developer's currently assigned tasks and end dates
    const developerEndDates = {};
    developers.forEach(dev => {
        developerEndDates[dev.id] = new Date(currentDate);
    });
    
    // Process tasks and assign to most suitable developer
    allTasks.forEach(task => {
        // Find the developer that will finish their current tasks first
        let selectedDeveloper = developers[0];
        let earliestEndDate = developerEndDates[developers[0].id];
        
        developers.forEach(dev => {
            const devEndDate = developerEndDates[dev.id];
            if (devEndDate < earliestEndDate) {
                earliestEndDate = devEndDate;
                selectedDeveloper = dev;
            }
        });
        
        // Calculate start date (when the developer will be available)
        const startDate = new Date(developerEndDates[selectedDeveloper.id]);
        
        // Calculate duration in days
        const durationInWeeks = task.estimatedHours / selectedDeveloper.hoursPerWeek;
        const durationInDays = Math.ceil(durationInWeeks * workingDaysPerWeek);
        
        // Calculate end date
        const endDate = new Date(startDate);
        
        // Add duration days (skipping weekends)
        let daysAdded = 0;
        while (daysAdded < durationInDays) {
            endDate.setDate(endDate.getDate() + 1);
            const dayOfWeek = endDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Saturday (6) and Sunday (0)
                daysAdded++;
            }
        }
        
        // Record assignment
        const assignmentTitle = task.isSubtask 
            ? `${task.parentTitle} > ${task.title}` 
            : task.title;
            
        taskAssignments.push({
            taskId: task.id,
            taskTitle: assignmentTitle,
            developerId: selectedDeveloper.id,
            developerName: selectedDeveloper.name,
            startDate,
            endDate,
            estimatedHours: task.estimatedHours,
            isSubtask: task.isSubtask,
            parentId: task.parentId
        });
        
        // Update developer's available hours
        selectedDeveloper.availableHours -= task.estimatedHours;
        if (selectedDeveloper.availableHours < 0) selectedDeveloper.availableHours = 0;
        
        // Add task to developer's tasks
        selectedDeveloper.tasks.push({
            id: task.id,
            title: assignmentTitle,
            estimatedHours: task.estimatedHours,
            startDate,
            endDate,
            isSubtask: task.isSubtask
        });
        
        // Update developer's end date for next task allocation
        developerEndDates[selectedDeveloper.id] = new Date(endDate);
    });
    
    // Save allocation to state
    state.workAllocation.developers = developers;
    state.workAllocation.taskAssignments = taskAssignments;
    
    // Save work allocation to localStorage
    saveWorkAllocationData();
    
    // Generate Gantt chart
    generateGanttChart(taskAssignments);
    
    // Hide modal
    hideDeveloperModal();
    
    // Show success message
    showNotification('Tasks have been allocated successfully', 'success');
}

function generateGanttChart(taskAssignments) {
    if (!taskAssignments || taskAssignments.length === 0) {
        showNotification('No tasks to display in Gantt chart', 'warning');
        return;
    }
    
    // Show chart container
    elements.ganttChartContainer.classList.remove('hidden');
    elements.ganttChartContainer.classList.add('show');
    
    // Destroy any existing chart
    if (window.ganttChart) {
        // If we're using the React component, unmount it
        if (window.isReactGantt) {
            GanttChartReact.unmountGanttChart(elements.ganttChartContainer);
            window.ganttChart = null;
            window.isReactGantt = false;
        } else {
            // If we're using Chart.js, destroy it
            window.ganttChart.destroy();
            window.ganttChart = null;
        }
    }
    
    // Clear the canvas if it exists
    if (elements.ganttChart) {
        const ctx = elements.ganttChart.getContext('2d');
        ctx.clearRect(0, 0, elements.ganttChart.width, elements.ganttChart.height);
    }
    
    // Save the original task assignments for filtering
    window.originalTaskAssignments = [...taskAssignments];
    
    // Use React-based gantt chart
    const handleTaskDateChange = (task) => {
        console.log('Task date changed:', task);
        // Implement date change handling logic here
    };
    
    const handleTaskClick = (task) => {
        console.log('Task clicked:', task);
        // Implement task click handling logic here
    };
    
    const handleTaskDoubleClick = (task) => {
        console.log('Task double-clicked:', task);
        // Implement task double-click handling logic here
    };
    
    // Render the React-based Gantt chart
    GanttChartReact.renderGanttChart({
        taskAssignments: taskAssignments,
        container: elements.ganttChartContainer,
        onDateChange: handleTaskDateChange,
        onTaskClick: handleTaskClick,
        onDblClick: handleTaskDoubleClick
    });
    
    // Mark that we're using the React-based Gantt chart
    window.isReactGantt = true;
    window.ganttChart = true; // Just to indicate that we have an active chart
    
    // Scroll to chart
    elements.ganttChartContainer.scrollIntoView({ behavior: 'smooth' });
}

// Save work allocation data to localStorage
function saveWorkAllocationData() {
    const workAllocationData = {
        developers: state.workAllocation.developers,
        taskAssignments: state.workAllocation.taskAssignments
    };
    
    localStorage.setItem('workAllocationData', JSON.stringify(workAllocationData));
}

// Load work allocation data from localStorage
function loadWorkAllocationData() {
    const savedData = localStorage.getItem('workAllocationData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            state.workAllocation.developers = parsedData.developers || [];
            state.workAllocation.taskAssignments = parsedData.taskAssignments || [];
            
            // If we have task assignments, regenerate the Gantt chart
            if (state.workAllocation.taskAssignments.length > 0) {
                generateGanttChart(state.workAllocation.taskAssignments);
            }
        } catch (error) {
            console.error('Error parsing work allocation data:', error);
        }
    }
}