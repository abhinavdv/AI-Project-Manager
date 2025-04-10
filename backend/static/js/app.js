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
    transcription: '', // Add this line
    
    // Theme
    theme: 'dark', // Default theme
    
    // Mode
    isNewProjectMode: true,
    
    // Step tracking
    stepsCompleted: {
        1: false, // Voice Input
        2: false, // Instructions
        3: false, // Tasks
        4: false, // Repository
        5: false, // Create Issues
        6: false  // Results
    },
    
    // Input state
    savedInputs: {
        1: '', // Voice recording/transcription
        2: '', // Prompt text
        3: { bigGoals: [], smallGoals: {} }, // Combined tasks
        4: { name: '', description: '' }, // Repository info
        5: { name: '', description: '' }  // Repository creation result
    },
    
    // Voice/audio state
    mediaRecorder: null,
    audioChunks: [],
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
    ganttModification: {
        isActive: false,
        mediaRecorder: null,
        audioChunks: []
    },
    
    // Work allocation state
    workAllocation: {
        developers: [],
        taskAssignments: [],
        ganttChartJson: ''
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
    downloadTasksBtn: document.getElementById('download-tasks-btn'),
    proceedToRepoBtn: document.getElementById('proceed-to-repo-btn'),
    updateIssuesBtn: document.getElementById('update-issues-btn'),
    
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
                    <div class="estimated-hours">Estimated Hours: ${smallGoal.estimatedHours || 'N/A'}</div>
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
            elements.loadingMessage.textContent = `Creating broad goal: "${task.title}"`;
            updateLoadingPercentage(baseProgress);
            
            // Create parent issue (broad goal)
            const repoName = state.repository.name;
            const parentResponse = await fetch(`/api/repository/${repoName}/issues`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: task.title,
                    body: task.description,
                    is_broad_goal: true,  // This is a broad goal
                    is_specific_goal: false
                })
            });
            
            if (!parentResponse.ok) {
                const errorText = await parentResponse.text();
                throw new Error(`Failed to create broad goal: ${errorText}`);
            }
            
            const parentIssue = await parentResponse.json();
            console.log('Created broad goal issue:', parentIssue);
            
            // Delay to ensure the parent issue is fully created before adding sub-issues
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Create sub-goals as sub-issues
            if (task.sub_tasks && task.sub_tasks.length > 0) {
                for (const subTask of task.sub_tasks) {
                    elements.loadingMessage.textContent = `Creating specific goal: "${subTask.title}"`;
                    
                    try {
                        const subTaskResponse = await fetch(`/api/repository/${repoName}/issues`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                title: subTask.title,
                                body: subTask.description || '',
                                is_broad_goal: false,
                                is_specific_goal: true,  // This is a specific goal
                                parent_issue_number: parentIssue.number  // Link to parent
                            })
                        });
                        
                        if (!subTaskResponse.ok) {
                            const errorText = await subTaskResponse.text();
                            console.error(`Error creating specific goal: ${errorText}`);
                            showNotification(`Failed to create specific goal: ${subTask.title}`, 'warning');
                            continue;
                        }
                        
                        const subTaskIssue = await subTaskResponse.json();
                        console.log('Created specific goal as sub-issue:', subTaskIssue);
                        
                        // Delay to ensure each sub-issue is fully processed
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (subTaskError) {
                        console.error('Error creating specific goal:', subTaskError);
                        showNotification(`Error creating specific goal: ${subTask.title}`, 'warning');
                    }
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
            showNotification('All goals created successfully as GitHub issues!', 'success');
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
        taskAssignments: [],
        ganttChartJson: ''
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
    
    // Add event listener for download tasks button
    if (elements.downloadTasksBtn) {
        elements.downloadTasksBtn.addEventListener('click', downloadTasksAsCSV);
    } else {
        console.error('Download tasks button not found in the DOM');
    }
    
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

    // Update Issues button event listener
    if (elements.updateIssuesBtn) {
        console.log('Setting up update-issues-btn event listener');
        elements.updateIssuesBtn.addEventListener('click', async () => {
            console.log('Update issues button clicked');
            await updateIssues();
        });
    }
    
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
    
    // Note: Gantt chart button event listeners are now set in setupGanttChartButtonListeners()
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
    try {
        switch (stepNum) {
            case 1:
                return (state.transcription || '').trim() !== '';
            case 2:
                return (state.prompt || '').trim() !== '';
            case 3:
                return Array.isArray(state.bigGoals) && state.bigGoals.length > 0;
            case 4:
                return Object.values(state.smallGoals || {}).some(goals => Array.isArray(goals) && goals.length > 0);
            case 5:
                return state.savedInputs && 
                       state.savedInputs[5] && 
                       ((state.savedInputs[5].name || '').trim() !== '' || 
                        (state.savedInputs[5].description || '').trim() !== '');
            case 6:
                return Array.isArray(state.issues) && state.issues.length > 0;
            default:
                return false;
        }
    } catch (error) {
        console.error('Error in hasDataForStep:', error);
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
            const errorData = await response.json();
            throw new Error(errorData.error || 'Transcription failed');
        }
        
        const result = await response.json();
        
        // Processing finished
        updateLoadingPercentage(90);
        
        // Check if the result contains an error message
        if (result.text && (
            result.text.startsWith('Speech recognition error:') ||
            result.text.startsWith('Speech recognition canceled:') ||
            result.text.startsWith('Could not recognize') ||
            result.text.startsWith('Failed to process') ||
            result.text.startsWith('There was an error')
        )) {
            throw new Error(result.text);
        }
        
        state.transcription = result.text;
        
        // Save voice input to state
        state.savedInputs[1] = state.transcription;
        updateStepCompletion(1, true);
        
        // Display transcription
        elements.transcriptionText.textContent = state.transcription;
        elements.transcriptionContainer.classList.remove('hidden');
        
        // Show success notification
        showNotification('Audio transcribed successfully!', 'success');
        
        // Completed
        updateLoadingPercentage(100);
        setTimeout(() => {
            hideLoading();
        }, 200);
        
    } catch (error) {
        console.error('Transcription error:', error);
        showNotification(error.message || 'Failed to transcribe audio. Please try again.', 'error');
        hideLoading();
        
        // Reset UI
        elements.audioPreview.classList.add('hidden');
        elements.startRecordingBtn.classList.remove('hidden');
        elements.transcriptionContainer.classList.add('hidden');
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
            const estimatedHours = subTask.estimatedHours || '';
            subTaskElement.innerHTML = `
                <div class="task-input-group">
                    <input type="text" class="task-title" value="${subTask.title}" placeholder="Sub-task title">
                    <textarea class="task-description" placeholder="Sub-task description">${subTask.description}</textarea>
                    <div class="estimated-hours-container">
                        <label for="estimated-hours-${subTask.id}">Estimated Hours:</label>
                        <input type="number" id="estimated-hours-${subTask.id}" class="estimated-hours" min="1" max="40" value="${estimatedHours}" placeholder="Hours">
                    </div>
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
            
            // Make sure taskState has the latest data before starting recording
            if (!e.currentTarget.classList.contains('recording')) {
                // Update taskState with current UI data if needed
                if (!taskState.tasksJson || taskState.tasksJson === '') {
                    const currentTasks = getUnifiedTasksJson();
                    taskState.tasksJson = JSON.stringify(currentTasks.tasks);
                    console.log('Updated taskState with current UI tasks before recording');
                }
                startTaskModificationRecording();
            } else {
                stopTaskModificationRecording();
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
        description: 'Describe this sub-task',
        estimatedHours: 4 // Default value of 4 hours
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
        state.smallGoals[taskId] = Array.from(section.querySelectorAll('.subtask')).map(subtask => {
            const subtaskId = parseInt(subtask.dataset.id);
            const estimatedHoursInput = subtask.querySelector('.estimated-hours');
            const estimatedHours = estimatedHoursInput ? parseFloat(estimatedHoursInput.value) || null : null;
            
            return {
                id: subtaskId,
                title: subtask.querySelector('.task-title').value,
                description: subtask.querySelector('.task-description').value,
                estimatedHours: estimatedHours
            };
        });
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

// Function to combine tasks into a single structure for API calls
function getUnifiedTasksJson() {
    // First check if taskState has data
    const taskStateData = taskState.getTasks();
    if (taskStateData && taskStateData.length > 0) {
        console.log('Using taskState data for unified tasks JSON');
        return {
            tasks: taskStateData
        };
    }
    
    // Fall back to state data if taskState is empty
    console.log('Using state data for unified tasks JSON');
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
        console.log(`Selecting repository: ${repoName}`);
        currentRepository = repoName;
        elements.repoSelector.classList.add('hidden');
        
        showLoading('Loading repository data...', 10);
        
        console.log(`Fetching tasks for repository: ${repoName}`);
        const tasksResponse = await fetch(`/api/repository/${repoName}/tasks`);
        if (!tasksResponse.ok) {
            console.error(`Error response from API: ${tasksResponse.status} ${tasksResponse.statusText}`);
            throw new Error(`Failed to fetch repository tasks: ${tasksResponse.statusText}`);
        }
        
        const data = await tasksResponse.json();
        console.log('Repository tasks data:', data);
        console.log('Tasks count:', data.tasks ? data.tasks.length : 0);
        
        if (!data || !data.tasks || !Array.isArray(data.tasks)) {
            throw new Error('Invalid response format');
        }
        
        // Check if there are no tasks in the repository
        if (data.tasks.length === 0) {
            throw new Error('No tasks found in this repository. Please select a repository with existing issues.');
        }
        
        // Update taskState with the repository tasks
        taskState.updateTasks({tasks: data.tasks});
        
        // Hide repository selector (with null checks)
        if (elements.repoSelector) {
            elements.repoSelector.classList.add('hidden');
        } else {
            console.warn('Repository selector element not found');
        }
        
        const modeSelector = document.getElementById('mode-selector');
        if (modeSelector) {
            modeSelector.classList.add('hidden');
        } else {
            console.warn('Mode selector element not found');
        }
        
        // Show the tasks view (with null check)
        const stepsContainer = document.getElementById('steps-container');
        if (stepsContainer) {
            stepsContainer.classList.remove('hidden');
        } else {
            console.warn('Steps container element not found');
        }
        
        // Make sure the tasks container and small-goals-container are visible
        const tasksContainer = document.getElementById('tasks');
        if (tasksContainer) {
            tasksContainer.classList.add('active');
            tasksContainer.style.opacity = '1';
        } else {
            console.warn('Tasks container element not found');
        }
        
        const smallGoalsContainer = document.getElementById('small-goals-container');
        if (smallGoalsContainer) {
            smallGoalsContainer.classList.remove('hidden');
        } else {
            console.warn('Small goals container element not found');
        }
        
        // Toggle buttons for existing project mode (with null checks)
        if (elements.proceedToRepoBtn) {
            elements.proceedToRepoBtn.classList.add('hidden');
        } else {
            console.warn('Proceed to repo button element not found');
        }
        
        if (elements.updateIssuesBtn) {
            elements.updateIssuesBtn.classList.remove('hidden');
        } else {
            console.warn('Update issues button element not found');
        }
        
        // Make sure the tasks are displayed
        taskState.renderTasks();
        
        // Update step indicators to show we're on the tasks step
        updateActiveStep(3);
        
        hideLoading();
        showNotification('Repository loaded successfully', 'success');
    } catch (error) {
        console.error('Error in selectRepository:', error);
        hideLoading();
        showNotification(error.message, 'error');
        
        // Return to home page/repository selection when there's an error
        setTimeout(() => {
            // Show repository selector again (with null checks)
            if (elements.repoSelector) {
                elements.repoSelector.classList.remove('hidden');
            }
            
            const modeSelector = document.getElementById('mode-selector');
            if (modeSelector) {
                modeSelector.classList.remove('hidden');
            }
            
            // Hide steps container (with null check)
            const stepsContainer = document.getElementById('steps-container');
            if (stepsContainer) {
                stepsContainer.classList.add('hidden');
            }
            
            // Reset current repository
            currentRepository = null;
        }, 1500); // Short delay to allow the user to read the error message
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
    
    // Toggle buttons for new project mode
    elements.proceedToRepoBtn.classList.remove('hidden');
    elements.updateIssuesBtn.classList.add('hidden');
    
    showStep(1);
});

elements.existingProjectMode.addEventListener('click', () => {
    elements.existingProjectMode.classList.add('active');
    elements.newProjectMode.classList.remove('active');
    elements.repoSelector.classList.remove('hidden');
    hideAllSteps();
    
    // Toggle buttons for existing project mode
    elements.proceedToRepoBtn.classList.add('hidden');
    elements.updateIssuesBtn.classList.remove('hidden');
    
    loadRepositories();
});

// Implement the updateIssues function for existing projects
async function updateIssues() {
    if (!currentRepository) {
        showNotification('No repository selected', 'warning');
        return;
    }
    
    try {
        showLoading('Updating GitHub issues...', 10);
        
        // Get the latest tasks data
        let tasks = taskState.getTasks();
        if (!tasks || tasks.length === 0) {
            throw new Error('No tasks available to update issues');
        }

        console.log('Tasks for updating issues:', tasks);
        
        // First, get all existing issues
        elements.loadingMessage.textContent = 'Fetching existing issues...';
        updateLoadingPercentage(15);
        
        const issuesResponse = await fetch(`/api/repository/${currentRepository}/issues`);
        if (!issuesResponse.ok) {
            throw new Error('Failed to fetch existing issues');
        }
        
        const existingIssues = await issuesResponse.json();
        console.log('Existing issues:', existingIssues);
        
        // Create a map of current task IDs (both high-level and sub-tasks)
        const currentTaskIds = new Map();
        
        // Process high-level tasks
        tasks.forEach(task => {
            // Store high-level task title as key
            currentTaskIds.set(task.title, { type: 'high-level', task });
            
            // Process sub-tasks if any
            if (task.sub_tasks && task.sub_tasks.length > 0) {
                task.sub_tasks.forEach(subTask => {
                    currentTaskIds.set(subTask.title, { type: 'sub-task', task: subTask, parentTask: task });
                });
            }
        });
        
        console.log('Current task IDs map:', Array.from(currentTaskIds.keys()));
        
        // Identify issues to delete (those not in the current task list)
        const issuesToDelete = [];
        
        for (const issue of existingIssues) {
            // Skip issues that have the same title as a current task
            if (currentTaskIds.has(issue.title)) {
                console.log(`Keeping issue #${issue.number}: ${issue.title} (matches current task)`);
                continue;
            }
            
            issuesToDelete.push(issue);
        }
        
        // Delete issues that are not in the current task list
        elements.loadingMessage.textContent = `Deleting ${issuesToDelete.length} outdated issues...`;
        updateLoadingPercentage(20);
        
        const deletionResults = { success: 0, failed: 0 };
        
        for (const issue of issuesToDelete) {
            try {
                elements.loadingMessage.textContent = `Deleting issue #${issue.number}: ${issue.title}`;
                console.log(`Deleting issue #${issue.number}: ${issue.title}`);
                
                const deleteResponse = await fetch(`/api/repository/${currentRepository}/issues/${issue.number}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (!deleteResponse.ok) {
                    console.error(`Failed to delete issue #${issue.number}:`, await deleteResponse.text());
                    showNotification(`Warning: Failed to delete issue #${issue.number}`, 'warning');
                    deletionResults.failed++;
                } else {
                    console.log(`Successfully deleted issue #${issue.number}`);
                    deletionResults.success++;
                }
                
                // Small delay to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));
                
            } catch (deleteError) {
                console.error(`Error deleting issue #${issue.number}:`, deleteError);
                showNotification(`Warning: Failed to delete issue #${issue.number}: ${deleteError.message}`, 'warning');
                deletionResults.failed++;
            }
        }
        
        // Log deletion summary
        console.log(`Deletion summary: ${deletionResults.success} deleted, ${deletionResults.failed} failed`);
        updateLoadingPercentage(25);
        
        // Now create or update issues using the current task data
        elements.loadingMessage.textContent = 'Creating/updating issues...';
        updateLoadingPercentage(30);
        
        // Get the latest tasks data right before creating issues
        // This ensures we have the most up-to-date tasks, especially after voice modifications
        tasks = taskState.getTasks();
        console.log('Creating/updating issues with latest tasks:', tasks);
        
        // If we still don't have tasks, show an error
        if (!tasks || tasks.length === 0) {
            throw new Error('No tasks available to create issues');
        }
        
        // Create a map of existing issues by title for quick lookup
        const existingIssuesByTitle = new Map();
        existingIssues.forEach(issue => {
            existingIssuesByTitle.set(issue.title, issue);
        });
        
        // Process each task sequentially
        const totalTasks = tasks.length;
        const progressPerTask = 60 / totalTasks; // 60% of progress bar for task processing
        let createdCount = 0;
        let updatedCount = 0;
        
        for (let i = 0; i < totalTasks; i++) {
            const task = tasks[i];
            const baseProgress = 30 + (i * progressPerTask);
            
            // Check if this high-level task already exists
            const existingParentIssue = existingIssuesByTitle.get(task.title);
            let parentIssue;
            
            if (existingParentIssue) {
                // Update existing parent issue if needed
                elements.loadingMessage.textContent = `Updating broad goal: "${task.title}"`;
                console.log(`Updating existing broad goal: ${task.title} (#${existingParentIssue.number})`);
                
                // Only update if description has changed
                if (existingParentIssue.body !== (task.description || '')) {
                    const updateResponse = await fetch(`/api/repository/${currentRepository}/issues/${existingParentIssue.number}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: task.title,
                            body: task.description || '',
                            is_parent: true
                        })
                    });
                    
                    if (!updateResponse.ok) {
                        console.error(`Failed to update broad goal: ${await updateResponse.text()}`);
                        showNotification(`Warning: Failed to update broad goal: ${task.title}`, 'warning');
                    } else {
                        updatedCount++;
                        console.log(`Successfully updated broad goal: ${task.title}`);
                    }
                }
                
                parentIssue = existingParentIssue;
            } else {
                // Create new parent issue
                elements.loadingMessage.textContent = `Creating broad goal: "${task.title}"`;
                updateLoadingPercentage(baseProgress);
                
                const parentResponse = await fetch(`/api/repository/${currentRepository}/issues`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        title: task.title,
                        body: task.description || '',
                        is_broad_goal: true,  // This is a broad goal
                        is_specific_goal: false
                    })
                });
                
                if (!parentResponse.ok) {
                    const errorText = await parentResponse.text();
                    console.error(`Failed to create broad goal: ${errorText}`);
                    showNotification(`Warning: Failed to create broad goal: ${task.title}`, 'warning');
                    continue; // Skip sub-tasks if parent creation fails
                }
                
                parentIssue = await parentResponse.json();
                console.log('Created broad goal issue:', parentIssue);
                createdCount++;
                
                // Delay to ensure the parent issue is fully created before adding sub-issues
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Process sub-tasks
            if (task.sub_tasks && task.sub_tasks.length > 0) {
                for (const subTask of task.sub_tasks) {
                    // Check if this sub-task already exists
                    const existingSubTask = existingIssuesByTitle.get(subTask.title);
                    
                    if (existingSubTask) {
                        // Update existing sub-task if needed
                        elements.loadingMessage.textContent = `Updating specific goal: "${subTask.title}"`;
                        console.log(`Updating existing specific goal: ${subTask.title} (#${existingSubTask.number})`);
                        
                        // Only update if description or estimated hours have changed
                        const currentDesc = subTask.description || '';
                        const currentHours = subTask.estimatedHours || null;
                        
                        if (existingSubTask.body !== currentDesc) {
                            const updateResponse = await fetch(`/api/repository/${currentRepository}/issues/${existingSubTask.number}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    title: subTask.title,
                                    body: currentDesc,
                                    is_parent: false,
                                    estimated_hours: currentHours
                                })
                            });
                            
                            if (!updateResponse.ok) {
                                console.error(`Failed to update specific goal: ${await updateResponse.text()}`);
                                showNotification(`Warning: Failed to update specific goal: ${subTask.title}`, 'warning');
                            } else {
                                updatedCount++;
                                console.log(`Successfully updated specific goal: ${subTask.title}`);
                            }
                        }
                    } else {
                        // Create new sub-task
                        elements.loadingMessage.textContent = `Creating specific goal: "${subTask.title}"`;
                        
                        try {
                            const subTaskResponse = await fetch(`/api/repository/${currentRepository}/issues`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    title: subTask.title,
                                    body: subTask.description || '',
                                    is_broad_goal: false,
                                    is_specific_goal: true,  // This is a specific goal
                                    parent_issue_number: parentIssue.number,  // Link to parent
                                    estimated_hours: subTask.estimatedHours || null  // Include estimated hours if available
                                })
                            });
                            
                            if (!subTaskResponse.ok) {
                                const errorText = await subTaskResponse.text();
                                console.error(`Error creating specific goal: ${errorText}`);
                                showNotification(`Failed to create specific goal: ${subTask.title}`, 'warning');
                                continue;
                            }
                            
                            const subTaskIssue = await subTaskResponse.json();
                            console.log('Created specific goal as sub-issue:', subTaskIssue);
                            createdCount++;
                            
                            // Delay to ensure each sub-issue is fully processed
                            await new Promise(resolve => setTimeout(resolve, 500));
                        } catch (subTaskError) {
                            console.error('Error creating specific goal:', subTaskError);
                            showNotification(`Error creating specific goal: ${subTask.title}`, 'warning');
                        }
                    }
                }
            }
            
            updateLoadingPercentage(baseProgress + progressPerTask);
        }
        
        elements.loadingMessage.textContent = 'Finalizing issue updates...';
        updateLoadingPercentage(95);
        
        // Update UI and show success message
        setTimeout(() => {
            hideLoading();
            const message = `Successfully updated repository issues: ${createdCount} created, ${updatedCount} updated, ${deletionResults.success} deleted!`;
            showNotification(message, 'success');
            loadRepositoryIssues(); // Refresh the issues list
        }, 500);
        
    } catch (error) {
        console.error('Error updating issues:', error);
        hideLoading();
        showNotification(error.message || 'Failed to update issues', 'error');
    }
}

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
        
        // Store the original tasks to preserve data that might not be in the new tasks
        const originalTasks = this.getTasks();
        const originalSubtasksMap = {};
        
        // Create a map of original subtasks by ID to preserve their estimated hours
        originalTasks.forEach(task => {
            if (task.sub_tasks && task.sub_tasks.length > 0) {
                task.sub_tasks.forEach(subtask => {
                    const subtaskKey = `${task.id}-${subtask.id}`;
                    originalSubtasksMap[subtaskKey] = subtask;
                });
            }
        });

        // Handle direct array format (from modify-tasks-voice endpoint)
        if (Array.isArray(tasksData)) {
            console.log('Processing direct array format');
            processedTasks = tasksData.map(task => {
                // Ensure task has the expected structure
                const processedTask = {
                    id: task.id || 0,
                    title: task.title || "Untitled task",
                    description: task.description || "",
                    is_parent: task.is_parent !== undefined ? task.is_parent : true,
                    sub_tasks: []
                };
                
                // Process subtasks if they exist
                if (Array.isArray(task.sub_tasks)) {
                    processedTask.sub_tasks = task.sub_tasks.map(subTask => {
                        // Try to find the original subtask to preserve estimated hours
                        const subtaskKey = `${task.id}-${subTask.id}`;
                        const originalSubtask = originalSubtasksMap[subtaskKey];
                        
                        return {
                            id: subTask.id || 0,
                            title: subTask.title || "Untitled subtask",
                            description: subTask.description || "",
                            // Preserve estimated hours if available
                            estimatedHours: subTask.estimatedHours || 
                                           (originalSubtask ? originalSubtask.estimatedHours : null)
                        };
                    });
                }
                
                return processedTask;
            });
        }
        // Handle /analyze API format
        else if (tasksData.big_goals && tasksData.big_goals.goals) {
            console.log('Processing /analyze API format');
            processedTasks = tasksData.big_goals.goals.map(task => {
                const processedTask = {
                    id: task.id,
                    title: task.title,
                    description: task.description || '',
                    is_parent: true,
                    sub_tasks: []
                };
                
                // Process subtasks if they exist
                if (task.sub_tasks && task.sub_tasks.length > 0) {
                    processedTask.sub_tasks = task.sub_tasks.map(subTask => {
                        // Try to find the original subtask to preserve estimated hours
                        const subtaskKey = `${task.id}-${subTask.id}`;
                        const originalSubtask = originalSubtasksMap[subtaskKey];
                        
                        return {
                            id: subTask.id,
                            title: subTask.title,
                            description: subTask.description || '',
                            // Preserve estimated hours if available
                            estimatedHours: subTask.estimatedHours || 
                                           (originalSubtask ? originalSubtask.estimatedHours : null)
                        };
                    });
                }
                
                return processedTask;
            });
        }
        // Handle /tasks API format
        else if (Array.isArray(tasksData.tasks)) {
            console.log('Processing /tasks API format');
            console.log('Raw tasks data:', tasksData.tasks);
            
            // First, separate parent and child tasks
            const parentTasks = tasksData.tasks.filter(task => task.is_parent || (!task.is_parent && task.parent_id === null));
            const childTasks = tasksData.tasks.filter(task => !task.is_parent && task.parent_id !== null);
            
            // Identify orphaned child tasks (those with parent_id that doesn't exist)
            const orphanedChildTasks = childTasks.filter(child => 
                !parentTasks.some(parent => parent.number === child.parent_id)
            );
            
            if (orphanedChildTasks.length > 0) {
                console.log(`Found ${orphanedChildTasks.length} orphaned child tasks without valid parents`);
            }
            
            console.log('Parent tasks:', parentTasks);
            console.log('Child tasks:', childTasks);
            console.log('Orphaned child tasks:', orphanedChildTasks);
            
            // Handle orphaned child tasks - assign them to the most appropriate parent
            if (orphanedChildTasks.length > 0 && parentTasks.length > 0) {
                // For simplicity, assign all orphaned tasks to the first parent
                // In a more sophisticated implementation, you could use content similarity
                // to find the most appropriate parent for each orphaned task
                const firstParent = parentTasks[0];
                console.log(`Assigning ${orphanedChildTasks.length} orphaned tasks to parent #${firstParent.number}`);
                
                // Update the parent_id of each orphaned task
                orphanedChildTasks.forEach(task => {
                    task.parent_id = firstParent.number;
                    console.log(`Assigned orphaned task #${task.number} to parent #${firstParent.number}`);
                });
            }
            
            // If no parent tasks were found, treat all tasks as parent tasks
            if (parentTasks.length === 0 && tasksData.tasks.length > 0) {
                console.log('No parent tasks found, treating all tasks as parents');
                processedTasks = tasksData.tasks.map(task => ({
                    id: task.number,
                    title: task.title,
                    description: task.body || '',
                    is_parent: true,
                    sub_tasks: []
                }));
            } else {
                // Create the hierarchical structure
                processedTasks = parentTasks.map(parentTask => {
                    const processedTask = {
                        id: parentTask.number,
                        title: parentTask.title,
                        description: parentTask.body || '',
                        is_parent: true,
                        number: parentTask.number, // Store issue number for updates
                        sub_tasks: []
                    };
                    
                    // Find and add subtasks
                    const taskSubtasks = childTasks.filter(child => child.parent_id === parentTask.number);
                    if (taskSubtasks.length > 0) {
                        processedTask.sub_tasks = taskSubtasks.map(child => {
                            // Try to find the original subtask to preserve estimated hours
                            const subtaskKey = `${parentTask.number}-${child.number}`;
                            const originalSubtask = originalSubtasksMap[subtaskKey];
                            
                            return {
                                id: child.number,
                                title: child.title,
                                description: child.body || '',
                                number: child.number, // Store issue number for updates
                                // Preserve estimated hours if available
                                estimatedHours: child.estimatedHours || 
                                               (originalSubtask ? originalSubtask.estimatedHours : null)
                            };
                        });
                    }
                    
                    return processedTask;
                });
            }
        }
        // Handle direct goals array
        else if (Array.isArray(tasksData.goals)) {
            console.log('Processing direct goals array');
            processedTasks = tasksData.goals.map(task => {
                const processedTask = {
                    id: task.id,
                    title: task.title,
                    description: task.description || '',
                    is_parent: true,
                    sub_tasks: []
                };
                
                // Process subtasks if they exist
                if (task.sub_tasks && task.sub_tasks.length > 0) {
                    processedTask.sub_tasks = task.sub_tasks.map(subTask => {
                        // Try to find the original subtask to preserve estimated hours
                        const subtaskKey = `${task.id}-${subTask.id}`;
                        const originalSubtask = originalSubtasksMap[subtaskKey];
                        
                        return {
                            id: subTask.id,
                            title: subTask.title,
                            description: subTask.description || '',
                            // Preserve estimated hours if available
                            estimatedHours: subTask.estimatedHours || 
                                           (originalSubtask ? originalSubtask.estimatedHours : null)
                        };
                    });
                }
                
                return processedTask;
            });
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
                    
                    // Format estimated hours display
                    const estimatedHoursDisplay = subTask.estimatedHours 
                        ? `<div class="goal-estimated-hours"><i class="material-icons">schedule</i> ${subTask.estimatedHours} hours</div>` 
                        : '';
                    
                    subTaskCard.innerHTML = `
                        <div class="goal-header">
                            <h4>${subTask.title}</h4>
                            <div class="goal-meta">
                                <span class="goal-type">Sub-Task</span>
                                <span class="goal-id">#${subTask.id}</span>
                            </div>
                        </div>
                        ${subTask.description ? `<div class="goal-description">${subTask.description}</div>` : ''}
                        ${estimatedHoursDisplay}
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
        // Check if mediaDevices is available
        if (!navigator.mediaDevices) {
            throw new Error('Media devices not available in this browser or context');
        }
        
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Create media recorder
        if (!window.MediaRecorder) {
            throw new Error('MediaRecorder not available in this browser');
        }
        
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
        showNotification(`Could not access microphone: ${error.message}`, 'error');
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
        
        // Make sure we have the latest tasks data
        if (!taskState.tasksJson || taskState.tasksJson === '') {
            // Get the current tasks from the UI if taskState is empty
            const currentTasks = getUnifiedTasksJson();
            taskState.tasksJson = JSON.stringify(currentTasks.tasks);
            console.log('Updated taskState with current UI tasks:', taskState.tasksJson);
        }
        
        // Create form data with audio and current tasks
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('currentTasks', taskState.tasksJson);
        
        console.log('Sending tasks data to backend:', taskState.tasksJson);
        updateLoadingPercentage(30);
        
        // Send to backend for processing
        const response = await fetch('/api/modify-tasks-voice', {
            method: 'POST',
            body: formData
        });
        
        updateLoadingPercentage(60);
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to process audio';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
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
                // Make sure we're comparing arrays
                const currentTasks = Array.isArray(JSON.parse(taskState.tasksJson)) 
                    ? JSON.parse(taskState.tasksJson) 
                    : [];
                    
                const updatedTasks = Array.isArray(data.updatedTasks) 
                    ? data.updatedTasks 
                    : [];
                    
                const updatedTasksStr = JSON.stringify(updatedTasks);
                const currentTasksStr = JSON.stringify(currentTasks);
                
                tasksHaveChanged = updatedTasksStr !== currentTasksStr;
                console.log('Tasks have changed:', tasksHaveChanged);
            } catch (e) {
                console.error("Error comparing tasks:", e);
                tasksHaveChanged = true; // Assume changes if comparison fails
            }
        }
        
        // Update tasks with the response
        if (data.updatedTasks && tasksHaveChanged && !isErrorTranscription) {
            console.log('Updating tasks with:', data.updatedTasks);
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
    // If there's no task or it's missing key information, return a default value
    if (!task || (!task.title && !task.description) || 
        (task.title.length < 3 && (!task.description || task.description.length < 10))) {
        return 4; // Default 4 hours
    }
    
    // If the task has an explicit estimatedHours value, use it
    if (task.estimatedHours && !isNaN(task.estimatedHours)) {
        return Math.min(40, Math.max(1, task.estimatedHours)); // Ensure between 1 and 40 hours
    }
    
    // Otherwise, compute an estimate based on text
    return estimateTaskDurationLocally(task);
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
                // Use the subtask's estimatedHours if available, otherwise estimate
                const subtaskHours = subtask.estimatedHours ? 
                    parseFloat(subtask.estimatedHours) : 
                    estimateTaskDuration(subtask);
                
                allTasks.push({
                    id: `${task.id}-${subtask.id}`, // Create unique ID for subtask
                    title: subtask.title,
                    description: subtask.description || '',
                    estimatedHours: subtaskHours,
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
    
    // Generate Gantt chart JSON
    state.workAllocation.ganttChartJson = createGanttChartJson(taskAssignments);
    
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
    
    // Convert to intermediary JSON string
    const ganttChartJson = createGanttChartJson(taskAssignments);
    
    // Store the JSON string for later use
    state.workAllocation.ganttChartJson = ganttChartJson;
    
    // Parse the JSON string back to get the task assignments
    const parsedTaskAssignments = parseGanttChartJson(ganttChartJson);
    
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
    window.originalTaskAssignments = [...parsedTaskAssignments];
    
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
        taskAssignments: parsedTaskAssignments,
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
    
    // Add the buttons directly to the DOM after rendering
    setTimeout(() => {
        injectGanttChartButtons();
    }, 500);
}

// Inject buttons directly into the Gantt chart header
function injectGanttChartButtons() {
    console.log('Injecting Gantt chart buttons');
    
    // Use a mutation observer to detect when the Gantt chart is rendered
    const injectButtons = () => {
        // Find the Gantt chart header
        const ganttHeader = document.querySelector('.gantt-chart-container .gantt-chart-header');
        if (!ganttHeader) {
            console.error('Could not find Gantt chart header');
            return false;
        }
        
        // Check if buttons already exist
        if (document.getElementById('talk-to-gantt')) {
            console.log('Buttons already exist');
            setupGanttChartButtonListeners();
            return true;
        }
        
        console.log('Found Gantt chart header, injecting buttons');
        
        // Create the buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'gantt-chart-actions';
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '10px';
        buttonsContainer.style.marginLeft = 'auto';
        buttonsContainer.style.zIndex = '10';
        
        // Create Talk to Chart button
        const talkButton = document.createElement('button');
        talkButton.id = 'talk-to-gantt';
        talkButton.className = 'btn btn-small';
        talkButton.title = 'Modify Gantt Chart with Voice';
        talkButton.style.display = 'flex';
        talkButton.style.alignItems = 'center';
        talkButton.style.gap = '5px';
        talkButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        talkButton.style.color = 'rgba(255, 255, 255, 0.8)';
        talkButton.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        talkButton.style.borderRadius = '4px';
        talkButton.style.padding = '5px 10px';
        talkButton.style.cursor = 'pointer';
        talkButton.style.minHeight = '32px';
        talkButton.innerHTML = '<i class="material-icons" style="margin-right: 4px; font-size: 16px;">mic</i> Talk to Chart';
        
        // Create Export button
        const exportButton = document.createElement('button');
        exportButton.id = 'export-gantt-json';
        exportButton.className = 'btn btn-small';
        exportButton.title = 'Export Gantt Chart';
        exportButton.style.display = 'flex';
        exportButton.style.alignItems = 'center';
        exportButton.style.gap = '5px';
        exportButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        exportButton.style.color = 'rgba(255, 255, 255, 0.8)';
        exportButton.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        exportButton.style.borderRadius = '4px';
        exportButton.style.padding = '5px 10px';
        exportButton.style.cursor = 'pointer';
        exportButton.style.minHeight = '32px';
        exportButton.innerHTML = '<i class="material-icons" style="margin-right: 4px; font-size: 16px;">file_download</i> Export';
        
        // Create Import button
        const importButton = document.createElement('button');
        importButton.id = 'import-gantt-json';
        importButton.className = 'btn btn-small';
        importButton.title = 'Import Gantt Chart';
        importButton.style.display = 'flex';
        importButton.style.alignItems = 'center';
        importButton.style.gap = '5px';
        importButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        importButton.style.color = 'rgba(255, 255, 255, 0.8)';
        importButton.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        importButton.style.borderRadius = '4px';
        importButton.style.padding = '5px 10px';
        importButton.style.cursor = 'pointer';
        importButton.style.minHeight = '32px';
        importButton.innerHTML = '<i class="material-icons" style="margin-right: 4px; font-size: 16px;">file_upload</i> Import';
        
        // Add buttons to container
        buttonsContainer.appendChild(talkButton);
        buttonsContainer.appendChild(exportButton);
        buttonsContainer.appendChild(importButton);
        
        // Add container to header
        ganttHeader.appendChild(buttonsContainer);
        
        // Add event listeners
        setupGanttChartButtonListeners();
        
        console.log('Gantt chart buttons injected successfully');
        return true;
    };
    
    // Try to inject the buttons immediately
    if (injectButtons()) {
        return;
    }
    
    // If immediate injection fails, set up a mutation observer to wait for the chart to render
    console.log('Setting up mutation observer for Gantt chart');
    const observer = new MutationObserver((mutations, obs) => {
        if (document.querySelector('.gantt-chart-container .gantt-chart-header')) {
            if (injectButtons()) {
                // If buttons were successfully injected, disconnect the observer
                obs.disconnect();
                console.log('Observer disconnected after successful injection');
            }
        }
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Set a timeout to stop the observer after 10 seconds to prevent memory leaks
    setTimeout(() => {
        observer.disconnect();
        console.log('Observer disconnected due to timeout');
    }, 10000);
}

// Set up event listeners for Gantt chart buttons
function setupGanttChartButtonListeners() {
    // Check if we have direct button access first
    const talkToGanttBtn = document.getElementById('talk-to-gantt');
    const exportGanttBtn = document.getElementById('export-gantt-json');
    const importGanttBtn = document.getElementById('import-gantt-json');
    
    // Add event listeners to buttons directly if found
    if (talkToGanttBtn) {
        talkToGanttBtn.addEventListener('click', startGanttChartModificationRecording);
        console.log('Added talk-to-gantt button listener directly');
    }
    
    if (exportGanttBtn) {
        exportGanttBtn.addEventListener('click', exportGanttChartJson);
        console.log('Added export-gantt-json button listener directly');
    }
    
    if (importGanttBtn) {
        importGanttBtn.addEventListener('click', importGanttChartJson);
        console.log('Added import-gantt-json button listener directly');
    }
    
    // Try using the React component's exposed button references as fallback
    if (window.ganttChartButtons) {
        console.log('Using button references from React component');
        
        if (window.ganttChartButtons.talkToGantt && !talkToGanttBtn) {
            window.ganttChartButtons.talkToGantt.addEventListener('click', startGanttChartModificationRecording);
            console.log('Added talk-to-gantt button listener via React ref');
        }
        
        if (window.ganttChartButtons.exportGantt && !exportGanttBtn) {
            window.ganttChartButtons.exportGantt.addEventListener('click', exportGanttChartJson);
            console.log('Added export-gantt-json button listener via React ref');
        }
        
        if (window.ganttChartButtons.importGantt && !importGanttBtn) {
            window.ganttChartButtons.importGantt.addEventListener('click', importGanttChartJson);
            console.log('Added import-gantt-json button listener via React ref');
        }
    } else {
        console.log('Button references from React component not available');
    }
}

// Convert task assignments to a JSON string for the Gantt chart
function createGanttChartJson(taskAssignments) {
    if (!taskAssignments || taskAssignments.length === 0) {
        return '';
    }
    
    // Create a copy to avoid modifying the original
    const ganttData = {
        taskAssignments: JSON.parse(JSON.stringify(taskAssignments)),
        metadata: {
            created: new Date().toISOString(),
            version: '1.0'
        }
    };
    
    return JSON.stringify(ganttData);
}

// Parse a JSON string to get task assignments for the Gantt chart
function parseGanttChartJson(jsonString) {
    if (!jsonString) {
        return [];
    }
    
    try {
        const ganttData = JSON.parse(jsonString);
        return ganttData.taskAssignments || [];
    } catch (error) {
        console.error('Error parsing Gantt chart JSON:', error);
        return [];
    }
}

// Save work allocation data to localStorage
function saveWorkAllocationData() {
    const workAllocationData = {
        developers: state.workAllocation.developers,
        taskAssignments: state.workAllocation.taskAssignments,
        ganttChartJson: state.workAllocation.ganttChartJson
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
            state.workAllocation.ganttChartJson = parsedData.ganttChartJson || '';
            
            // If we have a gantt chart JSON, use it to regenerate the chart
            if (state.workAllocation.ganttChartJson) {
                const parsedTaskAssignments = parseGanttChartJson(state.workAllocation.ganttChartJson);
                if (parsedTaskAssignments.length > 0) {
                    generateGanttChart(parsedTaskAssignments);
                }
            } 
            // Fallback to task assignments if no JSON is available
            else if (state.workAllocation.taskAssignments.length > 0) {
                generateGanttChart(state.workAllocation.taskAssignments);
            }
        } catch (error) {
            console.error('Error parsing work allocation data:', error);
        }
    }
}

// Update Gantt chart from a JSON string
function updateGanttChartFromJson(jsonString) {
    if (!jsonString) {
        showNotification('No Gantt chart data provided', 'warning');
        return false;
    }
    
    try {
        // Parse the JSON string to get task assignments
        const parsedTaskAssignments = parseGanttChartJson(jsonString);
        
        if (!parsedTaskAssignments || parsedTaskAssignments.length === 0) {
            showNotification('No tasks found in the provided Gantt chart data', 'warning');
            return false;
        }
        
        // Store the JSON string
        state.workAllocation.ganttChartJson = jsonString;
        
        // Update task assignments
        state.workAllocation.taskAssignments = parsedTaskAssignments;
        
        // Save to localStorage
        saveWorkAllocationData();
        
        // Generate the Gantt chart
        generateGanttChart(parsedTaskAssignments);
        
        showNotification('Gantt chart updated successfully', 'success');
        return true;
    } catch (error) {
        console.error('Error updating Gantt chart from JSON:', error);
        showNotification('Failed to update Gantt chart: ' + error.message, 'error');
        return false;
    }
}

// Export Gantt chart data as JSON file
function exportGanttChartJson() {
    if (!state.workAllocation.ganttChartJson) {
        showNotification('No Gantt chart data available to export', 'warning');
        return;
    }
    
    // Format the JSON for readability
    const formattedJson = JSON.stringify(JSON.parse(state.workAllocation.ganttChartJson), null, 2);
    
    // Create a blob with the JSON data
    const blob = new Blob([formattedJson], { type: 'application/json' });
    
    // Create an object URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gantt_chart_data.json';
    
    // Append to the document, click, and clean up
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Revoke the object URL to free up memory
    URL.revokeObjectURL(url);
    
    showNotification('Gantt chart data exported successfully', 'success');
}

// Import Gantt chart data from a JSON file
function importGanttChartJson() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    
    // Handle file selection
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file type
        if (file.type !== 'application/json') {
            showNotification('Please select a JSON file', 'warning');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const jsonString = e.target.result;
                // Update the Gantt chart from the imported JSON
                if (updateGanttChartFromJson(jsonString)) {
                    showNotification('Gantt chart data imported successfully', 'success');
                }
            } catch (error) {
                console.error('Error importing Gantt chart data:', error);
                showNotification('Failed to import Gantt chart data: ' + error.message, 'error');
            }
        };
        
        reader.onerror = () => {
            showNotification('Error reading the file', 'error');
        };
        
        reader.readAsText(file);
    });
    
    // Trigger file picker
    fileInput.click();
}

// Gantt Chart Voice Modification Functions
async function startGanttChartModificationRecording() {
    // If already recording, stop it
    if (state.ganttModification.isActive) {
        stopGanttChartModificationRecording();
        return;
    }
    
    // Mark as active and update UI
    state.ganttModification.isActive = true;
    const talkToGanttBtn = document.getElementById('talk-to-gantt');
    if (talkToGanttBtn) {
        talkToGanttBtn.classList.add('recording');
        talkToGanttBtn.innerHTML = '<i class="material-icons">mic</i> Listening... (Click to Stop)';
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.ganttModification.mediaRecorder = new MediaRecorder(stream);
        state.ganttModification.audioChunks = [];
        
        state.ganttModification.mediaRecorder.addEventListener('dataavailable', event => {
            if (event.data.size > 0) {
                state.ganttModification.audioChunks.push(event.data);
            }
        });
        
        state.ganttModification.mediaRecorder.addEventListener('stop', () => {
            if (state.ganttModification.audioChunks.length > 0) {
                const audioBlob = new Blob(state.ganttModification.audioChunks, { type: 'audio/wav' });
                processGanttChartModificationAudio(audioBlob);
            }
        });
        
        // Start recording
        state.ganttModification.mediaRecorder.start();
        showNotification('Voice modification for Gantt chart started - Speak to modify...', 'info');
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        showNotification('Could not access microphone', 'error');
        stopGanttChartModificationRecording();
    }
}

function stopGanttChartModificationRecording() {
    // Reset UI
    const talkToGanttBtn = document.getElementById('talk-to-gantt');
    if (talkToGanttBtn) {
        talkToGanttBtn.classList.remove('recording');
        talkToGanttBtn.innerHTML = '<i class="material-icons">mic</i> Talk to Chart';
    }
    
    // Stop the media recorder if it exists
    if (state.ganttModification.mediaRecorder && state.ganttModification.mediaRecorder.state === 'recording') {
        state.ganttModification.mediaRecorder.stop();
        state.ganttModification.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    state.ganttModification.isActive = false;
    showNotification('Voice modification for Gantt chart stopped', 'info');
}

async function processGanttChartModificationAudio(audioBlob) {
    try {
        showLoading('Processing your voice modifications for the Gantt chart...', 10);
        
        // Create form data with audio and current Gantt chart data
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('currentGanttData', state.workAllocation.ganttChartJson || '');
        
        updateLoadingPercentage(30);
        
        // Send to backend for processing
        const response = await fetch('/api/modify-gantt-voice', {
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
        
        // Check if the Gantt data has actually changed by comparing with the original JSON
        let ganttDataHasChanged = false;
        if (data.updatedGanttData) {
            try {
                const currentGanttData = state.workAllocation.ganttChartJson ? 
                    JSON.parse(state.workAllocation.ganttChartJson) : {};
                const updatedGanttDataObj = JSON.parse(data.updatedGanttData);
                const currentGanttDataStr = JSON.stringify(currentGanttData);
                const updatedGanttDataStr = JSON.stringify(updatedGanttDataObj);
                ganttDataHasChanged = updatedGanttDataStr !== currentGanttDataStr;
            } catch (e) {
                console.error("Error comparing Gantt data:", e);
                ganttDataHasChanged = true; // Assume changes if comparison fails
            }
        }
        
        // Update Gantt chart with the response
        if (data.updatedGanttData && ganttDataHasChanged && !isErrorTranscription) {
            // Update the Gantt chart with the new data
            updateGanttChartFromJson(data.updatedGanttData);
            showNotification('Gantt chart updated successfully!', 'success');
        } else if (isErrorTranscription) {
            showNotification(data.transcription, 'warning');
        } else if (noChangesNeeded || !ganttDataHasChanged) {
            showNotification('No changes were needed to the Gantt chart', 'info');
        } else {
            showNotification('Gantt chart processed successfully', 'success');
        }
        
        updateLoadingPercentage(100);
        hideLoading();
        
        // Start recording again to allow continuous voice modification
        if (state.ganttModification.isActive) {
            // Clear previous audio chunks
            state.ganttModification.audioChunks = [];
            
            // Start a new recording session
            if (state.ganttModification.mediaRecorder) {
                state.ganttModification.mediaRecorder.start();
                showNotification('Listening for more modifications...', 'info');
            }
        }
        
    } catch (error) {
        console.error('Error processing Gantt chart modification audio:', error);
        hideLoading();
        showNotification(error.message || 'Error processing audio', 'error');
        
        // Even on error, restart recording to allow the user to try again
        if (state.ganttModification.isActive) {
            // Clear previous audio chunks
            state.ganttModification.audioChunks = [];
            
            // Start a new recording session
            if (state.ganttModification.mediaRecorder) {
                state.ganttModification.mediaRecorder.start();
                showNotification('Listening for more modifications...', 'info');
            }
        }
    }
}

// Expose Gantt chart functions to window object so React can access them
window.startGanttChartModificationRecording = startGanttChartModificationRecording;
window.stopGanttChartModificationRecording = stopGanttChartModificationRecording;
window.exportGanttChartJson = exportGanttChartJson;
window.importGanttChartJson = importGanttChartJson;

// Add this after the audio recording functions

// Handle file upload with drag-and-drop support
function setupAudioUpload() {
    const uploadBtn = document.getElementById('upload-audio-btn');
    const fileInput = document.getElementById('audio-upload');
    const uploadArea = document.getElementById('upload-audio-area');
    
    // Click to upload
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Process the selected file
    async function processAudioFile(file) {
        if (!file || !file.type.startsWith('audio/')) {
            showNotification('Please select a valid audio file.', 'error');
            return;
        }
        
        try {
            // Show loading state with progress indicator
            showLoading('Processing audio file...', 10);
            
            // Update UI to show processing state
            const uploadIcon = uploadArea.querySelector('.upload-icon');
            const originalIcon = uploadIcon.textContent;
            uploadIcon.textContent = 'hourglass_top';
            uploadArea.classList.add('processing');
            
            // Create an audio blob from the file
            const audioBlob = await convertAudioToWav(file);
            
            // Update audio preview
            elements.audioPlayer.src = URL.createObjectURL(audioBlob);
            elements.audioPreview.classList.remove('hidden');
            
            // Transcribe the audio
            await transcribeAudio(audioBlob);
            
            // Reset the upload area
            uploadIcon.textContent = originalIcon;
            uploadArea.classList.remove('processing');
            
            // Show success notification
            showNotification('Audio processed successfully!', 'success');
            
        } catch (error) {
            console.error('Error processing audio file:', error);
            showNotification('Failed to process audio file. Please try again.', 'error');
            hideLoading();
            
            // Reset the upload area
            const uploadIcon = uploadArea.querySelector('.upload-icon');
            uploadIcon.textContent = 'cloud_upload';
            uploadArea.classList.remove('processing');
        }
    }
    
    // Handle file selection from input
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            processAudioFile(file);
        }
    });
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('drag-over');
        }, false);
    });
    
    // Remove highlight when item is dragged out or dropped
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('drag-over');
        }, false);
    });
    
    // Handle dropped files
    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) {
            processAudioFile(file);
        }
    }, false);
}

// Convert any audio format to WAV with required parameters
async function convertAudioToWav(audioFile) {
    return new Promise((resolve, reject) => {
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext({
                sampleRate: 16000 // Required sample rate for Azure Speech Services
            });
            
            // Create file reader
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    // Decode audio data
                    const audioData = await audioContext.decodeAudioData(e.target.result);
                    
                    // Create buffer source
                    const source = audioContext.createBufferSource();
                    source.buffer = audioData;
                    
                    // Create script processor for WAV conversion
                    const processor = audioContext.createScriptProcessor(16384, 1, 1);
                    
                    // Create WAV encoder
                    const wavEncoder = new WavEncoder({
                        sampleRate: 16000,
                        channels: 1
                    });
                    
                    // Process audio data
                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        wavEncoder.encode([inputData]);
                    };
                    
                    // Connect nodes
                    source.connect(processor);
                    processor.connect(audioContext.destination);
                    
                    // Start playback (required for processing)
                    source.start(0);
                    
                    // Wait for processing to complete
                    source.onended = () => {
                        // Get WAV data
                        const wavBlob = new Blob([wavEncoder.finish()], { type: 'audio/wav' });
                        
                        // Clean up
                        source.disconnect();
                        processor.disconnect();
                        audioContext.close();
                        
                        resolve(wavBlob);
                    };
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsArrayBuffer(audioFile);
            
        } catch (error) {
            reject(error);
        }
    });
}

// WAV encoder class
class WavEncoder {
    constructor(options = {}) {
        this.sampleRate = options.sampleRate || 16000;
        this.channels = options.channels || 1;
        this.bytes = [];
    }
    
    encode(channelData) {
        const length = channelData[0].length;
        
        // Convert float32 to int16
        for (let i = 0; i < length; i++) {
            let value = channelData[0][i];
            // Clamp value between -1 and 1
            value = Math.max(-1, Math.min(1, value));
            // Convert to int16
            value = value < 0 ? value * 0x8000 : value * 0x7FFF;
            // Write int16 to bytes
            this.bytes.push(value & 0xFF, (value >> 8) & 0xFF);
        }
    }
    
    finish() {
        const dataLength = this.bytes.length;
        const buffer = new ArrayBuffer(44 + dataLength);
        const view = new DataView(buffer);
        
        // Write WAV header
        // RIFF chunk descriptor
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        writeString(view, 8, 'WAVE');
        
        // fmt sub-chunk
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, 1, true); // audio format (PCM)
        view.setUint16(22, this.channels, true);
        view.setUint32(24, this.sampleRate, true);
        view.setUint32(28, this.sampleRate * this.channels * 2, true); // byte rate
        view.setUint16(32, this.channels * 2, true); // block align
        view.setUint16(34, 16, true); // bits per sample
        
        // data sub-chunk
        writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);
        
        // Write audio data
        for (let i = 0; i < dataLength; i++) {
            view.setUint8(44 + i, this.bytes[i]);
        }
        
        return buffer;
    }
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Function to download tasks as TXT
function downloadTasksAsCSV() {
    // Get tasks from taskState
    const tasks = taskState.getTasks();
    console.log('Download function triggered');
    console.log('Tasks from taskState:', tasks);
    
    // Check if there are tasks to download
    if (!tasks || tasks.length === 0) {
        console.error('No tasks found in taskState');
        showNotification('No tasks available to download.', 'error');
        return;
    }
    
    // Create text content with better formatting
    let textContent = 'PROJECT TASKS\n\n';
    
    // Add high-level tasks
    tasks.forEach(task => {
        textContent += `HIGH-LEVEL TASK: ${task.title}\n`;
        textContent += `ID: ${task.id}\n`;
        if (task.description) {
            textContent += `Description: ${task.description}\n`;
        }
        textContent += '\n';
        
        // Add sub-tasks for this high-level task
        const subTasks = task.sub_tasks || [];
        if (subTasks.length > 0) {
            textContent += `SUB-TASKS:\n`;
            subTasks.forEach(subTask => {
                textContent += `  - ${subTask.title}\n`;
                textContent += `    ID: ${subTask.id}\n`;
                if (subTask.description) {
                    textContent += `    Description: ${subTask.description}\n`;
                }
                if (subTask.estimatedHours) {
                    textContent += `    Estimated Hours: ${subTask.estimatedHours}\n`;
                }
                textContent += '\n';
            });
        } else {
            textContent += 'No sub-tasks defined.\n\n';
        }
        
        textContent += '-------------------------------------------\n\n';
    });
    
    // Create a blob and download link
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set link properties
    link.setAttribute('href', url);
    link.setAttribute('download', 'project_tasks.txt');
    link.style.visibility = 'hidden';
    
    // Add to document, click and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Tasks downloaded successfully!', 'success');
    console.log('Tasks downloaded as TXT file');
}

// Update init function to setup audio upload
function init() {
    setupEventListeners();
    setupScrollProgress();
    setupSidebar();
    setupGraph();
    setupWorkAllocation();
    setupAudioUpload(); // Add this line
    
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