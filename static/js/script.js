function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.step').forEach(step => {
        step.style.display = 'none';
    });
    // Show the requested step
    document.getElementById(`step${stepNumber}`).style.display = 'block';
    
    // Auto-scroll to the current step
    document.getElementById(`step${stepNumber}`).scrollIntoView({ behavior: 'smooth' });
    
    // If step 3 is shown, try to generate repository info based on prompt and goals
    if (stepNumber === 3) {
        generateRepositoryInfo();
    }
}

function confirmGoals() {
    const goals = Array.from(document.querySelectorAll('#goalsList li')).map(li => {
        const titleElem = li.querySelector('.goal-title');
        const descriptionElem = li.querySelector('.goal-description');
        return {
            title: titleElem.textContent || titleElem.innerText,
            description: descriptionElem.textContent || descriptionElem.innerText
        };
    });
    
    if (goals.length === 0) {
        showError('No goals to confirm. Please generate goals first.');
        return;
    }
    
    // Store the confirmed goals in a global variable for use later
    window.confirmedGoals = goals;
    
    // Move to the next step
    showStep(3);
}

function generateRepositoryInfo() {
    const prompt = document.getElementById('projectInstructions').value;
    const goals = window.confirmedGoals || [];
    
    if (!prompt || goals.length === 0) {
        console.log('Cannot generate repository info: missing prompt or goals');
        return;
    }
    
    // Show loading state
    document.getElementById('repoInfoLoading').style.display = 'block';
    
    // Make API call to generate repository information
    fetch('/api/generate-repo-info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: prompt,
            goals: goals
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.repo_info) {
            // Auto-populate repository fields
            document.getElementById('repositoryName').value = data.repo_info.name || '';
            document.getElementById('repositoryDescription').value = data.repo_info.description || '';
        } else if (data.error) {
            console.warn('Error generating repository info:', data.error);
        }
    })
    .catch(error => {
        console.error('Failed to generate repository info:', error);
    })
    .finally(() => {
        // Hide loading state
        document.getElementById('repoInfoLoading').style.display = 'none';
    });
}

function createRepository() {
    const repositoryName = document.getElementById('repositoryName').value.trim();
    const repositoryDescription = document.getElementById('repositoryDescription').value.trim();
    
    if (!repositoryName) {
        showError('Repository name is required.');
        return;
    }
    
    // Show loading state
    document.getElementById('createRepoButton').disabled = true;
    document.getElementById('createRepoButton').textContent = 'Creating...';
    
    // ... existing code ...
} 